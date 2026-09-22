"use client";

import { useMemo, useState, type ReactNode, type ComponentProps } from "react";
import Image from "next/image";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Clock3, Copy, CreditCard, Eye, FileDown, Landmark, Mail,
  MessageCircle, MonitorSmartphone, MoreVertical, Pencil, Phone, Search, Trash2,
} from "lucide-react";
import { cn } from "cn";

import { QuarterSparkline } from "@/components/charts/quarterSparkline";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Where a client is, in the order they usually get there.
 *
 * <p>The order is the funnel, and it is the order the filter draws them in —
 * a list sorted by what happens next reads faster than an alphabetical one.
 * "Drop" and "Inactive" are both endings and are deliberately separate: one
 * never became a client, the other was one and lapsed.
 */
type ClientStatus =
  | "New"
  | "Callback"
  | "Trial"
  | "Pending"
  | "Active"
  | "Drop"
  | "Inactive";

const paymentMethodIcons = {
  Card: CreditCard,
  "Bank transfer": Landmark,
};
type PaymentMethod = keyof typeof paymentMethodIcons | "PayPal" | "Not set";
type SortField = "name" | "brand" | "subscriptionEnd" | "status" | "devices" | "orders" | "paymentMethod" | "revenue";

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
  orders: number;
  orderTrend: number[];
  paymentMethod: PaymentMethod;
  revenue: number;
  status: ClientStatus;
  color: string;
};

