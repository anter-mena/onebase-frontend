import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { cn } from "cn";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { seoRanges, type SeoRangeId } from "@/lib/seo/types";

/**
 * The pieces every `loading.tsx` is built from.
 *
 * <p><b>The rule they all follow:</b> a loading screen is the page itself with
 * the data greyed out — the same header, words and frame, the same toolbar
 * controls at the same widths, the same column headings. When the data arrives
 * only the grey shapes are replaced; nothing moves. A spinner in the middle of
 * an empty box would say "something is coming"; this says what.
 *
 * <p>Server components only, no state: a loading screen is shown before
 * anything else is ready, so it must cost nothing to draw.
 */

/** The two lines every page opens with — real text, since it never depends on data. */
export function PageHeader({
  eyebrow,
  back,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  /** "← Clients": the way back on detail and form pages, instead of an eyebrow. */
  back?: { href: string; label: string };
  /** A string, or a Skeleton when the title is the record's own name. */
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={cn("shrink-0", actions && "flex flex-col gap-3 sm:flex-row sm:items-end")}>
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            {back.label}
          </Link>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto" aria-hidden>{actions}</div> : null}
    </header>
  );
}

/**
 * A whole page while it loads: its header, then the bordered section its content
 * lives in. `role="status"` so a screen reader hears "Loading" once, not the shapes.
 */
export function PageSkeleton({
  sectionClassName,
  scroll = false,
  children,
  ...header
}: Parameters<typeof PageHeader>[0] & {
  sectionClassName?: string;
  /**
   * The section itself scrolls, as on the forms (Invite users, payment methods).
   * Pages whose scroll lives on an inner block (Dashboard, SEO…) put it there.
   */
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col" role="status" aria-label="Loading">
      <PageHeader {...header} />
      <section
        className={cn(
          "mt-4 min-h-0 flex-1 rounded-xl border bg-background",
          scroll ? "overflow-y-auto" : "overflow-hidden",
          sectionClassName,
        )}
        aria-hidden
      >
        {children}
      </section>
    </div>
  );
}

// ── Toolbar controls ──────────────────────────────────────────────────────────

/** The pill classes every filter and tab row uses (clientsTable's StatusFilter and the others). */
const PILL =
  "inline-flex h-6 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium";
const PILL_ON = "border-border bg-background text-foreground shadow-sm";

export type PillOption = string | { label: ReactNode; className?: string };

/**
 * A row of filter pills or tabs (Status, Role, Groups, Period, sections) — the
 * real ones, not grey bars: their words never depend on data, so the loading
 * screen shows them as they will be, with the default choice lit. Static spans,
 * not buttons: nothing here can be pressed yet.
 */
