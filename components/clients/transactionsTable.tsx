"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "cn";

import { AddPaymentDialog } from "@/components/clients/addPaymentDialog";
import { BrandGlyph } from "@/components/clients/brandGlyph";
import {
  PaginationButton,
  PaymentMethodLabel,
  SortHeader,
} from "@/components/clients/clientsTable";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadCsv } from "@/lib/csv";
import { exactMoney, money } from "@/lib/format";
import type { Client, ClientTransaction, PaymentKind } from "@/lib/clients/sample";
import {
  TRANSACTION_COLUMNS_COOKIE,
  TRANSACTION_COLUMNS_COOKIE_MAX_AGE,
  TRANSACTION_FIXED_COLUMNS_WIDTH,
  serializeHiddenTransactionColumns,
  transactionColumns,
  type TransactionColumnId,
} from "@/lib/clients/transactionColumns";

/**
 * One client's payments, drawn as the Clients table draws its rows.
 *
 * <p>Same toolbar, same sticky muted header, same row rhythm, same footer —
 * and the same `SortHeader`, `PaginationButton` and `PaymentMethodLabel`,
 * imported rather than copied, so the two tables cannot drift into two
 * dialects of one design.
 *
 * <p>Expense and Net are the receipt's arithmetic laid out by column: the
 * receipt beside this reads each payment down, this reads them across, and
 * both come from the same rows so they agree to the cent.
 *
 * <p>The rows are not this table’s own: they arrive from `ClientLedger`, which
 * shares them with the receipt, and "Add payment" hands a new one back up
 * rather than keeping it here. Sorting, searching, paging and selection are
 * the only state this component holds.
 */

type SortField = "at" | "kind" | "amount" | "expense" | "net";

/**
 * The Type pill's dot: the status pill exactly, dot and all.
 *
 * <p>⚠️ No colour. New and renewed are two ordinary facts, not a good and a bad
 * one, and the Clients table keeps colour for meaning — tinting one of them
 * would make it read as a warning. So the dots differ only in weight: a solid
 * one for the payment that opened the plan, which happens once per client, and
 * a faint one for the renewals that make up the rest. The word carries the
 * meaning; the dot just lets the one "New plan" stand out down a column of
 * renewals.
 */
const kindDots: Record<PaymentKind, string> = {
  "New plan": "bg-foreground",
  Renewal: "bg-muted-foreground/50",
};

const pageSizes = [5, 10, 15, 20];

/** "12 Jan 2026". UTC and a fixed locale, so server and browser agree. */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

/** What a payment left. A cost not on file counts as nothing — see the receipt. */
const netOf = (entry: ClientTransaction) => entry.amount - (entry.expense ?? 0);

// The hideable columns, their widths and the cookie live in
// lib/clients/transactionColumns — a plain module, so the page can read the
// same cookie on the server.

