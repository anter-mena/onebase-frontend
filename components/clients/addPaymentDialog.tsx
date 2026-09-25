"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "cn";

import { BrandGlyph } from "@/components/clients/brandGlyph";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exactMoney } from "@/lib/format";
import { deviceCounts, durations } from "@/lib/settings/credit";
import { paymentExpense } from "@/lib/settings/expenses";
import {
  clientBrands,
  planDescription,
  type Client,
  type ClientTransaction,
  type PaymentKind,
  type PaymentMethod,
} from "@/lib/clients/sample";

/**
 * "Add payment" — the button and the window it opens.
 *
 * <p>⚠️ <b>The plan is picked, not typed.</b> Devices and term are the two
 * axes of the Expenses sheet, so choosing them from the sheet's own lists is
 * what lets the form cost the payment on the spot — and it builds the
 * description the sample rows use, so a typed-in payment reads like the rest
 * of the ledger rather than like somebody's note. Free text would give the
 * table a row the Expenses sheet cannot price.
 *
 * <p>⚠️ <b>No date field.</b> A payment is recorded as it is taken, so it is
 * dated the moment it is added. A picker would only invite back-dating, and a
 * ledger whose dates can be typed is a ledger whose order cannot be trusted.
 * Correcting a date is an edit to an existing row, which is a different job.
 *
 * <p>The expense and the net are shown before the payment is added. They are
 * worked out by `paymentExpense`, the same function that costed every row
 * already there, so what the preview says is what the row will say.
 */

const kinds: readonly PaymentKind[] = ["New plan", "Renewal"];
const methods: readonly Exclude<PaymentMethod, "Not set">[] = ["Card", "Bank transfer", "PayPal"];

type Draft = {
  kind: PaymentKind;
  devices: number;
  months: number;
  brand: string;
  method: Exclude<PaymentMethod, "Not set">;
  amount: string;
};

/** A positive amount with up to two decimals: "3100", "49.90". */
function isValidAmount(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;
}

/**
 * Today, as the ledger writes dates — "2026-09-24", in the reader's own zone.
 *
 * <p>Local rather than UTC on purpose: a payment taken at 00:30 in Casablanca
 * was taken today there, and `toISOString` would file it under yesterday.
 * Read at the moment of adding, never while rendering.
 */
function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The draft a fresh window opens on: the client's own plan, brand and method,
 * so the common case — this client paid again for what they already have —
 * is an amount away.
 */
function draftFor(client: Client): Draft {
  const current = Number(/^(\d+)\s+months?$/.exec(client.duration)?.[1]);
  return {
    kind: "Renewal",
    devices: deviceCounts.includes(client.devices as (typeof deviceCounts)[number]) ? client.devices : 1,
    months: durations.includes(current as (typeof durations)[number]) ? current : 12,
    brand: client.brand,
    method: client.paymentMethod === "Not set" ? "Card" : client.paymentMethod,
    amount: "",
  };
}

/** The same segmented control as the Billing switch on the Expenses tab. */
function Segmented<Value extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: {
  label: string;
  options: readonly Value[];
  value: Value;
  onChange: (value: Value) => void;
  format?: (value: Value) => string;
}) {
  return (
    <div>
      <p className="text-xs font-medium">{label}</p>
      <div role="group" aria-label={label} className="mt-1.5 inline-flex max-w-full overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={cn(
              "inline-flex h-6 shrink-0 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
              value === option
                ? "border-border bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddPaymentDialog({
  client,
  onAdd,
}: {
  client: Client;
  onAdd: (payment: ClientTransaction) => void;
}) {
  const [open, setOpen] = useState(false);
  const added = useRef(0);
  const [draft, setDraft] = useState<Draft>(() => draftFor(client));

  const set = <Key extends keyof Draft>(key: Key, value: Draft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const opensPlan = draft.kind === "New plan";
  const expense = paymentExpense(draft.devices, draft.months, opensPlan);
  const amount = isValidAmount(draft.amount) ? Number(draft.amount) : null;
  const valid = amount !== null;
  const brand = clientBrands.find((entry) => entry.name === draft.brand);

  function add() {
    if (!valid || amount === null) return;
    onAdd({
      // Unique within the page, which is all it has to be until the API
      // issues ids of its own.
      id: `${client.id}-added-${(added.current += 1)}`,
      at: today(),
      kind: draft.kind,
      description: planDescription(draft.months, draft.devices),
      months: draft.months,
      devices: draft.devices,
      method: draft.method,
      brand: draft.brand,
      brandLogo: brand?.logo ?? client.brandLogo,
      amount,
      expense,
    });
    setOpen(false);
  }

  return (
    // ⚠️ The draft is rebuilt every time the window opens, however it last
    // closed — the rule the "New perk" window follows, for its reason: a
    // half-typed payment waiting behind the next click reads as the form
    // remembering something the reader had already abandoned.
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(draftFor(client));
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}
          />
        }
      >
        <Plus className="size-3" aria-hidden />
        Add payment
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New payment</DialogTitle>
          <DialogDescription>
            A payment from {client.name}, dated today. Its cost comes from the
            Expenses sheet.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          {/* The amount first and on its own: it is the one thing the form
              cannot guess, so it is where the cursor starts. */}
          <Field>
            <FieldLabel htmlFor="payment-amount">Amount (USD)</FieldLabel>
            <Input
              id="payment-amount"
              inputMode="decimal"
              autoFocus
              value={draft.amount}
              onChange={(event) => set("amount", event.target.value)}
              placeholder="0.00"
              aria-invalid={draft.amount !== "" && amount === null}
              className="h-8 text-right text-xs tabular-nums"
            />
          </Field>

          <Segmented label="Type" options={kinds} value={draft.kind} onChange={(value) => set("kind", value)} />

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Segmented label="Devices" options={deviceCounts} value={draft.devices as (typeof deviceCounts)[number]} onChange={(value) => set("devices", value)} />
            <Segmented label="Term" options={durations} value={draft.months as (typeof durations)[number]} onChange={(value) => set("months", value)} format={(value) => `${value} mo`} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="payment-brand">Brand</FieldLabel>
              <Select value={draft.brand} onValueChange={(value) => { if (value) set("brand", value as string); }}>
                <SelectTrigger id="payment-brand" className="h-8 w-full text-xs">
                  <SelectValue>
                    {(value: string | null) => {
                      const entry = clientBrands.find((item) => item.name === value);
                      return entry ? (
                        <span className="inline-flex items-center gap-2">
                          <BrandGlyph src={entry.logo} className="size-3.5" />
                          {entry.name}
                        </span>
                      ) : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {clientBrands.map((entry) => (
                    <SelectItem key={entry.name} value={entry.name}>
                      <span className="inline-flex items-center gap-2">
                        <BrandGlyph src={entry.logo} className="size-3.5" />
                        {entry.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Segmented label="Payment method" options={methods} value={draft.method} onChange={(value) => set("method", value)} />
          </div>

          {/* The row before it exists: what it cost and what it leaves. */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              {expense === null ? "No plan cost on file" : `Expense −${exactMoney(expense)}`}
              {opensPlan ? " · incl. one-off perks" : null}
            </span>
            <span className="font-medium tabular-nums">
              Net {amount === null ? "—" : exactMoney(amount - (expense ?? 0))}
            </span>
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />}
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={!valid}
              className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
            >
              Add payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
