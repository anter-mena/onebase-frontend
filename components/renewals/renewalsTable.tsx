"use client";

import { useMemo, useState, type ReactNode, type ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Clock3, Copy, Eye, FileDown, Mail,
  MessageCircle, MonitorSmartphone, Phone, Search,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Client, ClientStatus } from "@/lib/clients/sample";
import type { RenewalGroup } from "@/lib/clients/types";

/**
 * Renewals: the people to follow up (decided 2026-10-06), in four groups —
 *
 * <ul>
 *   <li><b>Ending soon</b> — Active, 10 days or less left on their plan;</li>
 *   <li><b>Callback</b> — their trial started more than a day ago (automatic);</li>
 *   <li><b>Pending</b> — they will pay, we are waiting;</li>
 *   <li><b>Inactive</b> — their plan ended; all of them, or only the last 30 days.</li>
 * </ul>
 *
 * <p>A client leaves the list by themselves: a payment makes them Active with a
 * new end date. The groups and the days left are worked out by the backend, in
 * the business time zone.
 */

export type RenewalRow = { client: Client; group: RenewalGroup; daysLeft: number | null };

const GROUPS: readonly { id: "ALL" | RenewalGroup; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "ENDING_SOON", label: "Ending soon" },
  { id: "CALLBACK", label: "Callback" },
  { id: "PENDING", label: "Pending" },
  { id: "INACTIVE", label: "Inactive" },
];

/** The same dots as the Clients table. */
const statusDots: Record<ClientStatus, string> = {
  New: "bg-cyan-500",
  Callback: "bg-amber-500",
  Trial: "bg-blue-500",
  Pending: "bg-orange-500",
  Active: "bg-emerald-500",
  Inactive: "bg-muted-foreground/50",
  Drop: "bg-destructive",
};

const statusPillClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium text-foreground";

type SortField = "when" | "name" | "status";
const pageSizes = [5, 10, 15, 20];
/** Inactive "last 30 days" means ended no more than this many days ago. */
const RECENT_DAYS = 30;

// The row actions (View details, Open conversation): white button style, small and square.
const actionButtonClassName = cn(whiteStyle.button, "size-7 p-0! text-foreground");

const sinceFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" });

/** Whole days between a moment and now, in the reader's day. */
function daysSince(iso: string): number {
  const then = new Date(iso);
  const now = new Date();
  const start = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((start(now) - start(then)) / 86_400_000);
}