export function TransactionsTable({
  client,
  transactions,
  onAddPayments,
  defaultHiddenColumns = [],
  className,
}: {
  client: Client;
  transactions: readonly ClientTransaction[];
  onAddPayments: (payments: readonly ClientTransaction[]) => void;
  /** Read from the cookie by the page, so the first HTML is already correct. */
  defaultHiddenColumns?: readonly TransactionColumnId[];
  className?: string;
}) {
  // "0012" — names the CSV file, so two clients’ exports never overwrite each other.
  const clientNumber = String(client.id).padStart(4, "0");
  const [query, setQuery] = useState("");
  // Newest first, the order a statement is read in.
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({ field: "at", direction: "desc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /**
   * Which columns are turned off — the Clients table's arrangement exactly.
   *
   * <p>Hidden rather than visible, so the default is "everything" and a column
   * added later shows up on its own. ⚠️ Seeded from the server, which read the
   * cookie: reading it here instead would draw every column and then drop some
   * as React hydrated.
   */
  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<TransactionColumnId>>(
    () => new Set<TransactionColumnId>(defaultHiddenColumns),
  );

  const shows = (column: TransactionColumnId) => !hiddenColumns.has(column);

  const toggleColumn = (column: TransactionColumnId, visible: boolean) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (visible) next.delete(column);
      else next.add(column);

      // Written with the click that caused it, as the Clients table does, so
      // there is no render in which the two disagree.
      document.cookie = `${TRANSACTION_COLUMNS_COOKIE}=${serializeHiddenTransactionColumns(next)}; path=/; max-age=${TRANSACTION_COLUMNS_COOKIE_MAX_AGE}; samesite=lax`;

      return next;
    });
  };

  // ⚠️ The floor is the sum of the visible columns, for the reason the Clients
  // table gives: a floor below the sum makes `table-fixed` squeeze every column
  // until the headings overlap. Hiding a column narrows the table by exactly
  // that column.
  const tableMinWidth =
    TRANSACTION_FIXED_COLUMNS_WIDTH +
    transactionColumns.reduce((total, column) => (shows(column.id) ? total + column.width : total), 0);

  const paid = transactions.reduce((total, entry) => total + entry.amount, 0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions
      .filter((entry) =>
        !normalized ||
        [entry.description, entry.kind, entry.brand, entry.method, formatDate(entry.at)].some((value) => value.toLowerCase().includes(normalized)),
      )
      .toSorted((a, b) => {
        const value = (entry: ClientTransaction) =>
          sort.field === "at" ? entry.at
            : sort.field === "kind" ? entry.kind
            : sort.field === "net" ? netOf(entry)
            // ⚠️ An unknown cost sorts below every known one, not as zero —
            // zero would slot it among the cheapest, which is a claim.
            : sort.field === "expense" ? entry.expense ?? -Infinity
            : entry.amount;
        const left = value(a);
        const right = value(b);
        const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [query, sort, transactions]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visible = filtered.slice(startIndex, startIndex + pageSize);
  const allVisibleSelected = visible.length > 0 && visible.every((entry) => selected.has(entry.id));

  function updateSort(field: SortField) {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "desc" ? "asc" : "desc" }));
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((entry) => (checked ? next.add(entry.id) : next.delete(entry.id)));
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function exportCsv() {
    // Full names and plain numbers: a spreadsheet opened later needs to add
    // these up, and "$3,100.00" is text to it.
    downloadCsv(
      `one-base-client-${clientNumber}-transactions.csv`,
      ["Date", "Brand", "Type", "Description", "Payment method", "Amount", "Expense", "Net"],
      filtered.map((entry) => [
        entry.at,
        entry.brand,
        entry.kind,
        entry.description,
        entry.method,
        entry.amount.toFixed(2),
        entry.expense === null ? "" : entry.expense.toFixed(2),
        netOf(entry).toFixed(2),
      ]),
    );
  }

  return (
    <section aria-label="Transactions" className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card", className)}>
      {/* The Clients toolbar, with the title where the status filter sits:
          this is one card among three, and it has to say what it is. */}
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Transactions</h2>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            {transactions.length} {transactions.length === 1 ? "payment" : "payments"} · {money(paid)} in total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search payments"
              aria-label="Search payments"
              className="bg-muted/30 pl-8 text-xs"
            />
          </div>
          {/* ⚠️ The label sits inside a Group: Base UI's `Menu.GroupLabel`
              throws without one, which renders the 500 screen — the trap the
              Clients table notes too. */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label="Choose columns" title="Choose columns" className={cn(whiteStyle.button, "size-7 shrink-0 justify-center px-0! py-0!")} />}>
              <SlidersHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[0.65rem]">Show columns</DropdownMenuLabel>
                {transactionColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={shows(column.id)}
                    onCheckedChange={(checked) => toggleColumn(column.id, checked)}
                    // Stays open while several are toggled.
                    closeOnClick={false}
                    className="text-xs"
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddPaymentDialog client={client} onAdd={(payment) => { onAddPayments([payment]); setQuery(""); setPage(1); }} />
          <Button
            type="button"
            size="sm"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
          >
            <FileDown className="size-3" />Export CSV
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table
          style={{ minWidth: `${tableMinWidth}px` }}
          className="table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap [&_td:last-child]:pr-3 [&_th:last-child]:pr-3"
        >
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-8">
                <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleAllVisible(checked === true)} aria-label="Select all visible payments" className="size-3.5" />
              </TableHead>
              <TableHead className="w-28"><SortHeader field="at" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Date</SortHeader></TableHead>
              {shows("brand") ? (
              <TableHead className="w-16">Brand</TableHead>
              ) : null}
              {shows("kind") ? (
              <TableHead className="w-28"><SortHeader field="kind" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Type</SortHeader></TableHead>
              ) : null}
              <TableHead>Description</TableHead>
              {shows("method") ? (
              <TableHead className="w-32">Payment</TableHead>
              ) : null}
              {/* Money columns right-aligned, so the decimal points line up
                  down the column and the figures can be compared by eye. */}
              {shows("amount") ? (
              <TableHead className="w-28 text-right [&>button]:flex-row-reverse"><SortHeader field="amount" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Amount</SortHeader></TableHead>
              ) : null}
              {shows("expense") ? (
              <TableHead className="w-24 text-right [&>button]:flex-row-reverse"><SortHeader field="expense" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Expense</SortHeader></TableHead>
              ) : null}
              {shows("net") ? (
              <TableHead className="w-28 text-right [&>button]:flex-row-reverse"><SortHeader field="net" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Net</SortHeader></TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((entry) => (
              <TableRow
                key={entry.id}
                data-state={selected.has(entry.id) ? "selected" : undefined}
                className="border-b border-border/80 last:border-0"
              >
                <TableCell>
                  <Checkbox checked={selected.has(entry.id)} onCheckedChange={(checked) => toggleRow(entry.id, checked === true)} aria-label={`Select payment of ${formatDate(entry.at)}`} className="size-3.5" />
                </TableCell>
                <TableCell className="py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(entry.at)}</TableCell>
                {shows("brand") ? (
                <TableCell>
                  {/* The Clients table’s brand cell — a logo, named in its tooltip. */}
                  <Tooltip>
                    <TooltipTrigger render={<span className="inline-flex size-7 items-center justify-center" aria-label={entry.brand} />}>
                      <BrandGlyph src={entry.brandLogo} className="size-4.5" />
                    </TooltipTrigger>
                    <TooltipContent>{entry.brand}</TooltipContent>
                  </Tooltip>
                </TableCell>
                ) : null}
                {shows("kind") ? (
                <TableCell>
                  <TypePill kind={entry.kind} />
                </TableCell>
                ) : null}
                <TableCell className="truncate font-medium">{entry.description}</TableCell>
                {shows("method") ? (
                <TableCell className="text-muted-foreground"><PaymentMethodLabel method={entry.method} /></TableCell>
                ) : null}
                {shows("amount") ? (
                <TableCell className="text-right tabular-nums">{exactMoney(entry.amount)}</TableCell>
                ) : null}
                {shows("expense") ? (
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {entry.expense === null ? (
                    // Not "$0.00": no cost on file is not the same as free.
                    <span title="No plan cost on file">—</span>
                  ) : (
                    `−${exactMoney(entry.expense)}`
                  )}
                </TableCell>
                ) : null}
                {/* The revenue green from the Clients table, on the one column
                    that is money kept. `dark:` step so it holds on a dark card. */}
                {shows("net") ? (
                <TableCell className="text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{exactMoney(netOf(entry))}
                </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visible.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center text-xs text-muted-foreground">
            {transactions.length === 0 ? "No payments from this client yet." : "No payments match your search."}
          </div>
        ) : null}
      </div>

      <footer className="flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <p>
            Showing <span className="font-medium text-foreground">{filtered.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-28 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>
              {pageSize} per page<ChevronDown className="size-3" />
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
    </section>
  );
}

/** New plan or Renewal, as a neutral pill — see `kindDots`. */
function TypePill({ kind }: { kind: PaymentKind }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium whitespace-nowrap text-foreground">
      <span className={cn("size-1.5 shrink-0 rounded-full", kindDots[kind])} aria-hidden />
      {kind}
    </span>
  );
}
