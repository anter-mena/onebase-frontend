"use client";

import { useEffect, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, FileDown, MoreVertical, Pencil, Plus, Save } from "lucide-react";
import { cn } from "cn";

import { savePerk, savePlanCosts, setPerkActive } from "@/app/(private)/configuration/expenseActions";
import { AutoRefresh } from "@/components/app-shell/autoRefresh";
import { LoadError } from "@/components/errors/loadError";
import { PanelCredit } from "@/components/settings/panelCredit";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showTopBanner } from "@/components/ui/topBanner";
import { downloadCsv } from "@/lib/csv";
import type { CreditSummary, PerkRow } from "@/lib/expenses/types";
import type { PlanPrice } from "@/lib/plans/plans";

/**
 * The Expenses tab of the Configuration page — part of the set-up: it stores
 * what each plan costs you (money and panel credit), the perks' costs, and the
 * panel credit bought. The calculations that use them come with Payments.
 *
 * <p>USD only (decided 2026-10-04). The cost grid mirrors the Subscriptions
 * grid and works the same way: double-click, the change is highlighted, and
 * Save (grey until something changes) keeps all of them or none.
 */

const durations = [1, 3, 6, 12] as const;
const deviceCounts = [1, 2, 3, 4] as const;

const deviceLabel = (devices: number) => `${devices} ${devices === 1 ? "device" : "devices"}`;
const monthLabel = (months: number) => `${months} ${months === 1 ? "month" : "months"}`;
const cellKey = (row: number, column: number) => `${row}-${column}`;

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** A cost is 0 or more, with up to two decimals: "4.2", "17.40", "30". */
function isValidCost(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) <= 99999.99;
}

/** Credits are whole units: "12", never "12.5". */
function isValidCredits(value: string) {
  return /^\d+$/.test(value.trim()) && Number(value) <= 100000;
}

/** Which box is open — the money or the credit of one cell — and what has been typed. */
type EditingCell = { row: number; column: number; field: "cost" | "credits"; value: string };

type Cell = { cost: number; credits: number };

/** One box for a figure, shown and edited: same size, so double-clicking moves nothing. */
const costBoxClassName = "h-7 w-[4.5rem] rounded-md border px-1.5 text-right text-xs tabular-nums";
/** Narrower: credits are whole numbers and never carry a currency symbol. */
const creditBoxClassName = "h-7 w-[3.75rem] rounded-md border px-1.5 text-right text-xs tabular-nums";

