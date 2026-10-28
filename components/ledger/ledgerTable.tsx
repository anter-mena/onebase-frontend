"use client";

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileDown, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "cn";

import { RangeFilter } from "@/components/app-shell/rangeFilter";
import { BrandGlyph } from "@/components/clients/brandGlyph";
import { PaymentMethodLabel, SortHeader } from "@/components/clients/clientsTable";
import { ProofAction } from "@/components/clients/proofAction";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { exactMoney } from "@/lib/format";
import { planDescription } from "@/lib/clients/sample";
import { providerLabels, type BackendProvider } from "@/lib/clients/types";
import type { LedgerData, LedgerTopup } from "@/lib/dashboard/types";
import { rangeNote } from "@/lib/seo/types";

/**
 * The Ledger (decided 2026-10-06): every payment received, newest first — who
 * paid, for what, to which account, and what it left. Filtered by period (the
 * SEO and Dashboard filter) and by account, both on the server; by brand in the
 * browser (2026-10-28). Every column sorts. The Dashboard's card History opens it
 * on one account. Admins only.
 *
 * <p>A cash view (decided 2026-10-16): the panel-credit top-ups are money out on
 * the day they are paid, so they sit among the payments as outgoing lines, and
 * the balance under the list adds up what came in and went out. A top-up belongs
 * to no account and no brand: filtered to one, there are none.
 */

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));
const pageSizes = [10, 20, 50, 100];

/** One line of the ledger: a payment received, or a top-up paid. */
type Entry =
  | { kind: "payment"; date: string; row: LedgerData["rows"][number] }
  | { kind: "topup"; date: string; topup: LedgerTopup };

const topupPlan = (topup: LedgerTopup) => `+${topup.credits.toLocaleString("en-US")} credits`;

type SortField = "date" | "client" | "plan" | "type" | "paidTo" | "brand" | "amount" | "perks" | "net";

type Flow = "all" | "revenue" | "expenses";
const FLOWS: { id: Flow; label: string }[] = [
  { id: "all", label: "All" },
  { id: "revenue", label: "Revenue" },
  { id: "expenses", label: "Expenses" },
];

/** What a line is sorted by, per column — a top-up's money is negative, as in the Amount and Net columns. */
function sortValue(entry: Entry, field: SortField): string | number {
  if (entry.kind === "topup") {
    const { topup } = entry;
    switch (field) {
      case "date": return entry.date;
      case "client": return "Panel credit top-up";
      case "plan": return topup.credits;
      case "type": return "Top-up";
      case "amount":
      case "net": return -topup.amount;
      case "perks": return 0;
      default: return "";
    }
  }
  const { payment, clientName } = entry.row;
  switch (field) {
    case "date": return entry.date;
    case "client": return clientName;
    case "plan": return payment.months * 100 + payment.devices;
    case "type": return payment.kind === "NEW_PLAN" ? "New plan" : "Renewal";
    case "paidTo": return payment.paymentMethodName ?? "";
    case "brand": return payment.brandName ?? "";
    case "amount": return payment.amount;
    case "perks": return payment.perksCost;
    case "net": return payment.amount - payment.perksCost;
  }
}

