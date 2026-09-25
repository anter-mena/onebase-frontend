"use client";

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, ChevronDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Mail, MoreVertical, Pencil,
  Search, Send, SlidersHorizontal, Trash2, UserPlus,
} from "lucide-react";
import { cn } from "cn";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { utcStamp } from "@/lib/format";
import {
  USER_COLUMNS_COOKIE,
  USER_COLUMNS_COOKIE_MAX_AGE,
  USER_FIXED_COLUMNS_WIDTH,
  serializeHiddenColumns,
  userColumns,
  type UserColumnId,
} from "@/lib/users/columns";
import { workspaceUsers, type UserRole, type WorkspaceUser } from "@/lib/users/sample";

/**
 * Who can sign in, and what they can reach.
 *
 * <p><b>The Clients table's shape</b> — same toolbar order, same segmented
 * filter, same sticky header, same column control, same footer. A reader who
 * has used Clients should not have to learn a second table.
 *
 * <p>⚠️ <b>The Owner cannot be switched off or deleted here.</b> A workspace
 * with no owner has nobody who can be billed, nobody who can restore it and
 * nobody who can hand it over — and the shortest route to one is a table that
 * lets the last owner deactivate themselves by accident. Those controls are
 * disabled on that row and say why.
 */

const roleFilters = ["All", "Owner", "Admin", "Manager"] as const;

/**
 * Shown beside the role so the reach is legible without opening anything.
 *
 * <p>⚠️ Keyed by `UserRole`, so a role added to the union without a line here
 * is a type error rather than an empty tooltip somebody finds later.
 */
const roleDescriptions: Record<UserRole, string> = {
  Owner: "Everything, including billing",
  Admin: "Everything except billing",
  Manager: "Clients and renewals",
};

type SortField = "name" | "role" | "lastActiveAt" | "addedAt";

const pageSizes = [10, 20, 50] as const;

