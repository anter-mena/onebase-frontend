"use client";

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, ChevronDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Search, SlidersHorizontal,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { utcStamp } from "@/lib/format";
import {
  ACTION_LOG_COLUMNS_COOKIE,
  ACTION_LOG_COLUMNS_COOKIE_MAX_AGE,
  ACTION_LOG_FIXED_COLUMNS_WIDTH,
  actionLogColumns,
  serializeHiddenColumns,
  type ActionLogColumnId,
} from "@/lib/action-log/columns";
import { logEntries, type ActionKind, type LogEntry } from "@/lib/action-log/sample";

/**
 * Every change made in the workspace, newest first.
 *
 * <p><b>The Clients table's shape, deliberately.</b> Same toolbar order, same
 * segmented filter, same sticky header, same column control, same footer — a
 * reader who has used one screen should not have to learn a second. What is
 * different is only what the data is.
 *
 * <p>⚠️ <b>No selection column and no row actions, and that is the point.</b>
 * The Clients table has both because a client is a record you act on. A log
 * entry is a record of an act: there is nothing to edit, nothing to delete and
 * nothing to bulk-apply. Copying those controls across would have put a tick
 * box and a "⋯" on every row that could only ever do nothing — and an audit
 * trail with a delete button is not an audit trail.
 */

/** The dot beside each action. Deleted is the only one that reads as a loss. */
const actionDots: Record<ActionKind, string> = {
  Created: "bg-cyan-500",
  Updated: "bg-blue-500",
  Activated: "bg-emerald-500",
  Deactivated: "bg-muted-foreground/50",
  Exported: "bg-amber-500",
  "Signed in": "bg-violet-500",
  Deleted: "bg-destructive",
};

/** One shape for all of them, exactly as the status pills do. */
const actionPillClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium text-foreground";

/**
 * The one action that is not written in ordinary ink.
 *
 * <p>⚠️ Only Deleted. If a second action ever takes a colour here the treatment
 * stops meaning anything — the word still says what happened, and the colour is
 * reinforcement rather than the message.
 */
const actionTone: Partial<Record<ActionKind, string>> = {
  Deleted: "text-destructive",
};

const actionFilters = [
  "All",
  "Created",
  "Updated",
  "Activated",
  "Deactivated",
  "Deleted",
  "Exported",
  "Signed in",
] as const;

type SortField = "at" | "actor" | "action" | "targetName" | "source";

const pageSizes = [10, 20, 50] as const;