// "in 3 days", "ends today", "ended 10 days ago".
function daysLeftLabel(daysLeft: number) {
  if (daysLeft === 0) return "ends today";
  if (daysLeft > 0) return `in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  return `ended ${-daysLeft} ${daysLeft === -1 ? "day" : "days"} ago`;
}

function agoLabel(days: number) {
  if (days <= 0) return "today";
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/** For sorting: soonest end first, then the longest waiting. */
function whenKey(row: RenewalRow): number {
  if (row.daysLeft !== null) return row.daysLeft;
  return row.client.statusChangedAt ? -daysSince(row.client.statusChangedAt) : 0;
}

export function RenewalsTable({ rows }: { rows: readonly RenewalRow[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"ALL" | RenewalGroup>("ALL");
  const [recentOnly, setRecentOnly] = useState(false);
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({ field: "when", direction: "asc" });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  // Inactive ones beyond 30 days are left out everywhere when "last 30 days" is on.
  const inScope = useMemo(
    () => rows.filter((row) => !(recentOnly && row.group === "INACTIVE" && (row.daysLeft === null || row.daysLeft < -RECENT_DAYS))),
    [recentOnly, rows],
  );
  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: inScope.length };
    for (const row of inScope) result[row.group] = (result[row.group] ?? 0) + 1;
    return result;
  }, [inScope]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inScope
      .filter((row) => group === "ALL" || row.group === group)
      .filter((row) => !needle || [row.client.name, row.client.username ?? "", row.client.brand, row.client.email ?? "", row.client.phone]
        .some((value) => value.toLowerCase().includes(needle)))
      .toSorted((a, b) => {
        const comparison = sort.field === "when" ? whenKey(a) - whenKey(b)
          : sort.field === "name" ? a.client.name.localeCompare(b.client.name)
          : a.client.status.localeCompare(b.client.status);
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [group, inScope, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visible = filtered.slice(startIndex, startIndex + pageSize);

  function updateSort(field: SortField) {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  }

  async function copyContact(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied((current) => current === value ? null : current), 1400);
  }

  function exportCsv() {
    const headings = ["Client", "Group", "Status", "Brand", "Phone", "Email", "End of subscription", "Days left", "Status since", "Devices", "Duration"];
    const lines = filtered.map((row) => [
      row.client.name, GROUPS.find((entry) => entry.id === row.group)?.label ?? row.group, row.client.status, row.client.brand,
      row.client.phone, row.client.email ?? "", row.client.subscriptionEnd, row.daysLeft ?? "",
      row.client.statusChangedAt ? row.client.statusChangedAt.slice(0, 10) : "", row.client.devices || "", row.client.duration,
    ]);
    const csv = [headings, ...lines].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-base-renewals.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center">
        {/* The groups lead the row, with how many are in each: the first thing
            to know is how many people are waiting for a call. */}
        <div role="group" aria-label="Filter by group" className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5">
          {GROUPS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { setGroup(option.id); setPage(1); }}
              aria-pressed={group === option.id}
              className={cn(
                "inline-flex h-6 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                group === option.id ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              <span className="rounded-full bg-foreground/10 px-1.5 text-[0.6rem] tabular-nums">{counts[option.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {/* Inactive: all of them by default, or only those who ended in the last 30 days. */}
          {group === "ALL" || group === "INACTIVE" ? (
            <button
              type="button"
              aria-pressed={recentOnly}
              onClick={() => { setRecentOnly((current) => !current); setPage(1); }}
              className={cn(whiteStyle.button, "flex h-7 items-center gap-1.5 px-3! text-[0.65rem]! font-normal!", recentOnly ? "text-foreground" : "text-muted-foreground")}
            >
              <span className={cn("flex size-3 items-center justify-center rounded-[3px] border", recentOnly ? "border-foreground bg-foreground text-background" : "border-foreground/30")}>
                {recentOnly ? <Check className="size-2.5" /> : null}
              </span>
              Inactive: last 30 days only
            </button>
          ) : null}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by name, email, or phone" aria-label="Search clients" className="bg-muted/30 pl-8 text-xs" />
          </div>
          <Button type="button" size="sm" onClick={exportCsv} className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}><FileDown className="size-3" />Export CSV</Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[860px] table-fixed border-separate border-spacing-0 text-xs">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-48"><SortHeader field="name" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Client</SortHeader></TableHead>
              <TableHead className="w-16">Brand</TableHead>
              <TableHead className="w-56 2xl:w-[23rem]">Contact</TableHead>
              <TableHead className="w-44"><SortHeader field="when" activeField={sort.field} direction={sort.direction} onSort={updateSort}>When</SortHeader></TableHead>
              <TableHead className="w-28"><SortHeader field="status" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Status</SortHeader></TableHead>
              <TableHead className="w-48">Subscription</TableHead>
              <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const { client } = row;
              return (
                <TableRow key={client.id} className="group border-b border-border/80 last:border-0">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", client.color)}>{client.initials}</span>
                      <div className="min-w-0">
                        <Link href={`/clients/${client.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{client.name}</Link>
                        <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground">
                          {client.username && client.fullName ? <>@{client.username} · </> : null}#{String(client.id).padStart(4, "0")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex size-7 items-center justify-center" />}>
                        {client.brandLogo ? <Image src={client.brandLogo} alt={client.brand} width={18} height={18} unoptimized className="max-h-[18px] max-w-[18px] object-contain" /> : client.brandId ? <span className="text-[0.6rem] font-semibold">{client.brand.slice(0, 2).toUpperCase()}</span> : <span className="text-muted-foreground">-</span>}
                      </TooltipTrigger>
                      <TooltipContent>{client.brand}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {/* Two small lines on most screens (narrow column, same row height); one line on very big screens (2xl). */}
                    <div className="flex min-w-0 flex-col text-[0.6rem] leading-4 2xl:flex-row 2xl:items-center 2xl:gap-2 2xl:text-xs">
                      <div className="flex shrink-0 items-center gap-1.5"><Phone className="size-2.5 shrink-0 text-muted-foreground 2xl:size-3" aria-hidden /><span className="tabular-nums">{client.phone || "-"}</span>{client.phone ? <CopyButton value={client.phone} copied={copied === client.phone} onCopy={copyContact} /> : null}</div>
                      <span aria-hidden className="hidden h-4 w-px shrink-0 bg-border 2xl:block" />
                      <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground"><Mail className="size-2.5 shrink-0 2xl:size-3" aria-hidden /><span className="truncate">{client.email ?? "-"}</span>{client.email ? <CopyButton value={client.email} copied={copied === client.email} onCopy={copyContact} /> : null}</div>
                    </div>
                  </TableCell>
                  <TableCell><When row={row} /></TableCell>
                  <TableCell><span className={cn(statusPillClassName, client.status === "Drop" && "text-destructive")}><span className={cn("size-1.5 shrink-0 rounded-full", statusDots[client.status])} />{client.status}</span></TableCell>
                  <TableCell>
                    {client.devices ? (
                      <div className="grid grid-cols-[4.5rem_1px_minmax(0,1fr)] items-center gap-2"><div className="flex items-center gap-1.5"><MonitorSmartphone className="size-3 shrink-0 text-muted-foreground" aria-hidden /><span className="tabular-nums">{client.devices} {client.devices === 1 ? "device" : "devices"}</span></div><span className="h-4 w-px bg-border" aria-hidden /><div className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="size-3 shrink-0" aria-hidden /><span>{client.duration}</span></div></div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Tooltip><TooltipTrigger render={<Link href={`/clients/${client.id}`} aria-label={`View details of ${client.name}`} className={cn(actionButtonClassName, "inline-flex items-center justify-center")} />}><Eye className="size-3.5" /></TooltipTrigger><TooltipContent>View details</TooltipContent></Tooltip>
                      {client.conversationId ? (
                        <Tooltip><TooltipTrigger render={<Link href={`/whatsapp-inbox?c=${client.conversationId}`} aria-label={`Open conversation with ${client.name}`} className={cn(actionButtonClassName, "inline-flex items-center justify-center")} />}><MessageCircle className="size-3.5" /></TooltipTrigger><TooltipContent>Open conversation</TooltipContent></Tooltip>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {visible.length === 0 ? <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">{rows.length === 0 ? "Nobody to follow up right now." : "No clients match your filters."}</div> : null}
      </div>

      <footer className="flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <p>Showing <span className="font-medium text-foreground">{filtered.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span></p>
          <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-28 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>{pageSize} per page<ChevronDown className="size-3" /></DropdownMenuTrigger><DropdownMenuContent align="start" className="min-w-32"><DropdownMenuRadioGroup value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>{pageSizes.map((size) => <DropdownMenuRadioItem key={size} value={String(size)} className="text-xs">{size} per page</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
        </div>
        <div className="flex items-center gap-1 sm:ml-auto">
          <PaginationButton label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="size-3" /></PaginationButton>
          <PaginationButton label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-3" /><span>Previous</span></PaginationButton>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-md border bg-background px-2 font-medium text-foreground">{currentPage}</span><span className="px-1">of {pageCount}</span>
          <PaginationButton label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><span>Next</span><ChevronRight className="size-3" /></PaginationButton>
          <PaginationButton label="Last page" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="size-3" /></PaginationButton>
        </div>
      </footer>
    </div>
  );
}

/**
 * What the row is waiting on: the plan's end and the days left (amber when it is
 * close, red once it has ended), or how long they have been Callback or Pending.
 */
function When({ row }: { row: RenewalRow }) {
  const { client, daysLeft } = row;
  if (row.group === "CALLBACK" || row.group === "PENDING") {
    const since = client.statusChangedAt;
    return (
      <div className="min-w-0">
        <p suppressHydrationWarning>{since ? `Since ${sinceFormatter.format(new Date(since))}` : "-"}</p>
        <p className="mt-0.5 text-[0.6rem] font-medium text-amber-600" suppressHydrationWarning>
          {row.group === "CALLBACK" ? "trial over" : "waiting"}{since ? ` · ${agoLabel(daysSince(since))}` : ""}
        </p>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p>{client.subscriptionEnd || "-"}</p>
      {daysLeft !== null ? (
        <p className={cn("mt-0.5 text-[0.6rem] font-medium", daysLeft < 0 ? "text-destructive" : "text-amber-600")}>{daysLeftLabel(daysLeft)}</p>
      ) : null}
    </div>
  );
}

function SortHeader({ field, activeField, direction, onSort, children }: { field: SortField; activeField: SortField; direction: "asc" | "desc"; onSort: (field: SortField) => void; children: ReactNode }) {
  const SortIcon = activeField === field ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
  return <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">{children}<SortIcon className={cn("size-3", activeField === field ? "text-foreground" : "text-muted-foreground/60")} aria-hidden /></button>;
}

function CopyButton({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (value: string) => void }) {
  return <button type="button" onClick={() => onCopy(value)} className="inline-flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Copy ${value}`}>{copied ? <Check className="size-2.5 text-emerald-600" /> : <Copy className="size-2.5" />}</button>;
}

function PaginationButton({ children, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" className={cn(whiteStyle.button, "flex h-7 items-center justify-center gap-1 px-2! text-[0.65rem]! font-normal! text-muted-foreground disabled:pointer-events-none disabled:opacity-35")} aria-label={label} {...props}>{children}</button>;
}
