"use client";

import { useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, MonitorSmartphone } from "lucide-react";
import { cn } from "cn";

import { CurrencyFlag } from "@/components/settings/currencyFlag";
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
import { usePersistedChoice } from "@/hooks/use-persisted-choice";

// The subscription plans offered to clients: one plan per device count (1–4) and duration (1, 3, 6, 12 months),
// priced in three currencies. Sample data copied from the pricing sheet for the interface phase.

const durations = [1, 3, 6, 12] as const;
const deviceCounts = [1, 2, 3, 4] as const;

type Duration = (typeof durations)[number];

const currencies = [
  { value: "USD", label: "USD", name: "US dollar", flag: "US" },
  { value: "CAD", label: "CAD", name: "Canadian dollar", flag: "CA" },
  { value: "EUR", label: "EUR", name: "Euro", flag: "EU" },
] as const;

type Currency = (typeof currencies)[number]["value"];

// Module-level, so the persisted-choice hook gets a stable list.
const currencyValues: readonly Currency[] = currencies.map((currency) => currency.value);

// prices[currency][device row][duration column], in the same order as deviceCounts and durations.
type Prices = Record<Currency, readonly (readonly number[])[]>;

const initialPrices: Prices = {
  USD: [
    [14.99, 21.99, 35.99, 57.99],
    [21.99, 36.99, 65.99, 94.99],
    [28.99, 49.99, 86.99, 130.99],
    [36.99, 65.99, 94.99, 144.99],
  ],
  CAD: [
    [19, 29, 49, 79],
    [29, 49, 89, 129],
    [39, 69, 119, 179],
    [49, 89, 129, 199],
  ],
  EUR: [
    [11.99, 17.99, 30.99, 48.99],
    [17.99, 30.99, 55.99, 79.99],
    [24.99, 42.99, 73.99, 110.99],
    [30.99, 55.99, 79.99, 123.99],
  ],
};

// "$14.99", "$19.00", "€11.99", like the sheet. narrowSymbol shows CAD as "$" rather than "CA$".
// The locale is fixed so the server and the browser format the same way.
const priceFormatters = Object.fromEntries(
  currencies.map(({ value }) => [value, new Intl.NumberFormat("en-US", { style: "currency", currency: value, currencyDisplay: "narrowSymbol" })]),
) as Record<Currency, Intl.NumberFormat>;

const planCount = deviceCounts.length * durations.length;

// A price is a positive number with up to two decimals: "14.99", "19", "19.5".
function isValidPrice(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;
}

// Sorting: by the Devices column, or by one duration column's prices.
type SortField = "devices" | Duration;
type Sort = { field: SortField; direction: "asc" | "desc" };

// The one price being edited, and what has been typed so far.
type EditingCell = { currency: Currency; row: number; column: number; value: string };

const pageSizes = [5, 10, 15, 20];

// One box for a price, shown and edited: same width, height, border, padding and text,
// so double-clicking a price swaps it for an input without moving anything.
// -mr-2 on both lines the number up with the column header.
const priceBoxClassName = "h-7 w-24 rounded-md border px-2 text-right text-xs tabular-nums";

// Same look as the tabs in the Configuration header and the view switch on Payment methods.
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
            "inline-flex h-6 items-center gap-1.5 rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === currency.value ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CurrencyFlag flag={currency.flag} />
          {currency.label}
        </button>
      ))}
    </div>
  );
}

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

