"use client";

import { useMemo, useState, type ReactNode, type ComponentProps } from "react";
import Image from "next/image";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Clock3, Copy, Eye, FileDown, Mail,
  MessageCircle, MonitorSmartphone, Phone, Search,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ⚠️ Kept identical to the copy in `clientsTable` on purpose — this screen
// started as a duplicate of that one and the two sets have to agree, because a
// client shown here is the same client shown there.
type ClientStatus =
  | "New"
  | "Callback"
  | "Trial"
  | "Pending"
  | "Active"
  | "Drop"
  | "Inactive";
type SortField = "name" | "brand" | "subscriptionEnd" | "status" | "devices";

type Client = {
  id: number;
  name: string;
  initials: string;
  email?: string;
  phone: string;
  brand: string;
  brandLogo: string;
  subscriptionEnd: string;
  subscriptionEndAt: string;
  devices: number;
  duration: string;
  status: ClientStatus;
  color: string;
};

const clients: Client[] = [
  { id: 1, name: "Amine El Idrissi", initials: "AE", email: "amine@example.com", phone: "+212 6 12 34 56 78", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 29, 2026", subscriptionEndAt: "2026-09-29", devices: 3, duration: "12 months", status: "Active", color: "bg-emerald-100 text-emerald-800" },
  { id: 2, name: "Sarah Benali", initials: "SB", email: "sarah@example.com", phone: "+212 6 23 45 67 89", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 28, 2026", subscriptionEndAt: "2026-09-28", devices: 4, duration: "24 months", status: "Active", color: "bg-violet-100 text-violet-800" },
  { id: 3, name: "Youssef Alaoui", initials: "YA", phone: "+212 6 34 56 78 90", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 24, 2026", subscriptionEndAt: "2026-09-24", devices: 1, duration: "3 months", status: "Callback", color: "bg-amber-100 text-amber-800" },
  { id: 4, name: "Lina Zahra", initials: "LZ", email: "lina@example.com", phone: "+212 6 45 67 89 01", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 22, 2026", subscriptionEndAt: "2026-09-22", devices: 2, duration: "12 months", status: "Active", color: "bg-sky-100 text-sky-800" },
  { id: 5, name: "Omar Naciri", initials: "ON", phone: "+212 6 56 78 90 12", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 18, 2026", subscriptionEndAt: "2026-09-18", devices: 0, duration: "Expired", status: "Inactive", color: "bg-rose-100 text-rose-800" },
  { id: 6, name: "Meryem Idrissi", initials: "MI", email: "meryem@example.com", phone: "+212 6 67 89 01 23", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 15, 2026", subscriptionEndAt: "2026-09-15", devices: 4, duration: "6 months", status: "Pending", color: "bg-fuchsia-100 text-fuchsia-800" },
  { id: 7, name: "Adam Mansouri", initials: "AM", email: "adam@example.com", phone: "+212 6 78 90 12 34", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Aug 30, 2026", subscriptionEndAt: "2026-08-30", devices: 3, duration: "18 months", status: "Active", color: "bg-cyan-100 text-cyan-800" },
  { id: 8, name: "Salma Chraibi", initials: "SC", phone: "+212 6 89 01 23 45", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Aug 12, 2026", subscriptionEndAt: "2026-08-12", devices: 1, duration: "14 days", status: "Trial", color: "bg-orange-100 text-orange-800" },
  { id: 9, name: "Mehdi Tazi", initials: "MT", email: "mehdi@example.com", phone: "+212 6 90 12 34 56", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Jul 08, 2026", subscriptionEndAt: "2026-07-08", devices: 4, duration: "24 months", status: "Active", color: "bg-indigo-100 text-indigo-800" },
  { id: 10, name: "Nadia Bennani", initials: "NB", phone: "+212 6 01 23 45 67", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Jun 21, 2026", subscriptionEndAt: "2026-06-21", devices: 0, duration: "Expired", status: "Drop", color: "bg-pink-100 text-pink-800" },
  { id: 11, name: "Ayoub Filali", initials: "AF", email: "ayoub@example.com", phone: "+212 6 11 22 33 44", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "May 17, 2026", subscriptionEndAt: "2026-05-17", devices: 2, duration: "12 months", status: "Active", color: "bg-lime-100 text-lime-800" },
  { id: 12, name: "Imane Berrada", initials: "IB", phone: "+212 6 22 33 44 55", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Dec 10, 2025", subscriptionEndAt: "2025-12-10", devices: 1, duration: "6 months", status: "New", color: "bg-teal-100 text-teal-800" },
];

// The same pills as the clients table, for the same reason as the type above:
// one neutral shape drawn from the workspace's own tokens, so it follows every
// palette and both modes, with the colour carried by the dot alone.
const statusDots: Record<ClientStatus, string> = {
  New: "bg-cyan-500",
  Callback: "bg-amber-500",
  Trial: "bg-blue-500",
  Pending: "bg-orange-500",
  Active: "bg-emerald-500",
  Drop: "bg-rose-500",
  Inactive: "bg-muted-foreground/50",
};

const statusPillClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium text-foreground";

const pageSizes = [5, 10, 15, 20];
const today = new Date("2026-09-09T00:00:00");

// Days until the subscription ends, counted from today (the fixed date of the sample data); negative once it has ended.
function getDaysLeft(client: Client) {
  return Math.round((new Date(`${client.subscriptionEndAt}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

// Renewals follows the clients who need one: every Inactive client, and Active or Trial clients whose subscription
// ends in 7 days or less, including those already past their end date.
const RENEWAL_WINDOW_DAYS = 7;
const renewalClients = clients.filter(
  (client) => client.status === "Inactive" || ((client.status === "Active" || client.status === "Trial") && getDaysLeft(client) <= RENEWAL_WINDOW_DAYS),
);

// The row actions (View details, Open conversation): white button style, small and square.
const actionButtonClassName = cn(whiteStyle.button, "size-7 p-0! text-foreground");

// The Renewals table: started as a copy of the clients table, without the Orders, Payment method and Revenue columns.
export function RenewalsTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | ClientStatus>("All");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({ field: "subscriptionEnd", direction: "asc" });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return renewalClients
      .filter((client) => {
        const matchesQuery = !normalizedQuery || [client.name, client.brand, client.email ?? "", client.phone].some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesStatus = status === "All" || client.status === status;
        const subscriptionEndAt = new Date(`${client.subscriptionEndAt}T00:00:00`);
        const matchesTime = (!dateRange?.from || subscriptionEndAt >= dateRange.from) && (!dateRange?.to || subscriptionEndAt <= dateRange.to);
        return matchesQuery && matchesStatus && matchesTime;
      })
      .sort((a, b) => {
        const left = sort.field === "subscriptionEnd" ? a.subscriptionEndAt : a[sort.field];
        const right = sort.field === "subscriptionEnd" ? b.subscriptionEndAt : b[sort.field];
        const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [dateRange, query, sort, status]);

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleClients = filteredClients.slice(startIndex, startIndex + pageSize);
  const allVisibleSelected = visibleClients.length > 0 && visibleClients.every((client) => selected.has(client.id));

  function updateSort(field: SortField) {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      visibleClients.forEach((client) => {
        if (checked) next.add(client.id);
        else next.delete(client.id);
      });
      return next;
    });
  }

  function toggleClient(id: number, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function copyContact(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied((current) => current === value ? null : current), 1400);
  }

  function exportCsv() {
    const headings = ["Client", "Brand", "Phone", "Email", "End of subscription", "Days left", "Status", "Devices", "Duration"];
    const rows = filteredClients.map((client) => [client.name, client.brand, client.phone, client.email ?? "", getSubscriptionEndLabel(client), getDaysLeft(client), client.status, client.devices, client.duration]);
    const csv = [headings, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-base-renewals.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "All time";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by name, email, or phone" aria-label="Search clients" className="bg-muted/30 pl-8 text-xs" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-28 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>{status === "All" ? "All statuses" : status}<ChevronDown className="size-3" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuRadioGroup value={status} onValueChange={(value) => { setStatus(value as "All" | ClientStatus); setPage(1); }}>
                {(["All", "Active", "Trial", "Inactive"] as const).map((option) => <DropdownMenuRadioItem key={option} value={option} className="text-xs">{option}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "max-w-64 min-w-36 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}><CalendarDays className="size-3" /><span className="truncate">{dateRangeLabel}</span><ChevronDown className="size-3" /></PopoverTrigger>
            <PopoverContent align="end" className="w-max max-w-[calc(100vw-2rem)] p-0">
              <Calendar mode="range" selected={dateRange} onSelect={(range) => { setDateRange(range); setPage(1); }} defaultMonth={today} numberOfMonths={2} fixedWeeks />
              {dateRange ? <button type="button" onClick={() => { setDateRange(undefined); setPage(1); }} className="mx-3 mb-3 self-end text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Clear dates</button> : null}
            </PopoverContent>
          </Popover>
          <Button type="button" size="sm" onClick={exportCsv} className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}><FileDown className="size-3" />Export CSV</Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[800px] table-fixed border-separate border-spacing-0 text-xs">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-10"><Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleAllVisible(checked === true)} aria-label="Select all visible clients" className="size-3.5" /></TableHead>
              <TableHead className="w-48"><SortHeader field="name" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Client</SortHeader></TableHead>
              <TableHead className="w-20"><SortHeader field="brand" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Brand</SortHeader></TableHead>
              <TableHead className="w-56 2xl:w-[23rem]">Contact</TableHead>
              <TableHead className="w-44"><SortHeader field="subscriptionEnd" activeField={sort.field} direction={sort.direction} onSort={updateSort}>End of subscription</SortHeader></TableHead>
              <TableHead className="w-28"><SortHeader field="status" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Status</SortHeader></TableHead>
              <TableHead className="w-48"><SortHeader field="devices" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Subscription</SortHeader></TableHead>
              <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleClients.map((client) => (
              <TableRow key={client.id} data-state={selected.has(client.id) ? "selected" : undefined} className="group border-b border-border/80 last:border-0">
                <TableCell><Checkbox checked={selected.has(client.id)} onCheckedChange={(checked) => toggleClient(client.id, checked === true)} aria-label={`Select ${client.name}`} className="size-3.5" /></TableCell>
                <TableCell><div className="flex items-center gap-2.5"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", client.color)}>{client.initials}</span><div className="min-w-0"><p className="font-medium text-foreground">{client.name}</p><p className="mt-0.5 text-[0.6rem] text-muted-foreground">#{String(client.id).padStart(4, "0")}</p></div></div></TableCell>
                <TableCell><Tooltip><TooltipTrigger render={<span className="inline-flex size-7 items-center justify-center" />}><Image src={client.brandLogo} alt={client.brand} width={18} height={18} unoptimized className="max-h-[18px] max-w-[18px] object-contain" /></TooltipTrigger><TooltipContent>{client.brand}</TooltipContent></Tooltip></TableCell>
                <TableCell>
                  {/* Two small lines on most screens (narrow column, same row height); one line on very big screens (2xl). */}
                  <div className="flex min-w-0 flex-col text-[0.6rem] leading-4 2xl:flex-row 2xl:items-center 2xl:gap-2 2xl:text-xs">
                    <div className="flex shrink-0 items-center gap-1.5"><Phone className="size-2.5 shrink-0 text-muted-foreground 2xl:size-3" aria-hidden /><span className="tabular-nums">{client.phone}</span><CopyButton value={client.phone} copied={copied === client.phone} onCopy={copyContact} /></div>
                    <span aria-hidden className="hidden h-4 w-px shrink-0 bg-border 2xl:block" />
                    <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground"><Mail className="size-2.5 shrink-0 2xl:size-3" aria-hidden /><span className="truncate">{client.email ?? "-"}</span>{client.email ? <CopyButton value={client.email} copied={copied === client.email} onCopy={copyContact} /> : null}</div>
                  </div>
                </TableCell>
                <TableCell><EndOfSubscription client={client} /></TableCell>
                <TableCell><span className={statusPillClassName}><span className={cn("size-1.5 shrink-0 rounded-full", statusDots[client.status])} />{client.status}</span></TableCell>
                <TableCell><div className="grid grid-cols-[4.5rem_1px_minmax(0,1fr)] items-center gap-2"><div className="flex items-center gap-1.5"><MonitorSmartphone className="size-3 shrink-0 text-muted-foreground" aria-hidden /><span className="tabular-nums">{client.devices} {client.devices === 1 ? "device" : "devices"}</span></div><span className="h-4 w-px bg-border" aria-hidden /><div className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="size-3 shrink-0" aria-hidden /><span>{client.duration}</span></div></div></TableCell>
                <TableCell className="text-right">
                  {/* Only two actions, shown directly in the row instead of a menu. */}
                  <div className="flex items-center justify-end gap-1.5">
                    <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`View details of ${client.name}`} className={actionButtonClassName} />}><Eye className="size-3.5" /></TooltipTrigger><TooltipContent>View details</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Open conversation with ${client.name}`} className={actionButtonClassName} />}><MessageCircle className="size-3.5" /></TooltipTrigger><TooltipContent>Open conversation</TooltipContent></Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visibleClients.length === 0 ? <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">No clients match your filters.</div> : null}
      </div>

      <footer className="flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <p>Showing <span className="font-medium text-foreground">{filteredClients.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filteredClients.length)}</span> of <span className="font-medium text-foreground">{filteredClients.length}</span></p>
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

function getSubscriptionEndLabel(client: Client) {
  return client.subscriptionEnd;
}

// "in 3 days", "ends today", "ended 10 days ago".
function getDaysLeftLabel(daysLeft: number) {
  if (daysLeft === 0) return "ends today";
  if (daysLeft > 0) return `in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  return `ended ${-daysLeft} ${daysLeft === -1 ? "day" : "days"} ago`;
}

// The date, with the days left under it: red once ended, orange within the renewal window, gray further away.
function EndOfSubscription({ client }: { client: Client }) {
  const daysLeft = getDaysLeft(client);
  return (
    <div className="min-w-0">
      <p>{getSubscriptionEndLabel(client)}</p>
      <p className={cn("mt-0.5 text-[0.6rem] font-medium", daysLeft < 0 ? "text-destructive" : daysLeft <= RENEWAL_WINDOW_DAYS ? "text-amber-600" : "text-muted-foreground")}>
        {getDaysLeftLabel(daysLeft)}
      </p>
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
