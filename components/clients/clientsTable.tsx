"use client";

import { useMemo, useState, type ReactNode, type ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Clock3, Copy, CreditCard, Eye, FileDown, Landmark, Mail,
  MessageCircle, MonitorSmartphone, MoreVertical, Pencil, Phone, Search, SlidersHorizontal, Trash2,
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
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  clients,
  preSubscriptionStatuses,
  type Client,
  type ClientStatus,
  type PaymentMethod,
} from "@/lib/clients/sample";
import {
  CLIENT_COLUMNS_COOKIE,
  CLIENT_COLUMNS_COOKIE_MAX_AGE,
  CLIENT_FIXED_COLUMNS_WIDTH,
  clientColumns,
  serializeHiddenColumns,
  type ClientColumnId,
} from "@/lib/clients/columns";

/**
 * Where a client is, in the order they usually get there.
 *
 * <p>The order is the funnel, and it is the order the filter draws them in —
 * a list sorted by what happens next reads faster than an alphabetical one.
 * "Inactive" and "Drop" are both endings and are deliberately separate: one
 * was a client and lapsed, the other never became one.
 *
 * <p>Drop sits last because it is the worst outcome on the list, and the only
 * one marked destructive. Inactive comes before it: a lapsed client is a
 * dormant relationship, not a lost one.
 */

const paymentMethodIcons = {
  Card: CreditCard,
  "Bank transfer": Landmark,
};
type SortField = "name" | "brand" | "subscriptionEnd" | "status" | "devices" | "orders" | "paymentMethod" | "revenue";

// The column list, their widths and the cookie all live in lib/clients/columns
// — a plain module, so the page can read the same cookie on the server.

/** One client's page. Stated once so the row, the name and the menu agree. */
const clientHref = (id: number) => `/clients/${id}`;

/**
 * Whether a click inside a row was aimed at something else.
 *
 * <p>⚠️ A row that navigates has to keep its hands off its own controls. The
 * checkbox, the copy buttons, the actions menu and the brand tooltip all live
 * inside it, and without this every one of them would also open the client —
 * ticking a box to select a row would navigate away from the list instead.
 */
function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("a, button, input, [role='menuitem'], [role='menuitemcheckbox']") !== null
  );
}

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
  Inactive: "bg-muted-foreground/50",
  // ⚠️ The destructive token rather than a rose from the palette. This is the
  // one status that means the relationship is over, and it should wear the
  // same red the Delete action does — a status that is merely a colour nobody
  // can name reads as decoration.
  Drop: "bg-destructive",
};

/** One shape for all of them. */
const statusPillClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium text-foreground";

/**
 * The one status that is not written in ordinary ink.
 *
 * <p>⚠️ Only Drop, and only because it is the outcome nobody wants. If a
 * second status ever takes a colour here the treatment stops meaning anything:
 * destructive is a warning, and a table of warnings is a table of none.
 *
 * <p>The word still says "Drop" — the colour is reinforcement, never the
 * message, which is the same rule the trend arrows follow.
 */
const statusTone: Partial<Record<ClientStatus, string>> = {
  Drop: "text-destructive",
};