// The Subscriptions tab of the Configuration page: the price grid, like the pricing sheet.
export function Subscriptions() {
  // Remembered in this browser's local storage, like the sidebar's open state.
  const [currency, setCurrency] = usePersistedChoice<Currency>("onebase:subscriptions-currency", currencyValues, "USD");
  const [sort, setSort] = useState<Sort>({ field: "devices", direction: "asc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const formatter = priceFormatters[currency];
  const currencySymbol = formatter.formatToParts(0).find((part) => part.type === "currency")?.value;

  // Saved prices, starting from the sheet. Kept on screen only for now: they reset on reload until saved for real.
  const [prices, setPrices] = useState<Prices>(initialPrices);
  const [editing, setEditing] = useState<EditingCell | null>(null);

  function startEditing(row: number, column: number) {
    setEditing({ currency, row, column, value: prices[currency][row][column].toFixed(2) });
  }

  // Saves the typed price if it is valid; otherwise the cell goes back to the saved price.
  function finishEditing() {
    if (!editing) return;
    if (isValidPrice(editing.value)) {
      const { currency: editedCurrency, row, column } = editing;
      setPrices((current) => ({
        ...current,
        [editedCurrency]: current[editedCurrency].map((cells, r) => (r === row ? cells.map((price, c) => (c === column ? Number(editing.value.trim()) : price)) : cells)),
      }));
    }
    setEditing(null);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      // Enter only saves a valid price; an invalid one stays open with its red border.
      if (editing && isValidPrice(editing.value)) finishEditing();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
    }
  }

  // Row selection, like the clients table: one row per device count.
  // Export uses the selected rows, or every row when none is selected, with all three currencies.
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
    // One line per plan, like the sheet read row by row.
    downloadCsv(
      "one-base-subscriptions.csv",
      ["Devices", "Duration (months)", ...currencies.map((c) => c.value)],
      exportedRows.flatMap(({ devices, row }) =>
        durations.map((months, column) => [devices, months, ...currencies.map((c) => prices[c.value][row][column].toFixed(2))]),
      ),
    );
  }

  function changeCurrency(next: Currency) {
    // The open cell belongs to the current currency, so switching closes it (saving it if valid).
    finishEditing();
    setCurrency(next);
  }

  function updateSort(field: SortField) {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
    setPage(1);
  }

  // Device rows, sorted by the chosen column. Prices sort in the currency on screen; ties keep fewer devices first.
  const rows = deviceCounts
    .map((devices, row) => ({ devices, row }))
    .sort((a, b) => {
      const value = (entry: { devices: number; row: number }) =>
        sort.field === "devices" ? entry.devices : prices[currency][entry.row][durations.indexOf(sort.field)];
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Subscriptions</h2>
          <p className="mt-1 text-xs text-muted-foreground">Prices for every plan, by number of devices and duration. Double-click a price to edit it.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">{planCount} plans</span>
          <CurrencySwitch value={currency} onChange={changeCurrency} />
          {/* Same button as the clients table. */}
          <Button type="button" size="sm" onClick={exportCsv} className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-[0.65rem]! font-normal!")}>
            <FileDown className="size-3" aria-hidden />
            {selectedDevices.size > 0 ? `Export ${selectedDevices.size} selected` : "Export CSV"}
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
                    {months} {months === 1 ? "month" : "months"}
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
                    aria-label={`Select ${devices} ${devices === 1 ? "device" : "devices"} plans`}
                    className="size-3.5"
                  />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <MonitorSmartphone className="size-3.5 text-muted-foreground" aria-hidden />
                    {devices} {devices === 1 ? "device" : "devices"}
                  </span>
                </TableCell>
                {durations.map((months, column) => {
                  const planLabel = `${devices} ${devices === 1 ? "device" : "devices"}, ${months} ${months === 1 ? "month" : "months"}`;
                  const isEditingCell = editing?.currency === currency && editing.row === row && editing.column === column;

                  return (
                    <TableCell key={months} className="text-right font-medium text-foreground tabular-nums last:pr-4">
                      {isEditingCell ? (
                        // Only this price is editable: Enter or clicking away saves, Esc cancels.
                        // Same box as the price below (priceBoxClassName), so the row does not change size.
                        <span className="relative -mr-2 inline-flex">
                          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-muted-foreground" aria-hidden>{currencySymbol}</span>
                          <Input
                            autoFocus
                            value={editing.value}
                            onChange={(event) => setEditing({ ...editing, value: event.target.value })}
                            onKeyDown={handleEditKeyDown}
                            onBlur={finishEditing}
                            onFocus={(event) => event.currentTarget.select()}
                            inputMode="decimal"
                            aria-label={`Price for ${planLabel}, in ${currency}`}
                            aria-invalid={!isValidPrice(editing.value) || undefined}
                            className={cn(priceBoxClassName, "py-0 pl-5 font-medium md:text-xs")}
                          />
                        </span>
                      ) : (
                        // Double-click to edit. Keyboard: focus the price and press Enter.
                        <button
                          type="button"
                          onDoubleClick={() => startEditing(row, column)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              startEditing(row, column);
                            }
                          }}
                          title="Double-click to edit"
                          aria-label={`${formatter.format(prices[currency][row][column])} for ${planLabel}. Press Enter to edit.`}
                          className={cn(priceBoxClassName, "-mr-2 inline-flex cursor-text items-center justify-end border-transparent transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring")}
                        >
                          {formatter.format(prices[currency][row][column])}
                        </button>
                      )}
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
