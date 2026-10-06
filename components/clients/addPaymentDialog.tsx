"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { cn } from "cn";

import { addPayment } from "@/app/(private)/clients/actions";
import { BrandGlyph } from "@/components/clients/brandGlyph";
import { ReceiptMark, ReceiptRow } from "@/components/clients/earningsReceipt";
import receipt from "@/components/clients/receipt.module.css";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exactMoney } from "@/lib/format";
import { planDescription, type Client, type ClientTransaction, type PaymentKind, type PaymentMethod } from "@/lib/clients/sample";
import type { PaymentOptions } from "@/lib/clients/types";

/**
 * "Add payment" — the button and the window it opens.
 *
 * <p>Laid out in three (decided 2026-10-06): two thirds the form, one third a
 * receipt that fills in as the form does — what was paid, what it cost, what
 * it left — so the payment is checked before it exists.
 *
 * <p>⚠️ <b>The plan is picked, not typed.</b> Devices and months are the two
 * axes of Configuration's plan grid, and the plan brings its price (filled in
 * as the amount, which stays editable for a deal), its cost and its panel
 * credits. The perks below it each have a count — IBO Player per device, say.
 * A perk is only a cost: the price the client pays doesn't change.
 *
 * <p>⚠️ <b>No date field.</b> A payment is recorded as it is taken, so it is
 * dated the moment it is added. A picker would only invite back-dating.
 *
 * <p>Saved for real (`POST /api/clients/{id}/payments`): the backend reads the
 * price, cost and panel credits from Configuration again, spends the credit,
 * puts the client on the brand and makes them Active; the page then refreshes.
 */

const kinds: readonly PaymentKind[] = ["New plan", "Renewal"];

type Provider = PaymentOptions["methods"][number]["provider"];
/** The method types, in the order the switch shows them, with the names the ledger uses. */
const PROVIDERS: readonly {
  id: Provider;
  label: Exclude<PaymentMethod, "Not set">;
}[] = [
  { id: "PAYPAL", label: "PayPal" },
  { id: "INTERAC", label: "Interac" },
  { id: "DEBIT_CARD", label: "Debit card" },
  { id: "BINANCE", label: "Binance" },
];
const providerLabel = (id: Provider) => PROVIDERS.find((entry) => entry.id === id)?.label ?? "PayPal";
/** A perk count goes no higher: past that it is a typo, not an order. */
const MAX_PERK_COUNT = 20;

type Draft = {
  kind: PaymentKind;
  devices: number;
  months: number;
  /** perk id → how many. Missing = none. */
  perks: Record<number, number>;
  brandId: number | null;
  /** The type (PayPal, Interac…), then which account of it (PayPal 1 or 2). */
  provider: Provider | null;
  methodId: number | null;
  amount: string;
  /** Once the amount is typed, a new plan no longer overwrites it. */
  amountEdited: boolean;
};

/** A positive amount with up to two decimals: "3100", "49.90". */
function isValidAmount(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;
}