export function Expenses({
  plans,
  perks,
  credit,
  loadError,
}: {
  plans: PlanPrice[] | null;
  perks: PerkRow[] | null;
  credit: CreditSummary | null;
  loadError: string | null;
}) {
  const router = useRouter();

  // The saved costs and credits, as a grid: saved[device row][duration column].
  const saved: Cell[][] = deviceCounts.map((devices) =>
    durations.map((months) => {
      const plan = plans?.find((entry) => entry.devices === devices && entry.months === months);
      return { cost: plan?.cost ?? 0, credits: plan?.credits ?? 0 };
    }),
  );

  // Changes not saved yet, by cell. What the table shows is the saved value, or the change.
  const [drafts, setDrafts] = useState<ReadonlyMap<string, Cell>>(new Map());
  const shown = saved.map((cells, row) => cells.map((cell, column) => drafts.get(cellKey(row, column)) ?? cell));
  const changeCount = drafts.size;

  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [saving, startSaving] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [perkDialog, setPerkDialog] = useState<PerkRow | "new" | null>(null);

  // Leaving the page with unsaved changes: the browser asks first.
  useEffect(() => {
    if (changeCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changeCount]);

  function startEditing(row: number, column: number, field: "cost" | "credits") {
    const cell = shown[row][column];
    setEditing({ row, column, field, value: field === "cost" ? cell.cost.toFixed(2) : String(cell.credits) });
  }

  // Keeps a valid figure as a change (not saved yet); an invalid one goes back.
  function finishEditing() {
    if (!editing) return;
    const { row, column, field, value } = editing;
    const valid = field === "cost" ? isValidCost(value) : isValidCredits(value);
    if (valid) {
      const next: Cell = { ...shown[row][column], [field]: field === "cost" ? Math.round(Number(value.trim()) * 100) / 100 : Number(value.trim()) };
      setDrafts((current) => {
        const copy = new Map(current);
        const original = saved[row][column];
        // Typed back to what is saved: no longer a change.
        if (next.cost === original.cost && next.credits === original.credits) copy.delete(cellKey(row, column));
        else copy.set(cellKey(row, column), next);
        return copy;
      });
      setSaveMessage(null);
    }
    setEditing(null);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing();
    }
    // Escape abandons rather than keeps: the way out of a box must not commit it.
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
    }
  }

  function save() {
    const changes = [...drafts.entries()].map(([key, cell]) => {
      const [row, column] = key.split("-").map(Number);
      return { devices: deviceCounts[row], months: durations[column], cost: cell.cost, credits: cell.credits };
    });
    if (changes.length === 0) return;
    startSaving(async () => {
      const result = await savePlanCosts(changes);
      if (!result.ok) {
        // Nothing was saved: the changes stay highlighted, to fix and try again.
        setSaveMessage({ ok: false, text: result.error });
        return;
      }
      setDrafts(new Map());
      setSaveMessage({ ok: true, text: `Saved ${changes.length} ${changes.length === 1 ? "plan" : "plans"}.` });
      router.refresh();
    });
  }

  // Offer / stop offering a perk: the switch moves at once, and comes back if the backend refuses.
  // ⚠️ After a success the new position is kept until the reloaded list says the same:
  // an older refresh landing late would otherwise flip the switch back.
  const [pendingActive, setPendingActive] = useState<ReadonlyMap<number, boolean>>(new Map());
  const [busyPerks, setBusyPerks] = useState<ReadonlySet<number>>(new Set());
  const [seenPerks, setSeenPerks] = useState(perks);
  if (perks !== seenPerks) {
    setSeenPerks(perks);
    setPendingActive((map) => new Map([...map].filter(([id, value]) => perks?.find((perk) => perk.id === id)?.active !== value)));
  }
  function togglePerk(perk: PerkRow) {
    const next = !(pendingActive.get(perk.id) ?? perk.active);
    setPendingActive((map) => new Map(map).set(perk.id, next));
    setBusyPerks((set) => new Set(set).add(perk.id));
    void setPerkActive(perk.id, next).then((result) => {
      if (!result.ok) {
        showTopBanner(result.error);
        setPendingActive((map) => {
          const copy = new Map(map);
          copy.delete(perk.id);
          return copy;
        });
      }
      setBusyPerks((set) => {
        const copy = new Set(set);
        copy.delete(perk.id);
        return copy;
      });
      router.refresh();
    });
  }

  if (!plans || !perks || !credit) {
    return <LoadError title="The expenses could not be loaded." reason={loadError ?? "Please try again."} />;
  }

  const offeredCount = perks.filter((perk) => pendingActive.get(perk.id) ?? perk.active).length;
  const monthLineCredits = saved[0][0].credits;

  function exportCsv() {
    const headings = ["Section", "Row", "Duration", "Cost (USD)", "Credits", "Offered"];
    const planRows = deviceCounts.flatMap((devices, row) =>
      durations.map((months, column) => ["Plan", deviceLabel(devices), monthLabel(months), saved[row][column].cost.toFixed(2), saved[row][column].credits, "—"]),
    );
    // Every perk, including the ones switched off, with their state.
    const perkRows = (perks ?? []).map((perk) => ["Perk", perk.name, "—", perk.cost.toFixed(2), "—", perk.active ? "Yes" : "No"]);
    downloadCsv("one-base-expenses.csv", headings, [...planRows, ...perkRows]);
  }

  return (
    // A third and two thirds, side by side above `lg` and stacked below it.
    <div className="grid min-h-full gap-4 lg:grid-cols-3">
      {/* Another Admin's saves show up by themselves — but never over changes not saved yet, or an open window. */}
      {changeCount === 0 && !editing && !perkDialog ? <AutoRefresh /> : null}

      {/* Second in the source, first on a wide screen, so a phone reaches the grid first. */}
      <div className="flex min-w-0 flex-col lg:order-2 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Expenses</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              What each plan costs you, in US dollars and panel credit, and the cost of the perks. Double-click a figure to change it, then Save.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saveMessage ? (
              <span role="status" className={cn("flex items-center gap-1 text-[0.65rem]", saveMessage.ok ? "text-muted-foreground" : "text-destructive")}>
                {saveMessage.ok ? <Check className="size-3 text-(--viz-good)" aria-hidden /> : null}
                {saveMessage.text}
              </span>
            ) : null}
            {/* A count, not a total: a sum of perk costs would mean nothing on its own. */}
            <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
              {offeredCount} of {perks.length} perks offered
            </span>
            <Button type="button" size="sm" onClick={exportCsv} className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}>
              <FileDown className="size-3" aria-hidden />
              Export CSV
            </Button>
            {/* Grey until something changes in the cost grid. Saves every change together. */}
            <Button type="button" size="sm" onClick={save} disabled={changeCount === 0 || saving || Boolean(editing)} className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}>
              <Save className="size-3" aria-hidden />
              {saving ? "Saving…" : changeCount > 1 ? `Save ${changeCount} changes` : "Save"}
            </Button>
          </div>
        </div>

        {/* ── What a plan costs ──────────────────────────────────────────── */}
        <section className="mt-5" aria-label="Cost per plan">
          <h3 className="text-xs font-semibold">Cost per plan</h3>
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            Two costs for every plan: the money it takes out of the account, and the panel credit it spends. Same grid as the Subscriptions prices.
          </p>

          <div className="mt-3 overflow-x-auto">
            {/* `pr-4` on the last column from here: a class on the cell loses to `[&_td]` specificity. */}
            <Table className="min-w-[36rem] text-xs [&_td:last-child]:pr-4 [&_th:last-child]:pr-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Devices</TableHead>
                  {durations.map((months) => (
                    <TableHead key={months} className="text-right">{monthLabel(months)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceCounts.map((devices, row) => (
                  <TableRow key={devices}>
                    <TableCell className="font-medium">{deviceLabel(devices)}</TableCell>
                    {durations.map((months, column) => {
                      const openHere = editing !== null && editing.row === row && editing.column === column;
                      const plan = `${deviceLabel(devices)} over ${monthLabel(months)}`;
                      const draft = drafts.get(cellKey(row, column));
                      const costChanged = draft !== undefined && draft.cost !== saved[row][column].cost;
                      const creditsChanged = draft !== undefined && draft.credits !== saved[row][column].credits;
                      const changedClass = "border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/15";

                      return (
                        <TableCell key={months} className="text-right">
                          {/* Money on the left, credit on the right: both are what the plan costs. */}
                          <span className="inline-flex items-center justify-end gap-1.5">
                            {openHere && editing.field === "cost" ? (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={editing.value}
                                autoFocus
                                onFocus={(event) => event.currentTarget.select()}
                                onChange={(event) => setEditing((current) => (current ? { ...current, value: event.target.value } : current))}
                                onBlur={finishEditing}
                                onKeyDown={handleEditKeyDown}
                                aria-label={`Cost for ${plan}, in US dollars`}
                                aria-invalid={!isValidCost(editing.value) || undefined}
                                className={cn(costBoxClassName, "bg-background outline-none focus-visible:border-ring aria-invalid:border-destructive")}
                              />
                            ) : (
                              <button
                                type="button"
                                onDoubleClick={() => startEditing(row, column, "cost")}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    startEditing(row, column, "cost");
                                  }
                                }}
                                title={costChanged ? `Not saved yet (saved: ${formatter.format(saved[row][column].cost)})` : "Double-click to edit"}
                                aria-label={`Cost for ${plan}: ${formatter.format(shown[row][column].cost)}${costChanged ? ", not saved yet" : ""}. Double-click to edit.`}
                                className={cn(costBoxClassName, costChanged ? changedClass : "border-transparent hover:bg-muted", "transition-colors focus-visible:border-ring")}
                              >
                                {formatter.format(shown[row][column].cost)}
                              </button>
                            )}

                            <span aria-hidden className="text-muted-foreground/40">|</span>

                            {openHere && editing.field === "credits" ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editing.value}
                                autoFocus
                                onFocus={(event) => event.currentTarget.select()}
                                onChange={(event) => setEditing((current) => (current ? { ...current, value: event.target.value } : current))}
                                onBlur={finishEditing}
                                onKeyDown={handleEditKeyDown}
                                aria-label={`Credits for ${plan}`}
                                aria-invalid={!isValidCredits(editing.value) || undefined}
                                className={cn(creditBoxClassName, "-mr-2 bg-background outline-none focus-visible:border-ring aria-invalid:border-destructive")}
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
                                title={creditsChanged ? `Not saved yet (saved: ${saved[row][column].credits} cr)` : "Double-click to edit"}
                                aria-label={`Credits for ${plan}: ${shown[row][column].credits}${creditsChanged ? ", not saved yet" : ""}. Double-click to edit.`}
                                className={cn(creditBoxClassName, "-mr-2 text-muted-foreground", creditsChanged ? changedClass : "border-transparent hover:bg-muted", "transition-colors focus-visible:border-ring")}
                              >
                                {shown[row][column].credits} cr
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

        {/* ── The extras ───────────────────────────────────────────────────── */}
        <section className="mt-6" aria-label="Perks">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold">Perks</h3>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                Extras that cost you money. Switch one off to stop offering it — nothing is deleted.
              </p>
            </div>
            <Button type="button" size="sm" onClick={() => setPerkDialog("new")} className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}>
              <Plus className="size-3" aria-hidden />
              Add perk
            </Button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <Table className="min-w-[36rem] text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Perk</TableHead>
                  <TableHead className="w-28 text-right">Cost</TableHead>
                  <TableHead className="w-32 text-right">Offered</TableHead>
                  <TableHead className="w-14 text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perks.map((perk) => {
                  const active = pendingActive.get(perk.id) ?? perk.active;
                  return (
                    <TableRow key={perk.id}>
                      <TableCell>
                        <span className="block font-medium text-foreground">{perk.name}</span>
                        {perk.description ? <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">{perk.description}</span> : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatter.format(perk.cost)}</TableCell>
                      <TableCell>
                        {/* The switch and the word: a lone switch states its position and not its meaning. */}
                        <span className="flex items-center justify-end gap-2">
                          <Switch
                            checked={active}
                            onCheckedChange={() => togglePerk(perk)}
                            disabled={busyPerks.has(perk.id)}
                            size="sm"
                            aria-label={`${active ? "Stop offering" : "Offer"} ${perk.name}`}
                          />
                          <span className={cn("text-[0.65rem] font-medium", active ? "text-foreground" : "text-muted-foreground")}>{active ? "Yes" : "No"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* No delete (decided 2026-10-04): switch a perk off instead. */}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${perk.name}`} />}>
                            <MoreVertical className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-auto min-w-32 whitespace-nowrap">
                            <DropdownMenuItem className="text-xs" onClick={() => setPerkDialog(perk)}>
                              <Pencil className="size-3.5" /> Edit perk
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {perks.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-xs text-muted-foreground">No perks yet.</div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Credit belongs on Expenses: it is the one cost paid before any client pays anything. */}
      <div className="h-full lg:order-1 lg:col-span-1">
        <PanelCredit credit={credit} monthLineCredits={monthLineCredits} />
      </div>

      {perkDialog ? (
        <PerkDialog
          key={perkDialog === "new" ? "new" : perkDialog.id}
          perk={perkDialog === "new" ? null : perkDialog}
          onClose={() => setPerkDialog(null)}
          onSaved={() => {
            setPerkDialog(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

/** Create and Edit a perk: name, description, cost. Save is grey until something changes (and is valid). */
function PerkDialog({ perk, onClose, onSaved }: { perk: PerkRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(perk?.name ?? "");
  const [description, setDescription] = useState(perk?.description ?? "");
  const [cost, setCost] = useState(perk ? perk.cost.toFixed(2) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const valid = name.trim() !== "" && isValidCost(cost);
  const changed =
    perk === null ||
    name.trim() !== perk.name ||
    description.trim() !== (perk.description ?? "") ||
    Number(cost) !== perk.cost;

  function save() {
    if (!valid || !changed) return;
    setError(null);
    startSaving(async () => {
      const result = await savePerk(perk?.id ?? null, { name, description, cost: Number(cost) });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{perk ? `Edit ${perk.name}` : "New perk"}</DialogTitle>
          <DialogDescription>An extra that costs you money. The client&apos;s plan price stays the same.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <Field>
            <FieldLabel htmlFor="perk-name">Name</FieldLabel>
            <Input id="perk-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="IBO Player" className="h-8 text-xs" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="perk-description">Description (optional)</FieldLabel>
            <Input id="perk-description" value={description} maxLength={255} onChange={(event) => setDescription(event.target.value)} placeholder="What the client gets." className="h-8 text-xs" />
          </Field>
          <Field>
            <FieldLabel htmlFor="perk-cost">Cost (USD)</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground" aria-hidden>$</span>
              <Input
                id="perk-cost"
                inputMode="decimal"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                placeholder="0.00"
                aria-invalid={(cost !== "" && !isValidCost(cost)) || undefined}
                className="h-8 pl-6 text-xs tabular-nums"
                required
              />
            </div>
          </Field>

          {error ? <p role="alert" className="text-[0.65rem] text-destructive">{error}</p> : null}

          <DialogFooter>
            <DialogClose render={<Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />}>Cancel</DialogClose>
            <Button type="submit" size="sm" disabled={!valid || !changed || saving} className={cn(blackStyle.button, "h-7 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}>
              {saving ? "Saving…" : perk ? "Save changes" : "Add perk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
