"use client";

import { useState, type KeyboardEvent } from "react";
import { FileDown, Plus } from "lucide-react";
import { cn } from "cn";

import { CurrencyFlag } from "@/components/settings/currencyFlag";
import { PanelCredit } from "@/components/settings/panelCredit";
import {
  creditsPerLine,
  deviceCounts,
  durations,
  planCredits,
} from "@/lib/settings/credit";
import {
  currencies,
  initialCosts,
  initialPerks,
  type Costs,
  type Currency,
  type Perk,
} from "@/lib/settings/expenses";
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
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { usePersistedChoice } from "@/hooks/use-persisted-choice";

/**
 * The Expenses tab of the Configuration page.
 *
 * <p>What a subscription costs to deliver, and what the extras cost on top.
 * It deliberately mirrors the Subscriptions tab beside it — the same currency
 * switch, the same devices × duration grid, the same double-click to edit — so
 * the two can be read against each other. A cost grid shaped differently from
 * the price grid it answers to would make comparing them a translation job.
 *
 * <p>⚠️ <b>No margin column, on purpose.</b> Margin is cost against price, and
 * the prices live in `subscriptions.tsx` as that component's own state. Reading
 * them from here would either duplicate the numbers — two sources that drift —
 * or pull one tab's private state into another. When both sets move to the API
 * they will share a module, and that is the moment to show margin, computed
 * once from figures that cannot disagree.
 */

// The currencies, the cost sheet and the perks live in lib/settings/expenses —
// a plain module, so the client receipt can net payments against the same
// figures this tab shows.

/** Module-level, so the persisted-choice hook gets a stable list. */
const currencyValues: readonly Currency[] = currencies.map((currency) => currency.value);

/**
 * A perk's id, from its name.
 *
 * <p>⚠️ Deduplicated against the list it is joining. Two perks called the same
 * thing would otherwise share a key — React would reuse the wrong row, and
 * switching one off would switch off the other.
 */