/** A price as the amount box writes it: "30", "49.99". */
function amountText(price: number | undefined) {
  if (price === undefined) return "";
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

const sorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

/**
 * The draft a fresh window opens on: the plan the client is on (else the first
 * one), their brand, a renewal if they already paid — so the common case is a
 * click away.
 */
function draftFor(client: Client, options: PaymentOptions, latest: ClientTransaction | undefined): Draft {
  // The account they paid to last time, else the first one there is.
  const lastAccount = latest?.account ? options.methods.find((method) => method.name === latest.account) : undefined;
  const account = lastAccount ?? options.methods[0];
  const onFile = latest && options.plans.find((plan) => plan.devices === latest.devices && plan.months === latest.months);
  const plan = onFile ?? options.plans[0];
  const brandId = client.brandId && options.brands.some((brand) => brand.id === client.brandId) ? client.brandId : (options.brands[0]?.id ?? null);
  return {
    kind: latest ? "Renewal" : "New plan",
    devices: plan?.devices ?? 1,
    months: plan?.months ?? 1,
    perks: {},
    brandId,
    provider: account?.provider ?? null,
    methodId: account?.id ?? null,
    amount: amountText(plan?.price),
    amountEdited: false,
  };
}

/** The same segmented control as the Billing switch on the Expenses tab. */
function Segmented<Value extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
  fill = false,
}: {
  label: string;
  options: readonly Value[];
  value: Value | null;
  onChange: (value: Value) => void;
  format?: (value: Value) => string;
  /** As wide as its column, the choices sharing it equally. */
  fill?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium">{label}</p>
      <div
        role="group"
        aria-label={label}
        className={cn("mt-1.5 max-w-full overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5", fill ? "flex w-full" : "inline-flex")}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={cn(
              "inline-flex h-6 shrink-0 items-center justify-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
              fill && "flex-1",
              value === option ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** − n + : how many of a perk. */
function Counter({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const step =
    "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-35";
  return (
    <div
      role="group"
      aria-label={`How many ${label}`}
      className="inline-flex shrink-0 items-center rounded-lg border border-border/60 bg-muted p-0.5"
    >
      <button type="button" className={step} aria-label={`One less ${label}`} disabled={value <= 0} onClick={() => onChange(value - 1)}>
        <Minus className="size-3" />
      </button>
      <span className="w-7 text-center text-xs font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={step} aria-label={`One more ${label}`} disabled={value >= MAX_PERK_COUNT} onClick={() => onChange(value + 1)}>
        <Plus className="size-3" />
      </button>
    </div>
  );
}

export function AddPaymentDialog({
  client,
  options,
  latest,
  onSaved,
}: {
  client: Client;
  /** The plans, perks and brands from Configuration. */
  options: PaymentOptions;
  /** The newest payment, if any: the plan and method the window opens on. */
  latest?: ClientTransaction;
  /** After a save; `warning` when the panel credit went below zero. */
  onSaved: (warning: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // ⚠️ A lock set the instant Add payment is clicked. `saving` only turns the
  // button off on the next render, and clicks landing before it (a double or
  // triple click) each saved a payment — found by the payment tests, 2026-10-06.
  const submitting = useRef(false);
  const [draft, setDraft] = useState<Draft>(() => draftFor(client, options, latest));

  const deviceOptions = sorted(options.plans.map((plan) => plan.devices));
  const monthOptions = sorted(options.plans.map((plan) => plan.months));
  const plan = options.plans.find((entry) => entry.devices === draft.devices && entry.months === draft.months);
  const brand = options.brands.find((entry) => entry.id === draft.brandId);
  const providers = PROVIDERS.filter((entry) => options.methods.some((method) => method.provider === entry.id));
  const accounts = options.methods.filter((method) => method.provider === draft.provider);
  const account = options.methods.find((method) => method.id === draft.methodId);

  const perkLines = options.perks.map((perk) => ({ perk, count: draft.perks[perk.id] ?? 0 })).filter((line) => line.count > 0);
  const perksCost = perkLines.reduce((sum, line) => sum + line.perk.cost * line.count, 0);
  const planCost = plan?.cost ?? null;
  const expense = planCost === null ? null : planCost + perksCost;
  const amount = isValidAmount(draft.amount) ? Number(draft.amount) : null;
  const valid = amount !== null && plan !== undefined && brand !== undefined && account !== undefined;

  /** A new plan brings its price, unless the amount was typed by hand. */
  function choosePlan(devices: number, months: number) {
    setDraft((current) => {
      const next = options.plans.find((entry) => entry.devices === devices && entry.months === months);
      return {
        ...current,
        devices,
        months,
        amount: current.amountEdited ? current.amount : amountText(next?.price),
      };
    });
  }

  /** A new type picks its first account; the account list below lets you change it. */
  function chooseProvider(provider: Provider) {
    const first = options.methods.find((method) => method.provider === provider);
    setDraft((current) => ({
      ...current,
      provider,
      methodId: first?.id ?? null,
    }));
  }

  function setPerk(id: number, count: number) {
    setDraft((current) => ({
      ...current,
      perks: {
        ...current.perks,
        [id]: Math.max(0, Math.min(MAX_PERK_COUNT, count)),
      },
    }));
  }

  function add() {
    if (!valid || amount === null || !brand || !account || saving || submitting.current) return;
    submitting.current = true;
    setError(null);
    startSaving(async () => {
      try {
        const result = await addPayment(client.id, {
          kind: draft.kind === "New plan" ? "NEW_PLAN" : "RENEWAL",
          devices: draft.devices,
          months: draft.months,
          amount,
          brandId: brand.id,
          paymentMethodId: account.id,
          perks: perkLines.map((line) => ({
            perkId: line.perk.id,
            quantity: line.count,
          })),
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        onSaved(result.data.warning);
        router.refresh();
      } finally {
        submitting.current = false;
      }
    });
  }

  return (
    // ⚠️ The draft is rebuilt every time the window opens, however it last
    // closed: a half-typed payment waiting behind the next click reads as the
    // form remembering something the reader had already abandoned.
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (saving) return;
        if (next) {
          setDraft(draftFor(client, options, latest));
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={<Button type="button" size="sm" className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")} />}
      >
        <Plus className="size-3" aria-hidden />
        Add payment
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 md:max-w-4xl">
        <form
          className="grid md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          {/* ── Two thirds: the form ─────────────────────────────────── */}
          <div className="flex min-w-0 flex-col gap-4 p-5 md:col-span-2">
            <DialogHeader>
              <DialogTitle>New payment</DialogTitle>
              <DialogDescription>A payment from {client.name}, dated today. Price and cost come from Configuration.</DialogDescription>
            </DialogHeader>

            <Segmented label="Type" options={kinds} value={draft.kind} onChange={(value) => setDraft((current) => ({ ...current, kind: value }))} />

            {/* The plan: the two axes of the plan grid, and its price under them. */}
            <section aria-label="Plan" className="rounded-lg border p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium">Plan</p>
                <p className="text-[0.65rem] text-muted-foreground tabular-nums">
                  {plan ? `${exactMoney(plan.price)} · ${plan.credits ?? "—"} credits` : "No such plan"}
                </p>
              </div>
              {options.plans.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">No plans yet: add them in Configuration → Subscriptions.</p>
              ) : (
                // Devices two fifths, months the rest (decided 2026-10-06).
                <div className="mt-2 grid grid-cols-5 gap-3">
                  <div className="col-span-2 min-w-0">
                    <Segmented
                      label="Devices"
                      options={deviceOptions}
                      value={draft.devices}
                      onChange={(value) => choosePlan(value, draft.months)}
                      fill
                    />
                  </div>
                  <div className="col-span-3 min-w-0">
                    <Segmented
                      label="Months"
                      options={monthOptions}
                      value={draft.months}
                      onChange={(value) => choosePlan(draft.devices, value)}
                      format={(value) => `${value} mo`}
                      fill
                    />
                  </div>
                </div>
              )}
            </section>

            {/* The perks under the plan, each with a count. */}
            <section aria-label="Perks" className="rounded-lg border p-3">
              <p className="text-xs font-medium">Perks</p>
              {options.perks.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">No perks switched on in Configuration → Expenses.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {options.perks.map((perk) => (
                    <li key={perk.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs">{perk.name}</p>
                        <p className="text-[0.65rem] text-muted-foreground tabular-nums">{exactMoney(perk.cost)} each</p>
                      </div>
                      <Counter label={perk.name} value={draft.perks[perk.id] ?? 0} onChange={(count) => setPerk(perk.id, count)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="payment-amount" className="block text-xs font-medium">
                  Amount paid (USD)
                </label>
                <Input
                  id="payment-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      amount: event.target.value,
                      amountEdited: true,
                    }))
                  }
                  placeholder="0.00"
                  aria-invalid={draft.amount !== "" && amount === null}
                  className="mt-1.5 h-[30px] text-right text-[0.7rem] tabular-nums md:text-[0.7rem]"
                />
              </div>

              <div className="min-w-0">
                <label htmlFor="payment-brand" className="block text-xs font-medium">
                  Brand
                </label>
                <Select
                  value={draft.brandId === null ? null : String(draft.brandId)}
                  onValueChange={(value) => {
                    if (value)
                      setDraft((current) => ({
                        ...current,
                        brandId: Number(value),
                      }));
                  }}
                >
                  <SelectTrigger id="payment-brand" className="mt-1.5 w-full text-[0.7rem] data-[size=default]:h-[30px]">
                    <SelectValue placeholder="Choose a brand">
                      {(value: string | null) => {
                        const entry = options.brands.find((item) => String(item.id) === value);
                        return entry ? (
                          <span className="inline-flex items-center gap-2">
                            {entry.logoUrl ? <BrandGlyph src={entry.logoUrl} className="size-3.5" /> : null}
                            {entry.name}
                          </span>
                        ) : null;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {options.brands.map((entry) => (
                      <SelectItem key={entry.id} value={String(entry.id)}>
                        <span className="inline-flex items-center gap-2">
                          {entry.logoUrl ? <BrandGlyph src={entry.logoUrl} className="size-3.5" /> : null}
                          {entry.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {options.methods.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payment methods switched on in Configuration → Payment methods.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Segmented
                  label="Payment method"
                  options={providers.map((entry) => entry.id)}
                  value={draft.provider}
                  onChange={chooseProvider}
                  format={providerLabel}
                />
                <div className="min-w-0">
                  <label htmlFor="payment-account" className="block text-xs font-medium">
                    Paid to
                  </label>
                  <Select
                    value={draft.methodId === null ? null : String(draft.methodId)}
                    onValueChange={(value) => {
                      if (value)
                        setDraft((current) => ({
                          ...current,
                          methodId: Number(value),
                        }));
                    }}
                  >
                    <SelectTrigger id="payment-account" className="mt-1.5 w-full text-[0.7rem] data-[size=default]:h-[30px]">
                      <SelectValue placeholder="Choose the account">
                        {(value: string | null) => options.methods.find((method) => String(method.id) === value)?.name ?? null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {accounts.map((method) => (
                        <SelectItem key={method.id} value={String(method.id)}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <div className="mt-auto flex justify-end gap-2 pt-2">
              <DialogClose render={<Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />}>Cancel</DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={!valid || saving}
                className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
              >
                {saving ? "Saving…" : "Add payment"}
              </Button>
            </div>
          </div>

          {/* ── One third: the receipt as it will read ───────────────────
              The client page's ticket — same paper, notches, tear lines and
              scallops — filled in as the form is. */}
          <aside aria-label="Receipt preview" className="flex min-w-0 flex-col border-t bg-muted/30 p-4 md:border-t-0 md:border-l">
            <div className={cn(receipt.shadow, "flex flex-1 flex-col")}>
              <div className={cn(receipt.ticket, "flex flex-1 flex-col")}>
                <div className="flex h-(--notch-y) shrink-0 flex-col items-center justify-center px-5 text-center">
                  <ReceiptMark />
                  <h2 className="mt-3 text-sm font-medium">Payment receipt</h2>
                  <p className={cn(receipt.muted, "mt-0.5 truncate text-[0.6rem]")}>
                    {client.name} · #{String(client.id).padStart(4, "0")}
                  </p>
                </div>

                <div className={receipt.rule} />

                <dl className="flex flex-col gap-2.5 px-5 py-4 text-[0.7rem]">
                  <ReceiptRow label="Date">Today</ReceiptRow>
                  <ReceiptRow label="Type">{draft.kind}</ReceiptRow>
                  <ReceiptRow label="Brand">
                    <span className="inline-flex items-center gap-1.5">
                      {brand?.logoUrl ? <BrandGlyph src={brand.logoUrl} className="size-3" /> : null}
                      {brand?.name ?? "—"}
                    </span>
                  </ReceiptRow>
                  <ReceiptRow label="Payment method">{account ? `${providerLabel(account.provider)} · ${account.name}` : "—"}</ReceiptRow>
                </dl>

                <div className={receipt.rule} />

                {/* What was bought: the plan, then each perk with its count. */}
                <ul className="flex flex-col gap-3 px-5 py-4 text-[0.7rem]">
                  <li className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate">{planDescription(draft.months, draft.devices)}</span>
                      <span className={cn(receipt.muted, "mt-0.5 block text-[0.6rem] tabular-nums")}>
                        {plan?.credits ? `${plan.credits} panel credits` : "No panel credit on file"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-medium tabular-nums">{plan ? exactMoney(plan.price) : "—"}</span>
                      <span className={cn(receipt.muted, "mt-0.5 block text-[0.6rem] tabular-nums")}>
                        {planCost === null ? "cost not on file" : `cost ${exactMoney(planCost)}`}
                      </span>
                    </span>
                  </li>
                  {perkLines.map((line) => (
                    <li key={line.perk.id} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate">
                          {line.perk.name} ×{line.count}
                        </span>
                        <span className={cn(receipt.muted, "mt-0.5 block text-[0.6rem]")}>Perk · included</span>
                      </span>
                      <span className={cn(receipt.muted, "shrink-0 text-right tabular-nums")}>cost {exactMoney(line.perk.cost * line.count)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <div className={receipt.rule} />
                  <dl className="flex flex-col gap-2 px-5 pt-4 text-[0.7rem]">
                    <ReceiptRow label="Paid">{amount === null ? "—" : exactMoney(amount)}</ReceiptRow>
                    <ReceiptRow label="Expenses">{expense === null ? "—" : `− ${exactMoney(expense)}`}</ReceiptRow>
                  </dl>
                  <div className="flex items-baseline justify-between gap-3 px-5 pt-3">
                    <span className="text-xs font-medium">Net earnings</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {amount === null || expense === null ? "—" : exactMoney(amount - expense)}
                    </span>
                  </div>
                  <p className={cn(receipt.muted, "px-5 pt-2 pb-9 text-center text-[0.6rem] leading-relaxed")}>
                    {amount !== null && expense !== null && amount - expense < 0 ? (
                      <span className="text-destructive">This payment costs more than it brings in.</span>
                    ) : (
                      "After plan and perk costs. Before panel credit."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  );
}