/** "12 Jan 2026". UTC and a fixed locale, so server and browser agree. */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function UsersTable({
  /** Read from the cookie by the page, so the first HTML is already correct. */
  defaultHiddenColumns = [],
}: {
  defaultHiddenColumns?: readonly UserColumnId[];
}) {
  const [users, setUsers] = useState<WorkspaceUser[]>(workspaceUsers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof roleFilters)[number]>("All");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({
    field: "name",
    direction: "asc",
  });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [userToDelete, setUserToDelete] = useState<WorkspaceUser | null>(null);

  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<UserColumnId>>(
    () => new Set<UserColumnId>(defaultHiddenColumns),
  );

  const shows = (column: UserColumnId) => !hiddenColumns.has(column);

  const toggleColumn = (column: UserColumnId, visible: boolean) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (visible) next.delete(column);
      else next.add(column);

      document.cookie = `${USER_COLUMNS_COOKIE}=${serializeHiddenColumns(next)}; path=/; max-age=${USER_COLUMNS_COOKIE_MAX_AGE}; samesite=lax`;

      return next;
    });
  };

  // As wide as the columns claim to be. A floor below their sum would make
  // `table-fixed` shrink every one of them and the headings would overlap.
  const tableMinWidth =
    USER_FIXED_COLUMNS_WIDTH +
    userColumns.reduce(
      (total, column) => (shows(column.id) ? total + column.width : total),
      0,
    );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users
      .filter((user) => {
        const matchesQuery =
          !normalizedQuery ||
          [user.name, user.email].some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesRole = role === "All" || user.role === role;
        const addedAt = new Date(`${user.addedAt}T00:00:00Z`);
        const matchesTime =
          (!dateRange?.from || addedAt >= dateRange.from) &&
          (!dateRange?.to || addedAt <= new Date(dateRange.to.getTime() + 86_399_999));

        return matchesQuery && matchesRole && matchesTime;
      })
      .sort((a, b) => {
        const left = a[sort.field] ?? "";
        const right = b[sort.field] ?? "";
        const comparison = String(left).localeCompare(String(right));
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [dateRange, query, role, sort, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  const allVisibleSelected =
    visibleUsers.length > 0 && visibleUsers.every((user) => selected.has(user.id));

  function updateSort(field: SortField) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      visibleUsers.forEach((user) => {
        if (checked) next.add(user.id);
        else next.delete(user.id);
      });
      return next;
    });
  }

  function toggleUser(id: number, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setActive(id: number, active: boolean) {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, active } : user)));
  }

  function deleteUser() {
    if (!userToDelete) return;
    setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(userToDelete.id);
      return next;
    });
    setUserToDelete(null);
  }

  function exportCsv() {
    // ⚠️ Every column, including any hidden. Hiding is a view preference; the
    // export is the record.
    const headings = ["Name", "Email", "Role", "Status", "Last active (UTC)", "Added"];
    const rows = filteredUsers.map((user) => [
      user.name,
      user.email,
      user.role,
      user.invitePending ? "Invited" : user.active ? "Active" : "Inactive",
      user.lastActiveAt ?? "Never",
      user.addedAt,
    ]);
    const csv = [headings, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-base-users.csv";
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
        <RoleFilter
          value={role}
          onChange={(next) => {
            setRole(next);
            setPage(1);
          }}
        />

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email"
              aria-label="Search users"
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
                  throws without a group context, and an uncaught throw renders
                  the 500 screen. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[0.65rem]">Show columns</DropdownMenuLabel>
                {userColumns.map((column) => (
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

          <Button type="button" size="sm" variant="outline" onClick={exportCsv} className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
            <FileDown className="size-3" />
            Export CSV
          </Button>

          {/* The page's one primary action, and the only black button on it. */}
          <Button
            size="sm"
            render={<Link href="/users/invite" />}
            className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
          >
            <UserPlus className="size-3" />
            Invite user
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
              <TableHead className="w-8">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                  aria-label="Select all visible users"
                  className="size-3.5"
                />
              </TableHead>
              <TableHead className="w-56">
                <SortHeader field="name" activeField={sort.field} direction={sort.direction} onSort={updateSort}>User</SortHeader>
              </TableHead>
              {shows("role") ? (
                <TableHead className="w-28">
                  <SortHeader field="role" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Role</SortHeader>
                </TableHead>
              ) : null}
              {shows("status") ? <TableHead className="w-36">Status</TableHead> : null}
              {shows("lastActive") ? (
                <TableHead className="w-44">
                  <SortHeader field="lastActiveAt" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Last active</SortHeader>
                </TableHead>
              ) : null}
              {shows("added") ? (
                <TableHead className="w-32">
                  <SortHeader field="addedAt" activeField={sort.field} direction={sort.direction} onSort={updateSort}>Added</SortHeader>
                </TableHead>
              ) : null}
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleUsers.map((user) => {
              // ⚠️ Stated once and used by both the switch and the menu, so
              // the two can never disagree about who may be switched off.
              const isOwner = user.role === "Owner";

              return (
                <TableRow
                  key={user.id}
                  data-state={selected.has(user.id) ? "selected" : undefined}
                  className="group border-b border-border/80 last:border-0"
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(user.id)}
                      onCheckedChange={(checked) => toggleUser(user.id, checked === true)}
                      aria-label={`Select ${user.name}`}
                      className="size-3.5"
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", user.color)}>
                        {user.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.name}</p>
                        <p className="mt-0.5 truncate text-[0.6rem] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  {shows("role") ? (
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex" />}>
                          <Badge variant={isOwner ? "default" : "outline"}>{user.role}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>{roleDescriptions[user.role]}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  ) : null}

                  {shows("status") ? (
                    <TableCell>
                      {/* ⚠️ Invited is not a switch. Nothing has been turned
                          off — they simply have not arrived — and offering a
                          control that would deactivate an account nobody has
                          used yet answers a question no one asked. */}
                      {user.invitePending ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Badge variant="secondary" className="gap-1.5">
                            <Mail className="size-3" aria-hidden />
                            Invited
                          </Badge>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Switch
                            checked={user.active}
                            disabled={isOwner}
                            onCheckedChange={(checked) => setActive(user.id, checked)}
                            size="sm"
                            aria-label={`${user.active ? "Deactivate" : "Activate"} ${user.name}`}
                          />
                          <span className={cn("text-[0.65rem] font-medium", user.active ? "text-foreground" : "text-muted-foreground")}>
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </span>
                      )}
                    </TableCell>
                  ) : null}

                  {shows("lastActive") ? (
                    <TableCell className="tabular-nums text-muted-foreground">
                      {user.lastActiveAt ? utcStamp(user.lastActiveAt) : "Never"}
                    </TableCell>
                  ) : null}

                  {shows("added") ? (
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(`${user.addedAt}T00:00:00Z`))}
                    </TableCell>
                  ) : null}

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${user.name}`} />}>
                        <MoreVertical className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-auto min-w-36 whitespace-nowrap">
                        <DropdownMenuItem className="text-xs">
                          <Pencil className="size-3.5" /> Edit user
                        </DropdownMenuItem>
                        {user.invitePending ? (
                          <DropdownMenuItem className="text-xs">
                            <Send className="size-3.5" /> Resend invite
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        {/* Disabled on the Owner for the same reason the switch
                            is: a workspace has to keep one. */}
                        <DropdownMenuItem
                          variant="destructive"
                          className="text-xs"
                          disabled={isOwner}
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="size-3.5" /> Remove user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {visibleUsers.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">
            No users match your filters.
          </div>
        ) : null}
      </div>

      <footer className="flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <p>
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredUsers.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filteredUsers.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{filteredUsers.length}</span>
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

      <AlertDialog open={Boolean(userToDelete)} onOpenChange={(open) => { if (!open) setUserToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {userToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to this workspace immediately. Anything they did
              stays in the action log. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={deleteUser}>Remove user</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** The same segmented control the Clients status filter uses. */
function RoleFilter({
  value,
  onChange,
}: {
  value: (typeof roleFilters)[number];
  onChange: (value: (typeof roleFilters)[number]) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by role"
      className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {roleFilters.map((option) => (
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
