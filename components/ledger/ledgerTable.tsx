"use client";

import { useMemo, useState, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileDown, Search } from "lucide-react";
import { cn } from "cn";

import { RangeFilter } from "@/components/app-shell/rangeFilter";
import { BrandGlyph } from "@/components/clients/brandGlyph";
import { PaymentMethodLabel } from "@/components/clients/clientsTable";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
 * SEO and Dashboard filter) and by account; the Dashboard's card History opens it
 * on one account. Admins only.
 *
 * <p>A cash view (decided 2026-10-16): the panel-credit top-ups are money out on
 * the day they are paid, so they sit among the payments as outgoing lines, and
 * the strip adds up what came in and went out. A top-up belongs to no account:
 * filtered to one, there are none.
 */

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));
const pageSizes = [10, 20, 50, 100];

/** One line of the ledger: a payment received, or a top-up paid. */
type Entry =
  | { kind: "payment"; date: string; row: LedgerData["rows"][number] }
  | { kind: "topup"; date: string; topup: LedgerTopup };

const topupPlan = (topup: LedgerTopup) => `+${topup.credits.toLocaleString("en-US")} credits`;

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

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      (entry.kind === "payment"
        ? [entry.row.clientName, entry.row.payment.brandName ?? "", entry.row.payment.paymentMethodName ?? "", planDescription(entry.row.payment.months, entry.row.payment.devices)]
        : ["Panel credit top-up", topupPlan(entry.topup), entry.topup.note ?? "", entry.topup.createdByName ?? ""]
      ).some((value) => value.toLowerCase().includes(needle)),
    );
  }, [entries, query]);

  const paymentCount = rows.filter((entry) => entry.kind === "payment").length;
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
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 xl:flex-row xl:items-center">
        <RangeFilter
          value={data.range}
          start={data.start}
          end={data.end}
          onChange={(id) => chooseRange(id)}
          onCustom={(from, to) => chooseRange("custom", { from, to })}
        />
        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-40 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>
              {account ? <PaymentMethodLabel method={providerLabels[account.provider]} account={account.name} /> : "All accounts"}
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuRadioGroup
                value={account ? String(account.id) : "all"}
                onValueChange={(value) => navigate((next) => (value === "all" ? next.delete("method") : next.set("method", String(value))))}
              >
                <DropdownMenuRadioItem value="all" closeOnClick className="text-xs">All accounts</DropdownMenuRadioItem>
                {methods.map((method) => (
                  <DropdownMenuRadioItem key={method.id} value={String(method.id)} closeOnClick className="text-xs">
                    <PaymentMethodLabel method={providerLabels[method.provider]} account={method.name} />
                    {method.active ? null : <span className="text-muted-foreground">(off)</span>}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search client, plan, brand, note" aria-label="Search the ledger" className="bg-muted/30 pl-8 text-xs" />
          </div>
          <Button type="button" size="sm" onClick={exportCsv} disabled={rows.length === 0} className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}><FileDown className="size-3" />Export CSV</Button>
        </div>
      </div>

      {/* The period's cash, from the backend: the search narrows the list, not these. */}
      <dl className="mx-4 mb-3 grid shrink-0 grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
        <Total label="Money in" value={exactMoney(data.moneyIn)} />
        <Total label="Money out" value={`− ${exactMoney(data.moneyOut)}`} />
        <Total label="Net" value={exactMoney(data.net)} strong />
        <Total label="Payments" value={String(paymentCount)} />
        <p className="col-span-full text-[0.6rem] text-muted-foreground">
          {account ? `Paid to ${account.name}` : "All accounts"}, {rangeNote(data)}. Money out is the panel credit top-ups and the perks paid.
          {account ? " Top-ups belong to no account, so none are listed here." : ""}
        </p>
      </dl>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[980px] table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-44">Client</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead className="w-36">Paid to</TableHead>
              <TableHead className="w-28">Brand</TableHead>
              <TableHead className="w-24 text-right">Amount</TableHead>
              <TableHead className="w-24 text-right">Perks</TableHead>
              <TableHead className="w-24 text-right">Net</TableHead>
              <TableHead className="w-12 text-right" aria-label="Receipt" />
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

function Total({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6rem] text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 truncate tabular-nums", strong ? "text-base font-semibold" : "text-sm font-medium")}>{value}</dd>
    </div>
  );
}

function PaginationButton({ children, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" className={cn(whiteStyle.button, "flex h-7 items-center justify-center gap-1 px-2! text-[0.65rem]! font-normal! text-muted-foreground disabled:pointer-events-none disabled:opacity-35")} aria-label={label} {...props}>{children}</button>;
}