function perkId(name: string, existing: readonly Perk[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "perk";

  if (!existing.some((perk) => perk.id === base)) return base;

  let suffix = 2;
  while (existing.some((perk) => perk.id === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/** An empty draft, and what "reset the form" means. */
const emptyDraft = {
  name: "",
  description: "",
  cadence: "Monthly" as Perk["cadence"],
  cost: { USD: "", CAD: "", EUR: "" } as Record<Currency, string>,
};

/**
 * "$14.99", "€11.99". `narrowSymbol` shows CAD as "$" rather than "CA$", and
 * the locale is fixed so the server and the browser format the same way.
 */
const costFormatters = Object.fromEntries(
  currencies.map(({ value }) => [
    value,
    new Intl.NumberFormat("en-US", { style: "currency", currency: value, currencyDisplay: "narrowSymbol" }),
  ]),
) as Record<Currency, Intl.NumberFormat>;

/** A cost is a positive number with up to two decimals: "4.2", "17.40", "30". */
function isValidCost(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;
}

/** The one cost being edited, and what has been typed so far. */
/**
 * Which box is open, and what has been typed into it.
 *
 * <p>⚠️ `field` matters: a cell now holds two numbers, and without it the
 * money box and the credit box beside it would open together and write each
 * other's value.
 *
 * <p>`currency` is only meaningful for `cost` — credits are credits whichever
 * currency the table is being read in — but it is carried for both so
 * switching currency closes whatever is open either way.
 */
type EditingCell = {
  currency: Currency;
  row: number;
  column: number;
  field: "cost" | "credits";
  value: string;
};

/** Credits are whole units: "180", never "180.5". */
function isValidCredits(value: string) {
  return /^\d+$/.test(value.trim()) && Number(value) > 0;
}

/**
 * One box for a cost, shown and edited: the same width, height, border,
 * padding and text, so double-clicking swaps it for an input without anything
 * moving.
 */
const costBoxClassName = "h-7 w-[4.5rem] rounded-md border px-1.5 text-right text-xs tabular-nums";

/** Narrower: credits are whole numbers and never carry a currency symbol. */
const creditBoxClassName = "h-7 w-[3.75rem] rounded-md border px-1.5 text-right text-xs tabular-nums";

/** The same switch as the Configuration tabs and the Payment methods view. */
function CurrencySwitch({ value, onChange }: { value: Currency; onChange: (currency: Currency) => void }) {
  return (
    <div role="group" aria-label="Currency" className="inline-flex rounded-lg border border-border/60 bg-muted p-0.5">
      {currencies.map((currency) => (
        <button
          key={currency.value}
          type="button"
          onClick={() => onChange(currency.value)}
          aria-pressed={value === currency.value}
          title={currency.name}
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === currency.value
              ? "border-border bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CurrencyFlag flag={currency.flag} />
          {currency.label}
        </button>
      ))}
    </div>
  );
}

export function Expenses() {
  const [currency, setCurrency] = usePersistedChoice<Currency>(
    "onebase:expenses-currency",
    currencyValues,
    "USD",
  );

  // Kept on screen only for now: they reset on reload until there is an API.
  const [costs, setCosts] = useState<Costs>(initialCosts);
  // Seeded from the shared rate table, then editable: the rate is the sensible
  // starting point, but a panel can price one plan differently and the sheet
  // has to be able to say so.
  const [credits, setCredits] = useState<number[][]>(() =>
    deviceCounts.map((devices) => durations.map((duration) => planCredits(devices, duration))),
  );
  const [perks, setPerks] = useState<Perk[]>(initialPerks);
  const [editing, setEditing] = useState<EditingCell | null>(null);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const formatter = costFormatters[currency];

  /**
   * ⚠️ A cost in every currency, not just the one on screen.
   *
   * <p>A perk priced only in dollars has nothing to show when the switch moves
   * to euros — and the two ways out are both wrong: converting invents a rate
   * this app does not have, and printing the dollar figure under a € sign is
   * simply false. Asking for three numbers once is cheaper than either.
   */
  const draftIsValid =
    draft.name.trim() !== "" && currencyValues.every((code) => isValidCost(draft.cost[code]));

  function startEditing(row: number, column: number, field: "cost" | "credits") {
    setEditing({
      currency,
      row,
      column,
      field,
      value:
        field === "cost"
          ? costs[currency][row][column].toFixed(2)
          : String(credits[row][column]),
    });
  }

  /** Saves the typed figure if it is valid; otherwise the box reverts. */
  function finishEditing() {
    if (!editing) return;

    const { currency: editedCurrency, row, column, field, value } = editing;

    if (field === "cost" && isValidCost(value)) {
      setCosts((current) => ({
        ...current,
        [editedCurrency]: current[editedCurrency].map((cells, r) =>
          r === row ? cells.map((cost, c) => (c === column ? Number(value.trim()) : cost)) : cells,
        ),
      }));
    }

    // ⚠️ Credits are not per currency. The same plan opens the same lines
    // whichever currency its price is read in, so there is one grid here
    // rather than three — editing it in euros and finding dollars unchanged
    // would be a bug nobody could explain.
    if (field === "credits" && isValidCredits(value)) {
      setCredits((current) =>
        current.map((cells, r) =>
          r === row ? cells.map((amount, c) => (c === column ? Number(value.trim()) : amount)) : cells,
        ),
      );
    }

    setEditing(null);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing();
    }
    // ⚠️ Escape abandons rather than saves. A cell being edited is a change not
    // yet agreed to, and the way out of one must not commit it.
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
    }
  }

  function changeCurrency(next: Currency) {
    // The open cell belongs to the current currency, so switching closes it.
    finishEditing();
    setCurrency(next);
  }

  function togglePerk(id: string, active: boolean) {
    setPerks((current) => current.map((perk) => (perk.id === id ? { ...perk, active } : perk)));
  }

  function addPerk() {
    if (!draftIsValid) return;

    setPerks((current) => [
      ...current,
      {
        id: perkId(draft.name, current),
        name: draft.name.trim(),
        description: draft.description.trim(),
        cadence: draft.cadence,
        cost: {
          USD: Number(draft.cost.USD),
          CAD: Number(draft.cost.CAD),
          EUR: Number(draft.cost.EUR),
        },
        // New perks are offered by default: somebody who just added one meant
        // to sell it.
        active: true,
      },
    ]);

    setDraft(emptyDraft);
    setAdding(false);
  }

  const offeredCount = perks.filter((perk) => perk.active).length;

  function exportCsv() {
    const headings = ["Section", "Row", "Duration", "Cadence", `Cost (${currency})`, "Credits"];
    const planRows = deviceCounts.flatMap((devices, row) =>
      durations.map((duration, column) => [
        "Plan",
        `${devices} ${devices === 1 ? "device" : "devices"}`,
        `${duration} ${duration === 1 ? "month" : "months"}`,
        "Per plan",
        costs[currency][row][column].toFixed(2),
        credits[row][column],
      ]),
    );
    // ⚠️ Every perk, including the inactive ones, with their state in the
    // Cadence column. An export that silently drops what is switched off is an
    // export somebody reconciles against and cannot make balance.
    const perkRows = perks.map((perk) => [
      "Perk",
      perk.name,
      "—",
      `${perk.cadence}${perk.active ? "" : " (off)"}`,
      perk.cost[currency].toFixed(2),
      "—",
    ]);

    downloadCsv(`one-base-expenses-${currency.toLowerCase()}.csv`, headings, [...planRows, ...perkRows]);
  }

  return (
    // A third and two thirds, side by side above `lg` and stacked below it.
    <div className="grid min-h-full gap-4 lg:grid-cols-3">
      {/* ⚠️ Second in the source, first on a wide screen.
          Ordering it left in the markup would put an empty box above the
          content on a phone, where the grid collapses to one column — the
          reader would scroll past a placeholder to reach the thing they came
          for. `lg:order-first` moves it only where there are two columns to
          move it between. */}
      <div className="flex min-w-0 flex-col lg:order-2 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Expenses</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            What each subscription costs you, and the price of additional perks.
            Double-click a cost to edit it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ⚠️ A count, not a total. The perks have different cadences — a
              monthly licence and a one-off fee do not add up to a number that
              means anything, and a chip that sums them would be the first
              figure anybody quoted. */}
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
            {offeredCount} of {perks.length} perks offered
          </span>
          <CurrencySwitch value={currency} onChange={changeCurrency} />
          <Button type="button" size="sm" onClick={exportCsv} className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}>
            <FileDown className="size-3" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── What a plan costs to deliver ──────────────────────────────────── */}
      <section className="mt-5" aria-label="Cost per plan">
        <h3 className="text-xs font-semibold">Cost per plan</h3>
        <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
          Two costs for every plan: the money it takes out of the account, and
          the panel credit it spends. Same grid the Subscriptions tab prices.
        </p>
        {/* The rate the credit column starts from. It is a starting point,
            not a rule — every figure below can be overwritten. */}
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          Credit starts at{" "}
          {durations.map((d) => `${creditsPerLine[d]} for ${d}mo`).join(" · ")}, per line.
        </p>

        <div className="mt-3 overflow-x-auto">
          {/* ⚠️ `pr-4` on the last column, set from here rather than on the
              cell. `[&_td]` compiles to `.table td` at specificity (0,1,1),
              which outranks a plain `pr-4` class on a cell at (0,1,0) — the
              same trap the Clients table hit, where the Actions column quietly
              lost its padding. `td:last-child` is (0,2,1) and wins it back. */}
          <Table className="min-w-[36rem] text-xs [&_td:last-child]:pr-4 [&_th:last-child]:pr-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Devices</TableHead>
                {durations.map((duration) => (
                  <TableHead key={duration} className="text-right">
                    {duration} {duration === 1 ? "month" : "months"}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceCounts.map((devices, row) => (
                <TableRow key={devices}>
                  <TableCell className="font-medium">
                    {devices} {devices === 1 ? "device" : "devices"}
                  </TableCell>
                  {durations.map((duration, column) => {
                    const openHere =
                      editing !== null &&
                      editing.currency === currency &&
                      editing.row === row &&
                      editing.column === column;

                    const plan = `${devices} ${devices === 1 ? "device" : "devices"} over ${duration} ${duration === 1 ? "month" : "months"}`;

                    return (
                      <TableCell key={duration} className="text-right">
                        {/* Money on the left, credit on the right, a rule
                            between them. Both are what the plan costs — one in
                            the bank and one at the panel — so they belong on
                            one line rather than stacked as a figure and a
                            footnote. */}
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {openHere && editing.field === "cost" ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editing.value}
                              autoFocus
                              onChange={(event) =>
                                setEditing((current) => (current ? { ...current, value: event.target.value } : current))
                              }
                              onBlur={finishEditing}
                              onKeyDown={handleEditKeyDown}
                              aria-label={`Cost for ${plan}`}
                              className={cn(costBoxClassName, "bg-background outline-none focus-visible:border-ring")}
                            />
                          ) : (
                            <button
                              type="button"
                              onDoubleClick={() => startEditing(row, column, "cost")}
                              // ⚠️ Enter opens the editor too. Double-click is
                              // a mouse gesture and nothing else here reveals
                              // the box is editable; without this a keyboard
                              // has no way in at all.
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  startEditing(row, column, "cost");
                                }
                              }}
                              aria-label={`Cost for ${plan}. Double-click to edit.`}
                              className={cn(costBoxClassName, "border-transparent hover:border-border focus-visible:border-ring")}
                            >
                              {formatter.format(costs[currency][row][column])}
                            </button>
                          )}

                          <span aria-hidden className="text-muted-foreground/40">|</span>

                          {openHere && editing.field === "credits" ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editing.value}
                              autoFocus
                              onChange={(event) =>
                                setEditing((current) => (current ? { ...current, value: event.target.value } : current))
                              }
                              onBlur={finishEditing}
                              onKeyDown={handleEditKeyDown}
                              aria-label={`Credits for ${plan}`}
                              className={cn(creditBoxClassName, "-mr-2 bg-background outline-none focus-visible:border-ring")}
                            />
                          ) : (
                            <button
                              type="button"
                              onDoubleClick={() => startEditing(row, column, "credits")}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  startEditing(row, column, "credits");
                                }
                              }}
                              aria-label={`Credits for ${plan}. Double-click to edit.`}
                              className={cn(creditBoxClassName, "-mr-2 border-transparent text-muted-foreground hover:border-border focus-visible:border-ring")}
                            >
                              {credits[row][column]} cr
                            </button>
                          )}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── The extras ────────────────────────────────────────────────────── */}
      <section className="mt-6" aria-label="Perks">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold">Perks</h3>
            <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
              Extras a client can add. Switch one off to stop offering it
              without losing what it costs.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setAdding(true)}
            className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}
          >
            <Plus className="size-3" aria-hidden />
            Add perk
          </Button>
        </div>

        {/* ⚠️ The draft is cleared whenever the window closes, however it
            closes — Cancel, the X, Escape or a click outside. Resetting only in
            the Cancel handler leaves a half-typed perk waiting behind the next
            "Add perk", which reads as the form remembering something the reader
            had already abandoned. */}
        <Dialog
          open={adding}
          onOpenChange={(next) => {
            setAdding(next);
            if (!next) setDraft(emptyDraft);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New perk</DialogTitle>
              <DialogDescription>
                An extra a client can add to their subscription.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="perk-name">Name</FieldLabel>
                <Input
                  id="perk-name"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="IBO Pro"
                  className="h-8 text-xs"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="perk-description">Description</FieldLabel>
                <Input
                  id="perk-description"
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What the client gets."
                  className="h-8 text-xs"
                />
              </Field>
            </div>

            <div className="mt-3">
              <p className="text-xs font-medium">Billing</p>
              {/* Two choices, so two buttons rather than a dropdown that hides
                  one of them behind a click. */}
              <div role="group" aria-label="Billing" className="mt-1.5 inline-flex rounded-lg border border-border/60 bg-muted p-0.5">
                {(["Monthly", "One-off"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, cadence: option }))}
                    aria-pressed={draft.cadence === option}
                    className={cn(
                      "inline-flex h-6 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                      draft.cadence === option
                        ? "border-border bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-medium">Cost</p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                In all three currencies — the table can be read in any of them.
              </p>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                {currencies.map((entry) => (
                  <Field key={entry.value}>
                    <FieldLabel htmlFor={`perk-cost-${entry.value}`} className="flex items-center gap-1.5">
                      <CurrencyFlag flag={entry.flag} />
                      {entry.label}
                    </FieldLabel>
                    <Input
                      id={`perk-cost-${entry.value}`}
                      inputMode="decimal"
                      value={draft.cost[entry.value]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          cost: { ...current.cost, [entry.value]: event.target.value },
                        }))
                      }
                      placeholder="0.00"
                      className="h-8 text-right text-xs tabular-nums"
                    />
                  </Field>
                ))}
              </div>
            </div>

            <DialogFooter>
              <DialogClose
                render={
                  <Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />
                }
              >
                Cancel
              </DialogClose>

              <Button
                type="button"
                size="sm"
                onClick={addPerk}
                disabled={!draftIsValid}
                className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
              >
                Add perk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-3 overflow-x-auto">
          <Table className="min-w-[36rem] text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Perk</TableHead>
                <TableHead className="w-28">Billing</TableHead>
                <TableHead className="w-28 text-right">Cost</TableHead>
                <TableHead className="w-32 text-right">Offered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perks.map((perk) => (
                <TableRow key={perk.id}>
                  <TableCell>
                    <span className="block font-medium text-foreground">{perk.name}</span>
                    <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">{perk.description}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{perk.cadence}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatter.format(perk.cost[currency])}</TableCell>
                  <TableCell>
                    {/* The switch and the word, the same pairing the Brands and
                        Users tables use — a lone switch states its position and
                        not its meaning. */}
                    <span className="flex items-center justify-end gap-2">
                      <Switch
                        checked={perk.active}
                        onCheckedChange={(checked) => togglePerk(perk.id, checked)}
                        size="sm"
                        aria-label={`${perk.active ? "Stop offering" : "Offer"} ${perk.name}`}
                      />
                      <span className={cn("text-[0.65rem] font-medium", perk.active ? "text-foreground" : "text-muted-foreground")}>
                        {perk.active ? "Yes" : "No"}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

        <p className="mt-6 text-[0.65rem] leading-relaxed text-muted-foreground">
          Edits are kept on screen only until the API is connected.
        </p>
      </div>

      {/* Credit belongs on Expenses because it is the one cost paid before any
          client pays anything — the balance every plan in the grid beside it
          is created against. */}
      {/* `h-full` passes the row's height down: the grid stretches this cell,
          but the panel inside only fills it if it is told to. */}
      <div className="h-full lg:order-1 lg:col-span-1">
        <PanelCredit />
      </div>
    </div>
  );
}