export function ActionLogTable({
  /** Read from the cookie by the page, so the first HTML is already correct. */
  defaultHiddenColumns = [],
}: {
  defaultHiddenColumns?: readonly ActionLogColumnId[];
}) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<(typeof actionFilters)[number]>("All");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  // ⚠️ Newest first, and there is no other sensible default for a log. Anything
  // else opens on the day the workspace was set up.
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({
    field: "at",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<ActionLogColumnId>>(
    () => new Set<ActionLogColumnId>(defaultHiddenColumns),
  );

  const shows = (column: ActionLogColumnId) => !hiddenColumns.has(column);

  const toggleColumn = (column: ActionLogColumnId, visible: boolean) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (visible) next.delete(column);
      else next.add(column);

      document.cookie = `${ACTION_LOG_COLUMNS_COOKIE}=${serializeHiddenColumns(next)}; path=/; max-age=${ACTION_LOG_COLUMNS_COOKIE_MAX_AGE}; samesite=lax`;

      return next;
    });
  };

  // The table is exactly as wide as its columns claim to be — a floor below
  // their sum would make `table-fixed` shrink every one of them.
  const tableMinWidth =
    ACTION_LOG_FIXED_COLUMNS_WIDTH +
    actionLogColumns.reduce(
      (total, column) => (shows(column.id) ? total + column.width : total),
      0,
    );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logEntries
      .filter((entry) => {
        const matchesQuery =
          !normalizedQuery ||
          [entry.actor, entry.targetName, entry.detail, entry.ip].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        const matchesAction = action === "All" || entry.action === action;
        const at = new Date(entry.at);
        const matchesTime =
          (!dateRange?.from || at >= dateRange.from) &&
          // ⚠️ To the end of the chosen day, not its midnight. A range picked
          // as "14th to 16th" that silently excluded everything after 00:00 on
          // the 16th would drop a whole day without saying so.
          (!dateRange?.to || at <= new Date(dateRange.to.getTime() + 86_399_999));

        return matchesQuery && matchesAction && matchesTime;
      })
      .sort((a, b) => {
        const left = a[sort.field];
        const right = b[sort.field];
        const comparison = String(left).localeCompare(String(right));
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [action, dateRange, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleEntries = filteredEntries.slice(startIndex, startIndex + pageSize);

  function updateSort(field: SortField) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  function exportCsv() {
    // ⚠️ Every column, including any the reader has hidden. Hiding is a view
    // preference; the export is the record.
    const headings = ["When (UTC)", "Who", "Action", "Target", "Details", "Source", "IP address"];
    const rows = filteredEntries.map((entry) => [
      entry.at,
      entry.actor,
      entry.action,
      `${entry.targetKind} · ${entry.targetName}`,
      entry.detail,
      entry.source,
      entry.ip,
    ]);
    const csv = [headings, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-base-action-log.csv";
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
        <ActionFilter
          value={action}
          onChange={(next) => {
            setAction(next);
            setPage(1);
          }}
        />

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by person, target, or IP"
              aria-label="Search the action log"
              className="bg-muted/30 pl-8 text-xs"
            />
          </div>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "max-w-64 min-w-36 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>
              <CalendarDays className="size-3" />
              <span className="truncate">{dateRangeLabel}</span>
              <ChevronDown className="size-3" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-max max-w-[calc(100vw-2rem)] p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
                defaultMonth={new Date("2026-09-01T00:00:00Z")}
                numberOfMonths={2}
                fixedWeeks
              />
              {dateRange ? (
                <button
                  type="button"
                  onClick={() => {
                    setDateRange(undefined);
                    setPage(1);
                  }}
                  className="mx-3 mb-3 self-end text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Clear dates
                </button>
              ) : null}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label="Choose columns" title="Choose columns" className={cn(whiteStyle.button, "size-7 shrink-0 justify-center px-0! py-0!")} />}>
              <SlidersHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-40 whitespace-nowrap">
              {/* ⚠️ The label sits inside a Group: Base UI's `Menu.GroupLabel`
                  throws without a group context, and an uncaught throw here
                  renders the 500 screen. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[0.65rem]">Show columns</DropdownMenuLabel>
                {actionLogColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={shows(column.id)}
                    onCheckedChange={(checked) => toggleColumn(column.id, checked)}
                    closeOnClick={false}
                    className="text-xs"
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" size="sm" onClick={exportCsv} className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
            <FileDown className="size-3" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <Table
          style={{ minWidth: `${tableMinWidth}px` }}
          className="table-fixed border-separate border-spacing-0 text-xs [&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap [&_td:last-child]:pr-4 [&_th:last-child]:pr-4"
        >
          <TableHeader className="[&_tr]:border-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-sm [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-40">
                <SortHeader field="at" activeField={sort.field} direction={sort.direction} onSort={updateSort}>When</SortHeader>
              </TableHead>
              <TableHead className="w-44">
                <SortHeader field="actor" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Who</SortHeader>
              </TableHead>
              {shows("action") ? (
                <TableHead className="w-32">
                  <SortHeader field="action" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Action</SortHeader>
                </TableHead>
              ) : null}
              {shows("target") ? (
                <TableHead className="w-56">
                  <SortHeader field="targetName" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Target</SortHeader>
                </TableHead>
              ) : null}
              {shows("detail") ? <TableHead className="w-[20rem]">Details</TableHead> : null}
              {shows("source") ? (
                <TableHead className="w-24">
                  <SortHeader field="source" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Source</SortHeader>
                </TableHead>
              ) : null}
              {shows("ip") ? <TableHead className="w-32">IP address</TableHead> : null}
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleEntries.map((entry) => (
              <TableRow key={entry.id} className="group border-b border-border/80 last:border-0">
                {/* ⚠️ UTC, and the heading says so in the export. `utcStamp`
                    is fixed to one zone and one locale because this renders on
                    the server as well as the browser, and a timestamp that
                    formats two ways is a hydration mismatch. */}
                <TableCell className="tabular-nums text-muted-foreground">{utcStamp(entry.at)}</TableCell>

                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", entry.color)}>
                      {entry.initials}
                    </span>
                    <span className="min-w-0 truncate font-medium text-foreground">{entry.actor}</span>
                  </span>
                </TableCell>

                {shows("action") ? (
                  <TableCell>
                    <span className={cn(actionPillClassName, actionTone[entry.action])}>
                      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", actionDots[entry.action])} />
                      {entry.action}
                    </span>
                  </TableCell>
                ) : null}

                {shows("target") ? (
                  <TableCell>
                    {/* The kind above the name: "Client" and "Brand" can both
                        be called Nike, and the row has to say which. */}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-foreground">{entry.targetName}</span>
                      <span className="mt-0.5 text-[0.6rem] text-muted-foreground">{entry.targetKind}</span>
                    </span>
                  </TableCell>
                ) : null}

                {shows("detail") ? (
                  <TableCell className="text-muted-foreground">
                    <span className="block truncate" title={entry.detail}>{entry.detail}</span>
                  </TableCell>
                ) : null}

                {shows("source") ? <TableCell className="text-muted-foreground">{entry.source}</TableCell> : null}

                {shows("ip") ? <TableCell className="tabular-nums text-muted-foreground">{entry.ip}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {visibleEntries.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">
            Nothing in the log matches your filters.
          </div>
        ) : null}
      </div>

      <footer className="flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <p>
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredEntries.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filteredEntries.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{filteredEntries.length}</span>
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className={cn(whiteStyle.button, "min-w-28 justify-between px-3! py-0! text-[0.65rem]! font-normal!")} />}>
              {pageSize} per page
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-32">
              <DropdownMenuRadioGroup
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                {pageSizes.map((size) => (
                  <DropdownMenuRadioItem key={size} value={String(size)} className="text-xs">
                    {size} per page
                  </DropdownMenuRadioItem>
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

/**
 * Which kind of action is on screen.
 *
 * <p>The same segmented control the Clients status filter uses, for the same
 * reason: a short fixed list where the current choice is worth seeing without
 * opening anything.
 */
function ActionFilter({
  value,
  onChange,
}: {
  value: (typeof actionFilters)[number];
  onChange: (value: (typeof actionFilters)[number]) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by action"
      className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {actionFilters.map((option) => (
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
            // Deleted wears the destructive token in both states, matching the
            // pill it filters to. Only the ink changes; the chip keeps its
            // shape, so it reads as the same control carrying a warning.
            option === "Deleted" &&
              (value === option ? "text-destructive" : "text-destructive/70 hover:text-destructive"),
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SortHeader({
  field,
  activeField,
  direction,
  onSort,
  children,
}: {
  field: SortField;
  activeField: SortField;
  direction: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: ReactNode;
}) {
  const SortIcon = activeField === field ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
      {children}
      <SortIcon className={cn("size-3", activeField === field ? "text-foreground" : "text-muted-foreground/60")} aria-hidden />
    </button>
  );
}

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

export type { LogEntry };