const clients: Client[] = [
  { id: 1, name: "Amine El Idrissi", initials: "AE", email: "amine@example.com", phone: "+212 6 12 34 56 78", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 29, 2026", subscriptionEndAt: "2026-09-29", devices: 3, duration: "12 months", orders: 4, orderTrend: [0, 1, 1, 2], paymentMethod: "Card", revenue: 12400, status: "Active", color: "bg-emerald-100 text-emerald-800" },
  { id: 2, name: "Sarah Benali", initials: "SB", email: "sarah@example.com", phone: "+212 6 23 45 67 89", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 28, 2026", subscriptionEndAt: "2026-09-28", devices: 4, duration: "24 months", orders: 7, orderTrend: [1, 2, 1, 3], paymentMethod: "Bank transfer", revenue: 18950, status: "Active", color: "bg-violet-100 text-violet-800" },
  { id: 3, name: "Youssef Alaoui", initials: "YA", phone: "+212 6 34 56 78 90", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 24, 2026", subscriptionEndAt: "2026-09-24", devices: 1, duration: "3 months", orders: 2, orderTrend: [0, 1, 0, 1], paymentMethod: "PayPal", revenue: 4200, status: "Callback", color: "bg-amber-100 text-amber-800" },
  { id: 4, name: "Lina Zahra", initials: "LZ", email: "lina@example.com", phone: "+212 6 45 67 89 01", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 22, 2026", subscriptionEndAt: "2026-09-22", devices: 2, duration: "12 months", orders: 5, orderTrend: [1, 1, 1, 2], paymentMethod: "Card", revenue: 9600, status: "Active", color: "bg-sky-100 text-sky-800" },
  { id: 5, name: "Omar Naciri", initials: "ON", phone: "+212 6 56 78 90 12", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 18, 2026", subscriptionEndAt: "2026-09-18", devices: 0, duration: "Expired", orders: 1, orderTrend: [1, 0, 0, 0], paymentMethod: "Not set", revenue: 1350, status: "Inactive", color: "bg-rose-100 text-rose-800" },
  { id: 6, name: "Meryem Idrissi", initials: "MI", email: "meryem@example.com", phone: "+212 6 67 89 01 23", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 15, 2026", subscriptionEndAt: "2026-09-15", devices: 4, duration: "6 months", orders: 3, orderTrend: [0, 1, 1, 1], paymentMethod: "PayPal", revenue: 7850, status: "Pending", color: "bg-fuchsia-100 text-fuchsia-800" },
  { id: 7, name: "Adam Mansouri", initials: "AM", email: "adam@example.com", phone: "+212 6 78 90 12 34", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Aug 30, 2026", subscriptionEndAt: "2026-08-30", devices: 3, duration: "18 months", orders: 6, orderTrend: [1, 1, 2, 2], paymentMethod: "Bank transfer", revenue: 14200, status: "Active", color: "bg-cyan-100 text-cyan-800" },
  { id: 8, name: "Salma Chraibi", initials: "SC", phone: "+212 6 89 01 23 45", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Aug 12, 2026", subscriptionEndAt: "2026-08-12", devices: 1, duration: "14 days", orders: 0, orderTrend: [0, 0, 0, 0], paymentMethod: "Not set", revenue: 0, status: "Trial", color: "bg-orange-100 text-orange-800" },
  { id: 9, name: "Mehdi Tazi", initials: "MT", email: "mehdi@example.com", phone: "+212 6 90 12 34 56", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Jul 08, 2026", subscriptionEndAt: "2026-07-08", devices: 4, duration: "24 months", orders: 8, orderTrend: [1, 2, 2, 3], paymentMethod: "Card", revenue: 22100, status: "Active", color: "bg-indigo-100 text-indigo-800" },
  { id: 10, name: "Nadia Bennani", initials: "NB", phone: "+212 6 01 23 45 67", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Jun 21, 2026", subscriptionEndAt: "2026-06-21", devices: 0, duration: "Expired", orders: 2, orderTrend: [1, 1, 0, 0], paymentMethod: "Not set", revenue: 980, status: "Drop", color: "bg-pink-100 text-pink-800" },
  { id: 11, name: "Ayoub Filali", initials: "AF", email: "ayoub@example.com", phone: "+212 6 11 22 33 44", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "May 17, 2026", subscriptionEndAt: "2026-05-17", devices: 2, duration: "12 months", orders: 5, orderTrend: [1, 1, 1, 2], paymentMethod: "Bank transfer", revenue: 11300, status: "Active", color: "bg-lime-100 text-lime-800" },
  { id: 12, name: "Imane Berrada", initials: "IB", phone: "+212 6 22 33 44 55", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Dec 10, 2025", subscriptionEndAt: "2025-12-10", devices: 1, duration: "6 months", orders: 1, orderTrend: [0, 0, 0, 1], paymentMethod: "PayPal", revenue: 3200, status: "New", color: "bg-teal-100 text-teal-800" },
];

/**
 * The pill is the same neutral shape for every status; only the dot is coloured.
 *
 * <p><b>Which is what makes it work in both light and dark for free.</b> The
 * pill is drawn from `bg-muted` and `text-foreground` — the workspace's own
 * tokens — so it follows every palette and both modes with no `dark:` variant
 * anywhere. The version before this used fixed shades like `bg-violet-50`,
 * a near-white background that stayed near-white on a dark page.
 *
 * <p>It also settles a column that had seven filled hues in it, sitting beside
 * brand logos and a green revenue figure. One shape down the column, with a
 * dot to say which — the eye finds the odd one out faster in a list that is
 * otherwise uniform.
 *
 * <p>⚠️ Mid-tone (500) dots rather than the 50/700 pair, because they have to
 * read against a light `--muted` and a dark one. Callback and Pending are the
 * closest of the seven; they are also the two "waiting on something" states, so
 * confusing them costs the least.
 */
const statusDots: Record<ClientStatus, string> = {
  New: "bg-cyan-500",
  Callback: "bg-amber-500",
  Trial: "bg-blue-500",
  Pending: "bg-orange-500",
  Active: "bg-emerald-500",
  Drop: "bg-rose-500",
  Inactive: "bg-muted-foreground/50",
};

/** One shape for all of them. */
const statusPillClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium text-foreground";

const statusFilters = [
  "All",
  "New",
  "Callback",
  "Trial",
  "Pending",
  "Active",
  "Drop",
  "Inactive",
] as const;

/**
 * The status filter, as one control with the choices on show.
 *
 * <p>Same segmented look as the tabs in the Configuration header, the view
 * switch on Payment methods and the currency switch on Subscriptions — four
 * places now, and this is deliberately the fourth rather than a fourth
 * variation. Two of those live in a page header and two in a toolbar; what they
 * have in common is a short, fixed list where the current choice is worth
 * seeing without opening anything.
 *
 * <p>`overflow-x-auto` rather than wrapping: five labels do not fit on a narrow
 * phone, and a control that grows to two rows pushes the table down the screen
 * every time it is looked at.
 */
function StatusFilter({
  value,
  onChange,
}: {
  value: "All" | ClientStatus;
  onChange: (value: "All" | ClientStatus) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {statusFilters.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            "inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === option
              ? "border-border bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * The states that come before there is a subscription to end.
 *
 * <p>Their End of subscription cell shows "-" rather than a date: a client who
 * has not paid yet has no renewal date, and printing one would invent a
 * commitment nobody made. Drop and Inactive are not in the set — both may have
 * had a subscription that ran out, and that date is worth seeing.
 */
const preSubscriptionStatuses = new Set<ClientStatus>([
  "New",
  "Callback",
  "Trial",
  "Pending",
]);

const pageSizes = [5, 10, 15, 20];
const today = new Date("2026-09-09T00:00:00");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ClientsTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | ClientStatus>("All");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({ field: "subscriptionEnd", direction: "asc" });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return clients
      .filter((client) => {
        if (deletedIds.has(client.id)) return false;
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
  }, [dateRange, deletedIds, query, sort, status]);

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
    const headings = ["Client", "Brand", "Phone", "Email", "End of subscription", "Status", "Devices", "Duration", "Orders", "Payment method", "Revenue"];
    const rows = filteredClients.map((client) => [client.name, client.brand, client.phone, client.email ?? "", getSubscriptionEndLabel(client), client.status, client.devices, client.duration, client.orders, client.paymentMethod, client.revenue]);
    const csv = [headings, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-base-clients.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function deleteClient() {
    if (!clientToDelete) return;
    setDeletedIds((current) => new Set(current).add(clientToDelete.id));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(clientToDelete.id);
      return next;
    });
    setClientToDelete(null);
  }

  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "All time";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        {/* Status leads the row. It is the filter that is always on — there is
            no "unset" for it, only All — so it reads better as a set of choices
            with one of them lit than as a dropdown that has to be opened to
            find out what it currently says. */}
        <StatusFilter value={status} onChange={(next) => { setStatus(next); setPage(1); }} />

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by name, email, or phone" aria-label="Search clients" className="bg-muted/30 pl-8 text-xs" />
          </div>
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
        {/* ── Fitting eleven columns without a sideways scrollbar ─────────────
            Three things were spending width and none of them was the data.

            The cells carried `p-2` from the Table primitive — 16px of gutter
            per column, 176px across the row — so they are tightened to px-1.5
            here rather than everywhere, since the narrower tables elsewhere do
            not have the problem.

            The headers were `whitespace-nowrap`, which meant "End of
            subscription" and "Payment method" each reserved a column as wide as
            their label whatever was underneath. They wrap now; the header row
            is one line taller and two columns are ~60px narrower.

            And the floor came down from 1340px to 1000px. `table-fixed` treats
            these widths as proportions once the table is narrower than their
            sum, so between 1000px and the full width the columns scale down
            together instead of overflowing. Below 1000px it scrolls, because
            eleven columns genuinely do not fit on a phone. */}
        {/* ⚠️ The last column's padding has to be set from here too, not on the
            cell. `[&_td]:px-1.5` compiles to `.table td`, specificity (0,1,1),
            which outranks a plain `pr-4` class on the cell at (0,1,0) — so the
            Actions column quietly lost its right padding and sat flush against
            the edge. `td:last-child` is (0,2,1) and wins back. */}
        <Table className="min-w-[1000px] table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-normal [&_td:last-child]:pr-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-8"><Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleAllVisible(checked === true)} aria-label="Select all visible clients" className="size-3.5" /></TableHead>
              <TableHead className="w-36"><SortHeader field="name" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Client</SortHeader></TableHead>
              <TableHead className="w-12"><SortHeader field="brand" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Brand</SortHeader></TableHead>
              <TableHead className="w-[17rem]">Contact</TableHead>
              <TableHead className="w-28"><SortHeader field="subscriptionEnd" activeField={sort.field} direction={sort.direction} onSort={updateSort}>End of subscription</SortHeader></TableHead>
              <TableHead className="w-20"><SortHeader field="status" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Status</SortHeader></TableHead>
              <TableHead className="w-36"><SortHeader field="devices" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Subscription</SortHeader></TableHead>
              <TableHead className="w-28"><SortHeader field="orders" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Orders</SortHeader></TableHead>
              <TableHead className="w-28"><SortHeader field="paymentMethod" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Payment method</SortHeader></TableHead>
              <TableHead className="w-20"><SortHeader field="revenue" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Revenue</SortHeader></TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleClients.map((client) => (
              <TableRow key={client.id} data-state={selected.has(client.id) ? "selected" : undefined} className="group border-b border-border/80 last:border-0">
                <TableCell><Checkbox checked={selected.has(client.id)} onCheckedChange={(checked) => toggleClient(client.id, checked === true)} aria-label={`Select ${client.name}`} className="size-3.5" /></TableCell>
                <TableCell><div className="flex items-center gap-2.5"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", client.color)}>{client.initials}</span><div className="min-w-0"><p className="truncate font-medium text-foreground">{client.name}</p><p className="mt-0.5 text-[0.6rem] text-muted-foreground">#{String(client.id).padStart(4, "0")}</p></div></div></TableCell>
                <TableCell><Tooltip><TooltipTrigger render={<span className="inline-flex size-7 items-center justify-center" />}><Image src={client.brandLogo} alt={client.brand} width={18} height={18} unoptimized className="max-h-[18px] max-w-[18px] object-contain" /></TooltipTrigger><TooltipContent>{client.brand}</TooltipContent></Tooltip></TableCell>
                <TableCell>
                  {/* One row, at the table's own text size. The phone's track is
                      9.25rem rather than 10.75rem — just what the number, its
                      icon and the copy button need — so the email starts where
                      the phone ends instead of after a stretch of nothing. */}
                  <div className="grid grid-cols-[9.25rem_1px_minmax(0,1fr)] items-center gap-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Phone className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate tabular-nums">{client.phone}</span>
                      <CopyButton value={client.phone} copied={copied === client.phone} onCopy={copyContact} />
                    </div>
                    <span className="h-4 w-px bg-border" aria-hidden />
                    <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <Mail className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{client.email ?? "-"}</span>
                      {client.email ? <CopyButton value={client.email} copied={copied === client.email} onCopy={copyContact} /> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getSubscriptionEndLabel(client)}</TableCell>
                <TableCell><span className={statusPillClassName}><span className={cn("size-1.5 shrink-0 rounded-full", statusDots[client.status])} />{client.status}</span></TableCell>
                <TableCell><div className="grid grid-cols-[4.5rem_1px_minmax(0,1fr)] items-center gap-2"><div className="flex items-center gap-1.5"><MonitorSmartphone className="size-3 shrink-0 text-muted-foreground" aria-hidden /><span className="tabular-nums">{client.devices} {client.devices === 1 ? "device" : "devices"}</span></div><span className="h-4 w-px bg-border" aria-hidden /><div className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="size-3 shrink-0" aria-hidden /><span>{client.duration}</span></div></div></TableCell>
                <TableCell><QuarterSparkline values={client.orderTrend} total={client.orders} unit={{ one: "order", many: "orders" }} /></TableCell>
                <TableCell className="text-muted-foreground"><PaymentMethodLabel method={client.paymentMethod} /></TableCell>
                <TableCell className="font-medium text-emerald-700">+{currencyFormatter.format(client.revenue)}</TableCell>
                <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${client.name}`} />}><MoreVertical className="size-3.5" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="min-w-36"><DropdownMenuItem className="text-xs"><Eye className="size-3.5" /> View details</DropdownMenuItem><DropdownMenuItem className="text-xs"><Pencil className="size-3.5" /> Edit client</DropdownMenuItem><DropdownMenuItem className="text-xs"><MessageCircle className="size-3.5" /> Open conversation</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onClick={() => setClientToDelete(client)}><Trash2 className="size-3.5" /> Delete client</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
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

      <AlertDialog open={Boolean(clientToDelete)} onOpenChange={(open) => { if (!open) setClientToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {clientToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This client and their saved details will be removed. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={deleteClient}>Delete client</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getSubscriptionEndLabel(client: Client) {
  return preSubscriptionStatuses.has(client.status) ? "-" : client.subscriptionEnd;
}

function PaymentMethodLabel({ method }: { method: PaymentMethod }) {
  if (method === "Not set") return <span>-</span>;
  if (method === "PayPal") return <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-3 shrink-0 bg-current" style={{ mask: "url(/brands/paypal.svg) center / contain no-repeat", WebkitMask: "url(/brands/paypal.svg) center / contain no-repeat" }} /><span>{method}</span></span>;
  const Icon = paymentMethodIcons[method];
  return <span className="inline-flex items-center gap-1.5"><Icon className="size-3 shrink-0" aria-hidden /><span>{method}</span></span>;
}

function SortHeader({ field, activeField, direction, onSort, children }: { field: SortField; activeField: SortField; direction: "asc" | "desc"; onSort: (field: SortField) => void; children: ReactNode }) {
  const SortIcon = activeField === field ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
  return <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">{children}<SortIcon className={cn("size-3", activeField === field ? "text-foreground" : "text-muted-foreground/60")} aria-hidden /></button>;
}

function CopyButton({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (value: string) => void }) {
  return <button type="button" onClick={() => onCopy(value)} className="ml-0.5 inline-flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Copy ${value}`}>{copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}</button>;
}

function PaginationButton({ children, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" className={cn(whiteStyle.button, "flex h-7 items-center justify-center gap-1 px-2! text-[0.65rem]! font-normal! text-muted-foreground disabled:pointer-events-none disabled:opacity-35")} aria-label={label} {...props}>{children}</button>;
}