export function Pills({ options, active, className }: { options: PillOption[]; active?: number; className?: string }) {
  return (
    <div className={cn("inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5", className)}>
      {options.map((option, index) => {
        const { label, className: optionClassName } = typeof option === "string" ? { label: option, className: undefined } : option;
        return (
          <span key={index} className={cn(PILL, index === active ? PILL_ON : "text-muted-foreground", optionClassName)}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The period filter (app-shell/rangeFilter.tsx): Today … This year, then Custom
 * with its calendar. `active` is the page's default period — the address bar can
 * ask for another, which a loading screen cannot read.
 */
export function RangePills({ active }: { active: SeoRangeId }) {
  return (
    <Pills
      className="flex-wrap"
      active={active === "custom" ? seoRanges.length : seoRanges.findIndex((range) => range.id === active)}
      options={[
        ...seoRanges.map((range) => ({ label: range.label, className: "px-2.5" })),
        { label: <><CalendarDays aria-hidden className="size-3" />Custom</>, className: "gap-1 px-2.5" },
      ]}
    />
  );
}

/** The search box: the same width as the real one (`sm:w-56` or `sm:w-64`). */
export function SearchSkeleton({ className = "sm:w-64" }: { className?: string }) {
  return <Skeleton className={cn("h-8 w-full", className)} />;
}

/** A small toolbar button (date range, Export CSV, columns…). */
export function ButtonSkeleton({ className = "w-24" }: { className?: string }) {
  return <Skeleton className={cn("h-7", className)} />;
}

// ── Tables ────────────────────────────────────────────────────────────────────

export type ColumnSkeleton = {
  /** The real heading, or "" for a checkbox / icon column. */
  label: string;
  /** The real column's width class (`w-36`), and `text-right` where it is right-aligned. */
  className?: string;
  /** What sits in each cell: a line of text (default), an avatar and two lines, a pill, or a checkbox. */
  cell?: "text" | "person" | "actor" | "pill" | "checkbox" | "icon" | "action";
  /** Real words for this column, one per row, when they never change ("1 device", "2 devices"…). */
  rowLabels?: ReactNode[];
};

/**
 * An unticked checkbox, drawn as one: it is a control, not data, so it is never
 * grey — and a grey square on the grey header row would be a skeleton inside a skeleton.
 */
function EmptyCheckbox() {
  return <span className="block size-3.5 rounded-[4px] border border-input bg-background" />;
}

/** Text lines of uneven length, so a column reads as data and not as a stripe. */
const LINE_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-3/5"];

function Cell({ kind = "text", row, column, right }: { kind?: ColumnSkeleton["cell"]; row: number; column: number; right: boolean }) {
  const width = LINE_WIDTHS[(row + column) % LINE_WIDTHS.length];
  switch (kind) {
    case "checkbox":
      return <EmptyCheckbox />;
    case "icon":
      return <Skeleton className="size-5 rounded-md" />;
    case "action":
      return <Skeleton className="ml-auto size-6" />;
    case "pill":
      return <Skeleton className="h-5 w-16 rounded-full" />;
    case "actor":
      // The Action log's "Who": a 28px tile and the name on one line (actionLogTable.tsx).
      return (
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7 shrink-0 rounded-lg" />
          <Skeleton className={cn("h-3", width)} />
        </div>
      );
    case "person":
      return (
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className={cn("h-3", width)} />
            <Skeleton className="h-2 w-1/3" />
          </div>
        </div>
      );
    default:
      return <Skeleton className={cn("h-3", width, right && "ml-auto")} />;
  }
}

/**
 * Any of the app's tables while it loads — Clients, Renewals, Users, Action log,
 * Ledger, Templates all share one frame: a toolbar, a muted header row with
 * rounded ends, rows, and a footer. The classes below are copied from those
 * tables, so the header row lands exactly where the real one will.
 */
export function TableSkeleton({
  toolbar,
  toolbarClassName = "flex-col sm:flex-row sm:items-center",
  columns,
  rows = 10,
  minWidth,
  footer = "pages",
  beforeFooter,
}: {
  toolbar: ReactNode;
  /**
   * The toolbar's direction, whole: stacked then one line at `sm` for most tables,
   * Renewals at `lg`; the Ledger one wrapping row. The direction lives only here,
   * never also in the fixed classes, so two directions never meet on one element.
   */
  toolbarClassName?: string;
  /** A block between the rows and the footer (the Ledger's balance). */
  beforeFooter?: ReactNode;
  columns: ColumnSkeleton[];
  rows?: number;
  /**
   * The real table's minimum width in px, so narrow windows scroll the same way.
   * A number set as a style, not a class: the tables work it out from the visible
   * columns, and Tailwind cannot build a class from a number known only at runtime.
   */
  minWidth?: number;
  /** "pages": Showing … of …, page size and paging buttons. "count": one line. Or the footer's own content. */
  footer?: "pages" | "count" | ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex shrink-0 gap-2 px-4 py-3", toolbarClassName)}>{toolbar}</div>

      {/* The rows scroll under the header and above the footer, as in the real tables. */}
      <div className="min-h-0 flex-1 overflow-auto px-4 [scrollbar-gutter:stable] [&>[data-slot=table-container]]:overflow-visible">
        <TableRowsSkeleton columns={columns} rows={rows} minWidth={minWidth} />
      </div>

      {beforeFooter}

      <footer className="flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 sm:flex-row sm:items-center">
        {footer === "pages" ? <PagerSkeleton /> : footer === "count" ? <Skeleton className="h-3 w-40" /> : footer}
      </footer>
    </div>
  );
}

/**
 * Just the table — the muted, rounded header row and the rows — for tables that
 * sit inside a frame of their own (the Configuration tabs), without the page
 * table's toolbar and footer.
 *
 * <p>`plain`: the shadcn table as it comes — a ruled header, no muted row — as
 * Expenses uses for Cost per plan and Perks.
 */
export function TableRowsSkeleton({
  columns,
  rows,
  minWidth,
  plain = false,
  dense = true,
  className,
}: {
  columns: ColumnSkeleton[];
  rows: number;
  minWidth?: number;
  plain?: boolean;
  /** The page tables' tight cells (`px-1.5`). The Configuration tabs keep the table's own padding. */
  dense?: boolean;
  className?: string;
}) {
  return (
    <Table
      style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
      className={cn(
        plain ? "text-xs" : "table-fixed border-separate border-spacing-0 text-xs",
        !plain && dense && "[&_td]:px-1.5 [&_th]:px-1.5 [&_th]:whitespace-nowrap [&_td:last-child]:pr-4 [&_th:last-child]:pr-4",
        className,
      )}
    >
      <TableHeader
        className={plain ? undefined : "[&_tr]:border-0 [&_th]:border-0 [&_th]:bg-muted/95 [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg"}
      >
        <TableRow className={plain ? "hover:bg-transparent" : "border-0 hover:bg-transparent"}>
          {columns.map((column, index) => (
            <TableHead key={index} className={cn("text-muted-foreground", column.className)}>
              {column.cell === "checkbox" ? <EmptyCheckbox /> : column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, row) => (
          <TableRow key={row} className={cn("hover:bg-transparent", !plain && "h-12 border-b border-border/80 last:border-0")}>
            {columns.map((column, index) => (
              <TableCell key={index} className={column.className}>
                {column.rowLabels ? (
                  column.rowLabels[row]
                ) : (
                  <Cell kind={column.cell} row={row} column={index} right={Boolean(column.className?.includes("text-right"))} />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The table footer's controls: "Showing … of …", the page size, and the paging buttons. */
export function PagerSkeleton() {
  return (
    <>
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-28" />
        <ButtonSkeleton className="w-28" />
      </div>
      <div className="flex items-center gap-1 sm:ml-auto">
        <ButtonSkeleton className="w-7" />
        <ButtonSkeleton className="w-20" />
        <Skeleton className="h-7 w-16" />
        <ButtonSkeleton className="w-16" />
        <ButtonSkeleton className="w-7" />
      </div>
    </>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

/**
 * One line of text that is data, at its real size: the element carries the real
 * text classes (`text-3xl`, `mt-1`…), so its line height is the real one, and the
 * grey bar sits inside it. A bare `h-3` bar is shorter than the line it stands
 * for, and every block under it would start a few pixels too high.
 */
export function Line({ className, width = "w-32" }: { className?: string; width?: string }) {
  return (
    // A block <span>, not a <p>: it also sits inside spans and table cells, where a <p> is not allowed.
    <span className={cn("block min-w-0", className)}>
      <span className={cn("inline-block h-[0.75em] max-w-full animate-pulse rounded-[0.2em] bg-muted align-middle", width)} />
    </span>
  );
}

/** Lines of text, for list rows and paragraphs. */
export function LinesSkeleton({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn("h-3", LINE_WIDTHS[index % LINE_WIDTHS.length])} />
      ))}
    </div>
  );
}

/** A form field: its label and its box. */
export function FieldSkeleton({ className, tall = false }: { className?: string; tall?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className={tall ? "h-24 w-full" : "h-9 w-full"} />
    </div>
  );
}
