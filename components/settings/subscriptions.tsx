"use client";

import { useEffect, useState, useTransition, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, MonitorSmartphone, Save, TriangleAlert } from "lucide-react";
import { cn } from "cn";

import { savePlanPrices } from "@/app/(private)/configuration/planActions";
import { AutoRefresh } from "@/components/app-shell/autoRefresh";
import { LoadError } from "@/components/errors/loadError";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadCsv } from "@/lib/csv";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlanPrice } from "@/lib/plans/plans";

// The subscription plans offered to clients: one plan per device count (1–4) and duration (1, 3, 6, 12 months),
// priced in US dollars — the only currency in One Base (decided 2026-10-04).
// The grid is fixed: no plan is added or removed, only prices change. Changes are kept on screen
// (highlighted) until Save, which sends them all together; the backend keeps all of them or none.

const durations = [1, 3, 6, 12] as const;
const deviceCounts = [1, 2, 3, 4] as const;

type Duration = (typeof durations)[number];

// "$14.99". The locale is fixed so the server and the browser format the same way.
const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const planCount = deviceCounts.length * durations.length;

// A price is a positive number with up to two decimals: "14.99", "19", "19.5".
function isValidPrice(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0 && Number(value) <= 99999.99;
}

const cellKey = (row: number, column: number) => `${row}-${column}`;
const deviceLabel = (devices: number) => `${devices} ${devices === 1 ? "device" : "devices"}`;
const monthLabel = (months: number) => `${months} ${months === 1 ? "month" : "months"}`;

// Sorting: by the Devices column, or by one duration column's prices.
type SortField = "devices" | Duration;
type Sort = { field: SortField; direction: "asc" | "desc" };

// The one price being edited, and what has been typed so far.
type EditingCell = { row: number; column: number; value: string };

const pageSizes = [5, 10, 15, 20];

// One box for a price, shown and edited: same width, height, border, padding and text,
// so double-clicking a price swaps it for an input without moving anything.
// -mr-2 on both lines the number up with the column header.
const priceBoxClassName = "h-7 w-24 rounded-md border px-2 text-right text-xs tabular-nums";

// Same sortable header as the clients table: click to sort, click again to reverse.
function SortHeader({ field, sort, onSort, children }: { field: SortField; sort: Sort; onSort: (field: SortField) => void; children: ReactNode }) {
  const isActive = sort.field === field;
  const SortIcon = isActive ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
      {children}
      <SortIcon className={cn("size-3", isActive ? "text-foreground" : "text-muted-foreground/60")} aria-hidden />
    </button>
  );
}