export function LedgerTable({
  data,
  methods,
}: {
  data: LedgerData;
  /** Every account, for the filter. */
  methods: { id: number; provider: BackendProvider; name: string; active: boolean }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  // Period and account live in the address bar: the server fetches them.
  function navigate(update: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    update(next);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }
  function chooseRange(range: string, dates?: { from: string; to: string }) {
    navigate((next) => {
      next.set("range", range);
      next.delete("from");
      next.delete("to");
      if (dates) {
        next.set("from", dates.from);
        next.set("to", dates.to);
      }
    });
  }
  const account = methods.find((method) => method.id === data.methodId) ?? null;

  // Payments and top-ups by date, newest first (a top-up's day is the one it was paid on).
  const entries = useMemo<Entry[]>(
    () =>
      [
        ...data.rows.map((row): Entry => ({ kind: "payment", date: row.payment.paidOn, row })),
        ...data.topups.map((topup): Entry => ({ kind: "topup", date: topup.createdAt.slice(0, 10), topup })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [data.rows, data.topups],
  );

  // The brands paid for in the period, for the brand filter: only those with a
  // payment here, since any other would show an empty list.
  const brands = useMemo(() => {
    const seen = new Map<number, { id: number; name: string; logoUrl: string | null }>();
    for (const { payment } of data.rows) {
      if (!seen.has(payment.brandId)) {
        seen.set(payment.brandId, { id: payment.brandId, name: payment.brandName ?? `#${payment.brandId}`, logoUrl: payment.brandLogoUrl });
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.rows]);
  // In the browser, not the address bar: the period's payments are all here already.
  const [brandId, setBrandId] = useState<number | null>(null);
  const brand = brands.find((entry) => entry.id === brandId) ?? null;

  /**
   * Which way the money went (2026-10-28). Revenue: the payments, money in.
   * Expenses: the money out — the top-ups, and the payments that paid a perk,
   * since a perk is paid on that payment's line.
   */
  const [flow, setFlow] = useState<Flow>("all");

  // For the filter button: how many are on, and one click to turn them all off.
  const activeFilters = (flow === "all" ? 0 : 1) + (account ? 1 : 0) + (brand ? 1 : 0);
  function clearFilters() {
    setFlow("all");
    setBrandId(null);
    setPage(1);
    if (account) navigate((next) => next.delete("method"));
  }

  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({ field: "date", direction: "desc" });
  function updateSort(field: SortField) {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
    setPage(1);
  }

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    // A top-up belongs to no brand, as it belongs to no account: filtered to one brand, there are none.
    const kept = entries.filter((entry) => {
      if (brand && (entry.kind === "topup" || entry.row.payment.brandId !== brand.id)) return false;
      if (flow === "revenue" && entry.kind !== "payment") return false;
      if (flow === "expenses" && entry.kind === "payment" && entry.row.payment.perksCost <= 0) return false;
      if (!needle) return true;
      return (entry.kind === "payment"
        ? [entry.row.clientName, entry.row.payment.brandName ?? "", entry.row.payment.paymentMethodName ?? "", planDescription(entry.row.payment.months, entry.row.payment.devices)]
        : ["Panel credit top-up", topupPlan(entry.topup), entry.topup.note ?? "", entry.topup.createdByName ?? ""]
      ).some((value) => value.toLowerCase().includes(needle));
    });
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...kept].sort((a, b) => {
      const left = sortValue(a, sort.field);
      const right = sortValue(b, sort.field);
      const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
      // Same value: newest first, so equal amounts keep the ledger's own order.
      return order !== 0 ? order * sign : b.date.localeCompare(a.date);
    });
  }, [entries, query, brand, flow, sort]);

  // The balance, for the whole period and account (not the search). With a brand
  // chosen it is that brand's: its payments and their perks, and no top-ups. With
  // Revenue, only the money in; with Expenses, only the money out.
  const brandRows = brand ? data.rows.filter((row) => row.payment.brandId === brand.id) : data.rows;
  const paymentsIn = flow === "expenses" ? 0 : brandRows.length;
  const moneyIn = flow === "expenses" ? 0 : brand ? brandRows.reduce((total, row) => total + row.payment.amount, 0) : data.moneyIn;
  const topupsOut = brand || flow === "revenue" ? 0 : data.topups.reduce((total, topup) => total + topup.amount, 0);
  const perksOut = flow === "revenue" ? 0 : brandRows.reduce((total, row) => total + row.payment.perksCost, 0);
  const net = brand || flow !== "all" ? moneyIn - topupsOut - perksOut : data.net;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visible = rows.slice(startIndex, startIndex + pageSize);

  function exportCsv() {
    const headings = ["Date", "Client", "Plan", "Type", "Method", "Account", "Brand", "Amount (USD)", "Perks (USD)", "Net (USD)", "Note"];
    const lines = rows.map((entry) => {
      if (entry.kind === "topup") {
        // Money out: negative, so the sum of a column is the period's cash.
        const { topup } = entry;
        return [
          entry.date, "Panel credit top-up", topupPlan(topup), "Top-up", "", "", "", (-topup.amount).toFixed(2), "", (-topup.amount).toFixed(2),
          [topup.note ?? "", topup.createdByName ? `by ${topup.createdByName}` : ""].filter(Boolean).join(" · "),
        ];
      }
      const { payment, clientName } = entry.row;
      return [
        payment.paidOn, clientName, planDescription(payment.months, payment.devices), payment.kind === "NEW_PLAN" ? "New plan" : "Renewal",
        payment.paymentProvider ? providerLabels[payment.paymentProvider] : "", payment.paymentMethodName ?? "", payment.brandName ?? "",
        payment.amount.toFixed(2), (-payment.perksCost).toFixed(2), (payment.amount - payment.perksCost).toFixed(2), "",
      ];
    });
    const csv = [headings, ...lines].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `one-base-ledger${account ? `-${account.name.replace(/\W+/g, "-").toLowerCase()}` : ""}-${data.start}-${data.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* One row (2026-10-28): the period on the left; search, Export and the filter button on the right. The
          search takes what is left; on a narrow screen the row wraps rather than
          squeezing. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-3 xl:flex-nowrap">
        <RangeFilter
          value={data.range}
          start={data.start}
          end={data.end}
          onChange={(id) => chooseRange(id)}
          onCustom={(from, to) => chooseRange("custom", { from, to })}
        />
        <div className="relative ml-auto min-w-40 flex-1 xl:max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search client, plan, brand, note" aria-label="Search the ledger" className="bg-muted/30 pl-8 text-xs" />
        </div>
        <Button type="button" size="sm" onClick={exportCsv} disabled={rows.length === 0} className={cn(blackStyle.button, "shrink-0 px-3! py-0! text-[0.65rem]! font-normal!")}><FileDown className="size-3" />Export CSV</Button>
        {/* Money in or out, account and brand behind one icon (2026-10-28): the row
            was crowded. The badge counts the filters that are on. */}
        <Popover>
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(whiteStyle.button, "relative size-7 shrink-0 p-0!")}
                      aria-label={activeFilters ? `Filters, ${activeFilters} on` : "Filters"}
                    />
                  }
                />
              }
            >
              <SlidersHorizontal className="size-3.5" aria-hidden />
              {activeFilters ? (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[0.55rem] font-semibold text-background tabular-nums">
                  {activeFilters}
                </span>
              ) : null}
            </TooltipTrigger>
            <TooltipContent>Filters</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-64 gap-3 p-3">
            <div className="flex items-center justify-between">
              <PopoverTitle className="text-xs font-semibold">Filters</PopoverTitle>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!activeFilters}
                className="text-[0.65rem] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                Clear filters
              </button>
            </div>

            <FilterField label="Money">
              <div role="group" aria-label="Revenue or expenses" className="grid grid-cols-3 rounded-lg border border-border/60 bg-muted p-0.5">
                {FLOWS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => { setFlow(option.id); setPage(1); }}
                    aria-pressed={flow === option.id}
                    className={cn(
                      "inline-flex h-6 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                      flow === option.id ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FilterField>

            <FilterField label="Account">
              <Select
                value={account ? String(account.id) : "all"}
                onValueChange={(value) => navigate((next) => (value === "all" || value === null ? next.delete("method") : next.set("method", String(value))))}
              >
                <SelectTrigger aria-label="Account" className="h-8 w-full text-xs">
                  <SelectValue>
                    {(value: string | null) => {
                      const method = methods.find((entry) => String(entry.id) === value);
                      return method ? <PaymentMethodLabel method={providerLabels[method.provider]} account={method.name} /> : "All accounts";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="all" className="text-xs">All accounts</SelectItem>
                  {methods.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)} className="text-xs">
                      <PaymentMethodLabel method={providerLabels[method.provider]} account={method.name} />
                      {method.active ? null : <span className="text-muted-foreground">(off)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* By brand: the brands paid for in this period. */}
            <FilterField label="Brand">
              <Select
                value={brand ? String(brand.id) : "all"}
                onValueChange={(value) => { setBrandId(value === "all" || value === null ? null : Number(value)); setPage(1); }}
              >
                <SelectTrigger aria-label="Brand" className="h-8 w-full text-xs">
                  <SelectValue>
                    {(value: string | null) => {
                      const entry = brands.find((item) => String(item.id) === value);
                      return entry ? (
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          {entry.logoUrl ? <BrandGlyph src={entry.logoUrl} className="size-3" /> : null}
                          <span className="truncate">{entry.name}</span>
                        </span>
                      ) : (
                        "All brands"
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="all" className="text-xs">All brands</SelectItem>
                  {brands.map((entry) => (
                    <SelectItem key={entry.id} value={String(entry.id)} className="text-xs">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        {entry.logoUrl ? <BrandGlyph src={entry.logoUrl} className="size-3" /> : null}
                        <span className="truncate">{entry.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[1004px] table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              {/* Every column sorts (2026-10-28), as on the Clients table. The money columns
                  are right-aligned, so their arrow sits before the word. */}
              <TableHead className="w-28"><SortHeader field="date" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Date</SortHeader></TableHead>
              <TableHead className="w-44"><SortHeader field="client" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Client</SortHeader></TableHead>
              <TableHead><SortHeader field="plan" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Plan</SortHeader></TableHead>
              <TableHead className="w-24"><SortHeader field="type" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Type</SortHeader></TableHead>
              <TableHead className="w-36"><SortHeader field="paidTo" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Paid to</SortHeader></TableHead>
              <TableHead className="w-28"><SortHeader field="brand" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Brand</SortHeader></TableHead>
              <TableHead className="w-24 text-right [&>button]:flex-row-reverse"><SortHeader field="amount" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Amount</SortHeader></TableHead>
              <TableHead className="w-24 text-right [&>button]:flex-row-reverse"><SortHeader field="perks" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Perks</SortHeader></TableHead>
              <TableHead className="w-24 text-right [&>button]:flex-row-reverse"><SortHeader field="net" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Net</SortHeader></TableHead>
              <TableHead className="w-[4.5rem] text-right" aria-label="Proof and receipt" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((entry) => {
              if (entry.kind === "topup") {
                const { topup } = entry;
                return (
                  <TableRow key={`topup-${topup.id}`} className="border-b border-border/80 bg-muted/20 last:border-0">
                    <TableCell className="py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(entry.date)}</TableCell>
                    <TableCell className="truncate">
                      <span className="font-medium">Panel credit top-up</span>
                      {topup.createdByName ? <span className="block truncate text-[0.6rem] text-muted-foreground">by {topup.createdByName}</span> : null}
                    </TableCell>
                    <TableCell className="truncate" title={topup.note ?? undefined}>
                      {topupPlan(topup)}
                      {topup.note ? <span className="text-muted-foreground"> · {topup.note}</span> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">Top-up</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-destructive">−{exactMoney(topup.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">—</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-destructive">−{exactMoney(topup.amount)}</TableCell>
                    <TableCell />
                  </TableRow>
                );
              }
              const { payment, clientId, clientName } = entry.row;
              const extras = payment.perks.map((perk) => `${perk.name} ×${perk.quantity}`).join(", ");
              return (
                <TableRow key={payment.id} className="border-b border-border/80 last:border-0">
                  <TableCell className="py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(payment.paidOn)}</TableCell>
                  <TableCell className="truncate font-medium"><Link href={`/clients/${clientId}`} className="underline-offset-4 hover:underline">{clientName}</Link></TableCell>
                  <TableCell className="truncate">{planDescription(payment.months, payment.devices)}{extras ? <span className="text-muted-foreground"> + {extras}</span> : null}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.kind === "NEW_PLAN" ? "New plan" : "Renewal"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.paymentProvider ? <PaymentMethodLabel method={providerLabels[payment.paymentProvider]} account={payment.paymentMethodName ?? undefined} /> : "—"}
                  </TableCell>
                  <TableCell className="truncate">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      {payment.brandLogoUrl ? <BrandGlyph src={payment.brandLogoUrl} className="size-3" /> : null}
                      <span className="truncate">{payment.brandName ?? "—"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{exactMoney(payment.amount)}</TableCell>
                  {/* Cash view: only the perks are paid with the payment; the plan's credits were paid with their top-up. */}
                  <TableCell className="text-right tabular-nums text-muted-foreground">{payment.perksCost > 0 ? `−${exactMoney(payment.perksCost)}` : "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      payment.amount - payment.perksCost >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
                    )}
                  >
                    {payment.amount - payment.perksCost >= 0 ? "+" : "−"}
                    {exactMoney(Math.abs(payment.amount - payment.perksCost))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-0.5">
                    {/* The proof it was added with (2026-10-28), as on the client's page. */}
                    <ProofAction
                      clientId={clientId}
                      paymentId={payment.id}
                      proofs={(payment.proofs ?? []).map((proof) => ({ id: proof.id, name: proof.filename, size: proof.sizeBytes }))}
                      dateLabel={`${clientName}, ${formatDate(payment.paidOn)}`}
                    />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <a
                            href={`/clients/${clientId}/receipts/${payment.id}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Download the receipt of ${clientName}, ${formatDate(payment.paidOn)}`}
                            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          />
                        }
                      >
                        <Download className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Download receipt</TooltipContent>
                    </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {visible.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">
            {entries.length === 0 ? `No payments ${account ? `to ${account.name} ` : "or top-ups "}${rangeNote(data)}.` : "Nothing matches your search."}
          </div>
        ) : null}
      </div>

      {/* The balance (bilan) of the period, under the list it sums up (2026-10-28) — the
          way a statement ends with its totals. From the backend: the search narrows the
          list, not these. Money out is shown in its two parts, so the lines add up. */}
      <section aria-label="Balance" className="mx-4 mb-3 flex shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold">Balance, {rangeNote(data)}</h2>
          <p className="mt-0.5 max-w-md text-[0.6rem] leading-relaxed text-muted-foreground">
            {account ? `Paid to ${account.name}` : "All accounts"}
            {brand ? `, ${brand.name} only` : ""}
            {flow === "revenue" ? ", revenue only" : flow === "expenses" ? ", expenses only" : ""}. Money out is the panel credit top-ups and the perks paid.
            {account || brand ? ` Top-ups belong to no ${account ? "account" : "brand"}, so none are counted here.` : ""}
          </p>
        </div>
        <dl className="grid w-full grid-cols-[1fr_auto] gap-x-8 gap-y-1 text-xs tabular-nums sm:w-80">
          <dt className="text-muted-foreground">
            Money in <span className="text-[0.65rem]">· {paymentsIn} {paymentsIn === 1 ? "payment" : "payments"}</span>
          </dt>
          <dd className="text-right font-medium">{exactMoney(moneyIn)}</dd>
          <dt className="text-muted-foreground">Panel credit top-ups</dt>
          <dd className="text-right">− {exactMoney(topupsOut)}</dd>
          <dt className="text-muted-foreground">Perks paid</dt>
          <dd className="text-right">− {exactMoney(perksOut)}</dd>
          {/* The double rule a total sits under on a balance sheet. */}
          <div aria-hidden className="col-span-full my-1 h-[3px] border-y border-foreground/30" />
          <dt className="text-sm font-semibold">Net</dt>
          <dd
            className={cn(
              "text-right text-sm font-semibold",
              net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {net >= 0 ? "" : "− "}
            {exactMoney(Math.abs(net))}
          </dd>
        </dl>
      </section>

      <footer className="flex min-h-12 shrink-0 items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
        <p className="whitespace-nowrap">Showing <span className="font-medium text-foreground">{rows.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, rows.length)}</span> of <span className="font-medium text-foreground">{rows.length}</span></p>
        <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-28 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>{pageSize} per page<ChevronDown className="size-3" /></DropdownMenuTrigger><DropdownMenuContent align="start" className="min-w-32"><DropdownMenuRadioGroup value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>{pageSizes.map((size) => <DropdownMenuRadioItem key={size} value={String(size)} className="text-xs">{size} per page</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
        <div className="ml-auto flex items-center gap-1">
          <PaginationButton label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="size-3" /></PaginationButton>
          <PaginationButton label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-3" /></PaginationButton>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-md border bg-background px-2 font-medium text-foreground">{currentPage}</span><span className="whitespace-nowrap px-1">of {pageCount}</span>
          <PaginationButton label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-3" /></PaginationButton>
          <PaginationButton label="Last page" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="size-3" /></PaginationButton>
        </div>
      </footer>
    </div>
  );
}

function PaginationButton({ children, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" className={cn(whiteStyle.button, "flex h-7 items-center justify-center gap-1 px-2! text-[0.65rem]! font-normal! text-muted-foreground disabled:pointer-events-none disabled:opacity-35")} aria-label={label} {...props}>{children}</button>;
}

/** One labelled control inside the filter popover. */
function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[0.65rem] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