const statusFilters = [
  "All",
  "New",
  "Callback",
  "Trial",
  "Pending",
  "Active",
  "Inactive",
  "Drop",
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
            // ⚠️ Drop wears the destructive token in both states, selected or
            // not, so the trigger matches the pills it filters to. Only the
            // ink changes — the chip keeps the same shape, border and
            // background as its neighbours, because a control that changes
            // shape when it is the dangerous one reads as a different kind of
            // control rather than the same one with a warning on it.
            option === "Drop" &&
              (value === option
                ? "text-destructive"
                : "text-destructive/70 hover:text-destructive"),
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Which statuses have no subscription to end yet lives in lib/clients/sample,
// so the detail page applies exactly the same rule.

const pageSizes = [5, 10, 15, 20];
const today = new Date("2026-09-09T00:00:00");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ClientsTable({
  /** Read from the cookie by the page, so the first HTML is already correct. */
  defaultHiddenColumns = [],
}: {
  defaultHiddenColumns?: readonly ClientColumnId[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | ClientStatus>("All");

  /**
   * Which columns are turned off.
   *
   * <p>Hidden rather than visible, so the default is "everything" without
   * having to list everything, and a column added later shows up on its own
   * instead of being invisible until someone remembers this set.
   *
   * <p>⚠️ Seeded from the server, which read the cookie — `defaultHiddenColumns`
   * is not a fallback. Reading the preference on the client instead would draw
   * all eleven columns and then drop three as React hydrated, in front of
   * whoever is looking.
   */
  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<ClientColumnId>>(
    () => new Set<ClientColumnId>(defaultHiddenColumns),
  );

  const shows = (column: ClientColumnId) => !hiddenColumns.has(column);

  const toggleColumn = (column: ClientColumnId, visible: boolean) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (visible) next.delete(column);
      else next.add(column);

      // Written here rather than in an effect, so the cookie moves with the
      // click that caused it and there is no render in between where the two
      // disagree.
      document.cookie = `${CLIENT_COLUMNS_COOKIE}=${serializeHiddenColumns(next)}; path=/; max-age=${CLIENT_COLUMNS_COOKIE_MAX_AGE}; samesite=lax`;

      return next;
    });
  };

  /**
   * The table is exactly as wide as its columns claim to be.
   *
   * <p>⚠️ This used to be a flat 1060px floor, which was <i>less</i> than the
   * 1264px the widths add up to — and `table-fixed` treats declared widths as
   * proportions once the table is narrower than their sum. So every column
   * rendered about 84% of its stated width, "Brand" came out too narrow for
   * the word "Brand", and with `nowrap` the heading overflowed into Contact.
   * A floor below the sum of the parts is not a floor; it is a squeeze.
   *
   * <p>Adding them up means a column always gets the width it asked for and
   * nothing can overlap. Below that the table scrolls sideways, which is the
   * trade already accepted here — eleven columns do not fit on a phone, and a
   * scrollbar is honest where overlapping text is not.
   *
   * <p>It also makes hiding a column do exactly what it looks like: the table
   * narrows by that column's width, rather than the survivors stretching to
   * fill a fixed minimum.
   */
  const tableMinWidth =
    CLIENT_FIXED_COLUMNS_WIDTH +
    clientColumns.reduce(
      (total, column) => (shows(column.id) ? total + column.width : total),
      0,
    );
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
          {/* ⚠️ The label sits inside a Group. Base UI's `Menu.GroupLabel`
              throws outright when it cannot find a group context — it is not a
              styling nicety — and an uncaught throw here renders the 500
              screen. Same trap the account menu hit. */}
          <DropdownMenu>
            {/* Icon only. ⚠️ `aria-label` is doing the work the dropped label
                used to do — an icon button with nothing else in it is a button
                with no name to anyone not looking at it. */}
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label="Choose columns" title="Choose columns" className={cn(whiteStyle.button, "size-7 shrink-0 justify-center px-0! py-0!")} />}>
              <SlidersHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[0.65rem]">Show columns</DropdownMenuLabel>
                {clientColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={shows(column.id)}
                    onCheckedChange={(checked) => toggleColumn(column.id, checked)}
                    // The menu stays put while several are toggled. Closing on
                    // each tick would mean reopening it for every column.
                    closeOnClick={false}
                    // Nothing to override any more: the box, its position and
                    // its background all live in DropdownMenuCheckboxItem.
                    className="text-xs"
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
            their label whatever was underneath. Letting them wrap fixed the
            width and cost a second line, so the labels were shortened instead —
            "End date" and "Payment" fit their columns on one line, which is
            both narrower than the originals and shorter than the wrapped
            version. `nowrap` is back to keep it that way: a header that wraps
            again is a label that has outgrown its column, and the label is
            what should give.

            ⚠️ The CSV export keeps the long names. A column heading is read
            beside its data and can be terse; a spreadsheet column opened three
            months later cannot.

            ⚠️ The floor is now the sum of the visible columns, not a number
            picked below it. Setting a minimum smaller than the widths add up to
            does not make the table fit — `table-fixed` just treats the widths
            as proportions and shrinks every column to match, which is how
            "Brand" ended up narrower than the word Brand. Adding them up is
            the only floor that guarantees a column gets what it asked for.
            Below that it scrolls sideways, which is the trade already made
            here: eleven columns do not fit on a phone, and a scrollbar is
            honest where overlapping text is not. */}
        {/* ⚠️ The last column's padding has to be set from here too, not on the
            cell. `[&_td]:px-1.5` compiles to `.table td`, specificity (0,1,1),
            which outranks a plain `pr-4` class on the cell at (0,1,0) — so the
            Actions column quietly lost its right padding and sat flush against
            the edge. `td:last-child` is (0,2,1) and wins back. */}
        <Table style={{ minWidth: `${tableMinWidth}px` }} className="table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap [&_td:last-child]:pr-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-8"><Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleAllVisible(checked === true)} aria-label="Select all visible clients" className="size-3.5" /></TableHead>
              <TableHead className="w-36"><SortHeader field="name" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Client</SortHeader></TableHead>
              {shows("brand") ? (
              <TableHead className="w-16"><SortHeader field="brand" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Brand</SortHeader></TableHead>
              ) : null}
              {shows("contact") ? (
              <TableHead className="w-[17rem]">Contact</TableHead>
              ) : null}
              {shows("subscriptionEnd") ? (
              <TableHead className="w-28"><SortHeader field="subscriptionEnd" activeField={sort.field} direction={sort.direction} onSort={updateSort}>End date</SortHeader></TableHead>
              ) : null}
              {shows("status") ? (
              <TableHead className="w-20"><SortHeader field="status" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Status</SortHeader></TableHead>
              ) : null}
              {/* ⚠️ w-48, not w-36. The cell below is a 4.5rem device track, a
                  1px rule, two 8px gaps, a 12px icon and the duration — about
                  180px for "24 months". At 144px in a `table-fixed` layout the
                  column cannot grow, so the duration simply drew on top of the
                  Orders column beside it. Widen the column or shorten the
                  content; there is no third option here. */}
              {shows("subscription") ? (
              <TableHead className="w-48"><SortHeader field="devices" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Subscription</SortHeader></TableHead>
              ) : null}
              {shows("orders") ? (
              <TableHead className="w-28"><SortHeader field="orders" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Orders</SortHeader></TableHead>
              ) : null}
              {shows("paymentMethod") ? (
              <TableHead className="w-28"><SortHeader field="paymentMethod" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Payment</SortHeader></TableHead>
              ) : null}
              {shows("revenue") ? (
              <TableHead className="w-24"><SortHeader field="revenue" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Revenue</SortHeader></TableHead>
              ) : null}
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ⚠️ The row navigates, but the name is what makes it reachable.
                A `<tr>` cannot be wrapped in an anchor, and a row with an
                onClick is invisible to the keyboard and to a screen reader —
                so the client's name is a real link and the row click is a
                mouse convenience layered on top, not the only way in.
                `isInteractive` keeps it off the row's own controls. */}
            {visibleClients.map((client) => (
              <TableRow
                key={client.id}
                data-state={selected.has(client.id) ? "selected" : undefined}
                onClick={(event) => {
                  if (isInteractive(event.target)) return;
                  router.push(clientHref(client.id));
                }}
                className="group cursor-pointer border-b border-border/80 last:border-0"
              >
                <TableCell><Checkbox checked={selected.has(client.id)} onCheckedChange={(checked) => toggleClient(client.id, checked === true)} aria-label={`Select ${client.name}`} className="size-3.5" /></TableCell>
                <TableCell><div className="flex items-center gap-2.5"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", client.color)}>{client.initials}</span><div className="min-w-0"><Link href={clientHref(client.id)} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{client.name}</Link><p className="mt-0.5 text-[0.6rem] text-muted-foreground">#{String(client.id).padStart(4, "0")}</p></div></div></TableCell>
                {shows("brand") ? (
                <TableCell><Tooltip><TooltipTrigger render={<span className="inline-flex size-7 items-center justify-center" />}><Image src={client.brandLogo} alt={client.brand} width={18} height={18} unoptimized className="max-h-[18px] max-w-[18px] object-contain" /></TooltipTrigger><TooltipContent>{client.brand}</TooltipContent></Tooltip></TableCell>
                ) : null}
                {shows("contact") ? (
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
                ) : null}
                {shows("subscriptionEnd") ? (
                <TableCell>{getSubscriptionEndLabel(client)}</TableCell>
                ) : null}
                {shows("status") ? (
                <TableCell><span className={cn(statusPillClassName, statusTone[client.status])}><span className={cn("size-1.5 shrink-0 rounded-full", statusDots[client.status])} />{client.status}</span></TableCell>
                ) : null}
                {shows("subscription") ? (
                <TableCell><div className="grid grid-cols-[4.5rem_1px_minmax(0,1fr)] items-center gap-2"><div className="flex items-center gap-1.5"><MonitorSmartphone className="size-3 shrink-0 text-muted-foreground" aria-hidden /><span className="tabular-nums">{client.devices} {client.devices === 1 ? "device" : "devices"}</span></div><span className="h-4 w-px bg-border" aria-hidden /><div className="flex min-w-0 items-center gap-1.5 text-muted-foreground"><Clock3 className="size-3 shrink-0" aria-hidden /><span className="truncate">{client.duration}</span></div></div></TableCell>
                ) : null}
                {shows("orders") ? (
                <TableCell><QuarterSparkline values={client.orderTrend} total={client.orders} unit={{ one: "order", many: "orders" }} /></TableCell>
                ) : null}
                {shows("paymentMethod") ? (
                <TableCell className="text-muted-foreground"><PaymentMethodLabel method={client.paymentMethod} /></TableCell>
                ) : null}
                {shows("revenue") ? (
                <TableCell className="font-medium text-emerald-700">+{currencyFormatter.format(client.revenue)}</TableCell>
                ) : null}
                <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${client.name}`} />}><MoreVertical className="size-3.5" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-auto min-w-36 whitespace-nowrap"><DropdownMenuItem className="text-xs" render={<Link href={clientHref(client.id)} />}><Eye className="size-3.5" /> View details</DropdownMenuItem><DropdownMenuItem className="text-xs"><Pencil className="size-3.5" /> Edit client</DropdownMenuItem><DropdownMenuItem className="text-xs"><MessageCircle className="size-3.5" /> Open conversation</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" className="text-xs" onClick={() => setClientToDelete(client)}><Trash2 className="size-3.5" /> Delete client</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
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

// Exported for the transactions table on the client page, so a payment method
// is drawn one way wherever it appears.
export function PaymentMethodLabel({ method }: { method: PaymentMethod }) {
  if (method === "Not set") return <span>-</span>;
  if (method === "PayPal") return <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-3 shrink-0 bg-current" style={{ mask: "url(/brands/paypal.svg) center / contain no-repeat", WebkitMask: "url(/brands/paypal.svg) center / contain no-repeat" }} /><span>{method}</span></span>;
  const Icon = paymentMethodIcons[method];
  return <span className="inline-flex items-center gap-1.5"><Icon className="size-3 shrink-0" aria-hidden /><span>{method}</span></span>;
}

// Generic over the field names so the transactions table can sort with it too.
export function SortHeader<Field extends string>({ field, activeField, direction, onSort, children }: { field: Field; activeField: Field; direction: "asc" | "desc"; onSort: (field: Field) => void; children: ReactNode }) {
  const SortIcon = activeField === field ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
  return <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">{children}<SortIcon className={cn("size-3", activeField === field ? "text-foreground" : "text-muted-foreground/60")} aria-hidden /></button>;
}

function CopyButton({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (value: string) => void }) {
  return <button type="button" onClick={() => onCopy(value)} className="ml-0.5 inline-flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Copy ${value}`}>{copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}</button>;
}

export function PaginationButton({ children, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" className={cn(whiteStyle.button, "flex h-7 items-center justify-center gap-1 px-2! text-[0.65rem]! font-normal! text-muted-foreground disabled:pointer-events-none disabled:opacity-35")} aria-label={label} {...props}>{children}</button>;
}