// Same buttons as the clients table's pagination.
function PaginationButton({ children, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      className={cn(whiteStyle.button, "flex h-7 items-center justify-center gap-1 px-2! text-[0.65rem]! font-normal! text-muted-foreground disabled:pointer-events-none disabled:opacity-35")}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}


/**
 * Why a price looks like a typo, or null. Two checks, and only warnings — they
 * never block Save:
 * - a longer plan should cost more in total than the shorter one before it;
 * - more devices should cost more than fewer devices, for the same duration.
 * (A longer plan being cheaper *per month* is normal: that is the discount.)
 */
function typoWarning(grid: readonly (readonly number[])[], row: number, column: number): string | null {
  const price = grid[row][column];
  if (column > 0 && price <= grid[row][column - 1]) {
    return `Costs the same or less than the ${monthLabel(durations[column - 1])} plan. Typo?`;
  }
  if (row > 0 && price <= grid[row - 1][column]) {
    return `Costs the same or less than with ${deviceLabel(deviceCounts[row - 1])}. Typo?`;
  }
  return null;
}

// The Subscriptions tab of the Configuration page: the price grid, like the pricing sheet.
export function Subscriptions({ plans, loadError }: { plans: PlanPrice[] | null; loadError: string | null }) {
  const router = useRouter();
  const [sort, setSort] = useState<Sort>({ field: "devices", direction: "asc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // The saved prices, as a grid: saved[device row][duration column].
  const saved = deviceCounts.map((devices) =>
    durations.map((months) => plans?.find((plan) => plan.devices === devices && plan.months === months)?.price ?? 0),
  );

  // Changes not saved yet, by cell. What the table shows is the saved price, or the change.
  const [drafts, setDrafts] = useState<ReadonlyMap<string, number>>(new Map());
  const shown = saved.map((cells, row) => cells.map((price, column) => drafts.get(cellKey(row, column)) ?? price));
  const changeCount = drafts.size;

  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [saving, startSaving] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Leaving the page with unsaved changes: the browser asks first.
  useEffect(() => {
    if (changeCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changeCount]);

  function startEditing(row: number, column: number) {
    setEditing({ row, column, value: shown[row][column].toFixed(2) });
  }

  // Keeps the typed price as a change (not saved yet) if it is valid; otherwise the cell goes back.
  function finishEditing() {
    if (!editing) return;
    if (isValidPrice(editing.value)) {
      const { row, column } = editing;
      const price = Math.round(Number(editing.value.trim()) * 100) / 100;
      setDrafts((current) => {
        const next = new Map(current);
        // Typed back to the saved price: no longer a change.
        if (price === saved[row][column]) next.delete(cellKey(row, column));
        else next.set(cellKey(row, column), price);
        return next;
      });
      setSaveMessage(null);
    }
    setEditing(null);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      // Enter only keeps a valid price; an invalid one stays open with its red border.
      if (editing && isValidPrice(editing.value)) finishEditing();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
    }
  }

  function save() {
    const changes = [...drafts.entries()].map(([key, price]) => {
      const [row, column] = key.split("-").map(Number);
      return { devices: deviceCounts[row], months: durations[column], price };
    });
    if (changes.length === 0) return;
    startSaving(async () => {
      const result = await savePlanPrices(changes);
      if (!result.ok) {
        // Nothing was saved: the changes stay on screen, highlighted, to fix and try again.
        setSaveMessage({ ok: false, text: result.error });
        return;
      }
      setDrafts(new Map());
      setSaveMessage({ ok: true, text: `Saved ${changes.length} ${changes.length === 1 ? "price" : "prices"}.` });
      router.refresh();
    });
  }

  // Row selection, like the clients table: one row per device count.
  // Export uses the selected rows, or every row when none is selected.
  const [selectedDevices, setSelectedDevices] = useState<ReadonlySet<number>>(() => new Set());
  const allSelected = deviceCounts.every((devices) => selectedDevices.has(devices));

  function toggleAll(checked: boolean) {
    setSelectedDevices(checked ? new Set(deviceCounts) : new Set());
  }

  function toggleDevices(devices: number, checked: boolean) {
    setSelectedDevices((current) => {
      const next = new Set(current);
      if (checked) next.add(devices);
      else next.delete(devices);
      return next;
    });
  }

  function exportCsv() {
    const exportedRows = deviceCounts.map((devices, row) => ({ devices, row })).filter(({ devices }) => selectedDevices.size === 0 || selectedDevices.has(devices));
    // One line per plan, like the sheet read row by row. The saved prices, not unsaved changes.
    downloadCsv(
      "one-base-subscriptions.csv",
      ["Devices", "Duration (months)", "Price (USD)"],
      exportedRows.flatMap(({ devices, row }) => durations.map((months, column) => [devices, months, saved[row][column].toFixed(2)])),
    );
  }

  function updateSort(field: SortField) {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
    setPage(1);
  }

  if (!plans) {
    return <LoadError title="The subscription prices could not be loaded." reason={loadError ?? "Please try again."} />;
  }

  // Device rows, sorted by the chosen column (prices as shown, changes included); ties keep fewer devices first.
  const rows = deviceCounts
    .map((devices, row) => ({ devices, row }))
    .sort((a, b) => {
      const value = (entry: { devices: number; row: number }) =>
        sort.field === "devices" ? entry.devices : shown[entry.row][durations.indexOf(sort.field)];
      const comparison = value(a) - value(b) || a.devices - b.devices;
      return sort.direction === "asc" ? comparison : -comparison;
    });

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    // Full height of the tab panel, so the pagination sits at the bottom.
    <div className="flex min-h-full flex-col">
      {/* Another Admin's saved prices show up by themselves — but never over changes not saved yet. */}
      {changeCount === 0 && !editing ? <AutoRefresh /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Subscriptions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Prices in US dollars, by number of devices and duration. Double-click a price to change it, then Save. A new price applies to new payments only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage ? (
            <span role="status" className={cn("flex items-center gap-1 text-[0.65rem]", saveMessage.ok ? "text-muted-foreground" : "text-destructive")}>
              {saveMessage.ok ? <Check className="size-3 text-(--viz-good)" aria-hidden /> : null}
              {saveMessage.text}
            </span>
          ) : null}
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">{planCount} plans</span>
          <Button type="button" size="sm" onClick={exportCsv} className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}>
            <FileDown className="size-3" aria-hidden />
            {selectedDevices.size > 0 ? `Export ${selectedDevices.size} selected` : "Export CSV"}
          </Button>
          {/* Grey until something changes. Saves every change together. */}
          <Button type="button" size="sm" onClick={save} disabled={changeCount === 0 || saving || Boolean(editing)} className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}>
            <Save className="size-3" aria-hidden />
            {saving ? "Saving…" : changeCount > 1 ? `Save ${changeCount} changes` : "Save"}
          </Button>
        </div>
      </div>

      {/* Same table classes as the clients and payment methods tables. Scrolls sideways on small screens. */}
      <div className="mt-5 flex-1 overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[600px] table-fixed border-separate border-spacing-0 text-xs">
          <TableHeader className="[&_tr]:border-0 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} aria-label="Select all plans" className="size-3.5" />
              </TableHead>
              <TableHead className="w-40">
                <SortHeader field="devices" sort={sort} onSort={updateSort}>Devices</SortHeader>
              </TableHead>
              {durations.map((months) => (
                <TableHead key={months} className="text-right last:pr-4">
                  <SortHeader field={months} sort={sort} onSort={updateSort}>
                    {monthLabel(months)}
                  </SortHeader>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map(({ devices, row }) => (
              <TableRow key={devices} data-state={selectedDevices.has(devices) ? "selected" : undefined} className="border-b border-border/80 last:border-0">
                <TableCell>
                  <Checkbox
                    checked={selectedDevices.has(devices)}
                    onCheckedChange={(checked) => toggleDevices(devices, checked === true)}
                    aria-label={`Select ${deviceLabel(devices)} plans`}
                    className="size-3.5"
                  />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <MonitorSmartphone className="size-3.5 text-muted-foreground" aria-hidden />
                    {deviceLabel(devices)}
                  </span>
                </TableCell>
                {durations.map((months, column) => {
                  const planLabel = `${deviceLabel(devices)}, ${monthLabel(months)}`;
                  const isEditingCell = editing?.row === row && editing.column === column;
                  const changed = drafts.has(cellKey(row, column));
                  const warning = typoWarning(shown, row, column);

                  return (
                    <TableCell key={months} className="text-right font-medium text-foreground tabular-nums last:pr-4">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        {/* A warning only: Save still works. */}
                        {warning && !isEditingCell ? (
                          <span title={warning} role="img" aria-label={warning} className="inline-flex">
                            <TriangleAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                          </span>
                        ) : null}
                        {isEditingCell ? (
                          // Only this price is editable: Enter or clicking away keeps it, Esc cancels.
                          // Same box as the price below (priceBoxClassName), so the row does not change size.
                          <span className="relative -mr-2 inline-flex">
                            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-muted-foreground" aria-hidden>$</span>
                            <Input
                              autoFocus
                              value={editing.value}
                              onChange={(event) => setEditing({ ...editing, value: event.target.value })}
                              onKeyDown={handleEditKeyDown}
                              onBlur={finishEditing}
                              onFocus={(event) => event.currentTarget.select()}
                              inputMode="decimal"
                              aria-label={`Price for ${planLabel}, in US dollars`}
                              aria-invalid={!isValidPrice(editing.value) || undefined}
                              className={cn(priceBoxClassName, "py-0 pl-5 font-medium md:text-xs")}
                            />
                          </span>
                        ) : (
                          // Double-click to edit. Keyboard: focus the price and press Enter.
                          // A change not saved yet is highlighted until Save.
                          <button
                            type="button"
                            onDoubleClick={() => startEditing(row, column)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                startEditing(row, column);
                              }
                            }}
                            title={changed ? `Not saved yet (saved price: ${formatter.format(saved[row][column])})` : "Double-click to edit"}
                            aria-label={`${formatter.format(shown[row][column])} for ${planLabel}${changed ? ", not saved yet" : ""}. Press Enter to edit.`}
                            className={cn(
                              priceBoxClassName,
                              "-mr-2 inline-flex cursor-text items-center justify-end transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                              changed ? "border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/15" : "border-transparent hover:bg-muted",
                            )}
                          >
                            {formatter.format(shown[row][column])}
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

      {/* Same pagination as the clients table. -mx-4 -mb-4 lets its top border run the full width of the panel. */}
      <footer className="-mx-4 -mb-4 mt-4 flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <p>
            Showing <span className="font-medium text-foreground">{startIndex + 1}–{Math.min(startIndex + pageSize, rows.length)}</span> of{" "}
            <span className="font-medium text-foreground">{rows.length}</span>
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-28 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>
              {pageSize} per page
              <ChevronDown className="size-3" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-32">
              <DropdownMenuRadioGroup value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
                {pageSizes.map((size) => (
                  <DropdownMenuRadioItem key={size} value={String(size)} className="text-xs">{size} per page</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1 sm:ml-auto">
          <PaginationButton label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="size-3" /></PaginationButton>
          <PaginationButton label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-3" /><span>Previous</span></PaginationButton>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-md border bg-background px-2 font-medium text-foreground">{currentPage}</span>
          <span className="px-1">of {pageCount}</span>
          <PaginationButton label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><span>Next</span><ChevronRight className="size-3" /></PaginationButton>
          <PaginationButton label="Last page" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="size-3" /></PaginationButton>
        </div>
      </footer>
    </div>
  );
}
