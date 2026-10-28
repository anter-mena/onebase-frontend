import type { ReactNode } from "react";
import { ArrowRight, Pencil } from "lucide-react";
import { cn } from "cn";

import { Gauge as NotchGauge } from "@/components/charts/gauge";
import { Line, PageSkeleton, RangePills } from "@/components/loading/pageSkeleton";
import { AXIS_GUTTER, showsLabel } from "@/lib/dashboard/chartLabels";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Dashboard while it loads, at the real components' own sizes. Every size
 * below is read from the component it stands for, not guessed:
 *
 * <ul>
 *   <li>the revenue chart: drawn empty at its real geometry (see RevenueChartSkeleton);</li>
 *   <li>Total / Revenue / Expenses: StatTile — a label, a `text-2xl` figure, a change line (figures.tsx);</li>
 *   <li>Active clients: the real gauge, drawn empty (charts/gauge.tsx);</li>
 *   <li>Monthly target and Revenue by brand: Meter and SplitBar, `h-7` bars (figures.tsx);</li>
 *   <li>Payment methods: the card, full width and at least `min-h-48`, the dots, the
 *       three figures (panels.tsx);</li>
 *   <li>Panel credit, under it: a `text-2xl` count, a slim `h-2.5` bar (creditSummary.tsx).</li>
 * </ul>
 *
 * <p>It scrolls like the real page: the whole layout is there, below the fold too.
 *
 * <p>Text that is data is a {@link Line} carrying the real text classes, so each
 * line is as tall as the one it stands for. Words that never change — titles,
 * labels, links — are the words themselves.
 */

/** The dashboard Panel (panels.tsx): title, note, the header link, then the body under `mt-4`. */
function Panel({
  title,
  note,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string;
  /** The real note when it never changes; a grey line when it is data. */
  note?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{title}</h2>
          {note ? (
            <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">{note}</p>
          ) : (
            <Line className="mt-0.5 text-[0.65rem]" width="w-36" />
          )}
        </div>
        {action}
      </div>
      <div className={cn("mt-4 min-w-0 flex-1", contentClassName)}>{children}</div>
    </section>
  );
}

function HeaderLink({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground">
      {children}
      <ArrowRight className="size-3" aria-hidden />
    </span>
  );
}

/** StatTile (figures.tsx): label, `text-2xl` figure, and the change line when there is one. */
function StatTile({ label, change = true }: { label?: string; change?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col">
      {label ? <p className="truncate text-xs text-muted-foreground">{label}</p> : <Line className="text-xs" width="w-28" />}
      <Line className="mt-1 text-2xl" width="w-32" />
      {change ? <Line className="mt-1.5 text-[0.65rem]" width="w-40" /> : null}
    </div>
  );
}

/** A Meter / SplitBar track (`h-7`, two blocks with a gap). */
function Bar() {
  return (
    <div className="flex h-7 w-full gap-1">
      <Skeleton className="h-full flex-[3] rounded-[6px]" />
      <Skeleton className="h-full flex-[2] rounded-[6px]" />
    </div>
  );
}

/** Where the grid lines sit, top to bottom, and which one is zero — revenue above, expenses below. */
const TICKS = [0, 25, 50, 75, 100];
const ZERO_AT = 75;

/** Bar heights for the skeleton: uneven, as data is, and the same on every render. */
const UP = [62, 35, 80, 48, 20, 70, 55, 90, 30, 66, 44, 75, 25, 58];
const DOWN = [30, 15, 45, 20, 10, 35, 25];

/**
 * The revenue chart (revenueChart.tsx) drawn empty, at its real geometry: the
 * tick gutter, the hairline grid with the darker zero line, one column per day
 * of "This month" — the default period, so the columns are as wide as the
 * real ones — each with its bar above zero and its bar below (70% wide, at most
 * 92px, 3px clear of zero), and the day labels under them.
 */
function RevenueChartSkeleton() {
  const days = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", day: "numeric" }).format(new Date()));
  const columns = Array.from({ length: days }, (_, index) => index);
  const gutter = AXIS_GUTTER;

  return (
    // Fills its card like the real chart: the plot takes the spare height, at least h-44.
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 gap-2">
        <div className="relative shrink-0 text-[0.6rem] tabular-nums" style={{ width: gutter }}>
          {TICKS.map((top) => (
            <span key={top} className="absolute right-0 -translate-y-1/2" style={{ top: `${top}%` }}>
              <span className="inline-block h-[0.75em] w-[3ch] animate-pulse rounded-[0.2em] bg-muted align-middle" />
            </span>
          ))}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="absolute inset-0">
            {TICKS.map((top) => (
              <span
                key={top}
                className={cn("absolute inset-x-0 h-px", top === ZERO_AT ? "bg-muted-foreground/40" : "bg-border")}
                style={{ top: `${top}%` }}
              />
            ))}
          </div>
          <div className="relative flex min-h-44 flex-1 items-stretch px-2">
            {columns.map((index) => (
              <div key={index} className="flex h-full flex-1 flex-col">
                <div className="flex items-end justify-center" style={{ height: `${ZERO_AT}%` }}>
                  <Skeleton
                    className="rounded-[6px]"
                    style={{ width: "70%", maxWidth: 92, marginBottom: 3, height: `calc(${UP[index % UP.length]}% - 3px)` }}
                  />
                </div>
                <div className="flex items-start justify-center" style={{ height: `${100 - ZERO_AT}%` }}>
                  <Skeleton
                    className="rounded-[6px]"
                    style={{ width: "70%", maxWidth: 92, marginTop: 3, height: `calc(${DOWN[index % DOWN.length]}% - 3px)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex min-w-0 gap-2">
        {/* The axis font size, so this `ch`-wide spacer is as wide as the tick gutter above. */}
        <span className="shrink-0 text-[0.6rem]" style={{ width: gutter }} />
        <div className="flex min-w-0 flex-1 px-2 text-[0.6rem]">
          {/* Only the columns the real chart labels (lib/dashboard/chartLabels), each "27 Oct" wide. */}
          {columns.map((index) => (
            <span key={index} className="flex min-w-0 flex-1 justify-center">
              {showsLabel(index, columns.length) ? (
                <span className="inline-block h-[0.75em] w-[4.5ch] shrink-0 animate-pulse rounded-[0.2em] bg-muted align-middle" />
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <PageSkeleton eyebrow="Overview" title="Dashboard" description="Your One Base workspace at a glance.">
      {/* It scrolls, like the real page: the same container, the same stable gutter. */}
      <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Line className="text-xs" width="w-56" />
            {/* This month: the page's default period. */}
            <RangePills active="month" />
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
            <div className="flex min-w-0 flex-col gap-4">
              <section className="min-w-0 rounded-xl border bg-muted/40 p-2.5">
                <div className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(0,1fr)_15rem]">
                  <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Line className="text-xs" width="w-28" />
                        <Line className="mt-1 text-3xl" width="w-40" />
                        <Line className="mt-1 text-[0.65rem]" width="w-56" />
                      </div>
                      <ul className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
                        {["Revenue", "Expenses"].map((label) => (
                          <li key={label} className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                            <span className="size-2.5 shrink-0 rounded-[3px] bg-muted" />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-4">
                      <RevenueChartSkeleton />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col divide-y">
                    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                      <h2 className="text-sm font-medium">Total</h2>
                      <div className="mt-2.5">
                        <StatTile change={false} />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                      <h2 className="text-sm font-medium">Revenue</h2>
                      <div className="mt-2.5">
                        <StatTile label="New and renewing" />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                      <h2 className="text-sm font-medium">Expenses</h2>
                      <div className="mt-2.5">
                        <StatTile label="Panel credit top-ups and perks" />
                        <Line className="mt-1 text-[0.6rem]" width="w-36" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <Panel
                  title="Active clients"
                  note="On a paid plan ÷ all clients on the books"
                  className="md:row-span-2"
                  contentClassName="mt-0.5"
                >
                  <div className="flex h-full flex-col">
                    <Line className="text-[0.65rem]" width="w-52" />
                    <div className="mt-4 min-h-0 flex-1">
                      {/* The real gauge (charts/gauge.tsx, as figures.tsx draws it), with no value:
                          every notch in the skeleton grey, the same arc, notches and 21:16 box.
                          Its centre is ours — the figure grey, the label real. */}
                      <div className="relative flex h-full w-full animate-pulse items-center justify-center">
                        <NotchGauge value={0} inactiveFill="var(--muted)" inactiveFillOpacity={1} minWidth={0} />
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                          <Line className="text-2xl font-semibold" width="w-16" />
                          <span className="text-xs text-muted-foreground">on a paid plan</span>
                        </div>
                      </div>
                    </div>
                    <Line className="mt-3 text-[0.65rem]" width="w-32" />
                  </div>
                </Panel>

                <Panel
                  title="Monthly target"
                  action={
                    <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
                      <Pencil className="size-3" aria-hidden />
                    </span>
                  }
                >
                  <div className="flex h-full flex-col justify-end">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">Earned so far</span>
                      <Line className="text-xs" width="w-16" />
                    </div>
                    <div className="mt-2">
                      <Bar />
                    </div>
                    <Line className="mt-1.5 text-[0.6rem]" width="w-40" />
                  </div>
                </Panel>

                {/* The whole slot, as on the page since Panel credit moved right. The rows are
                    one grid like SplitBar's: swatch, logo, name, note, percentage. */}
                <Panel title="Revenue by brand">
                  <Bar />
                  <ul className="mt-6 grid grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,max-content)_2.5rem] items-center gap-x-2 gap-y-2.5 text-xs">
                    {[0, 1, 2, 3].map((index) => (
                      <li key={index} className="col-span-full grid grid-cols-subgrid items-center">
                        <span className="size-2.5 rounded-[3px] bg-muted" />
                        <Skeleton className="size-3.5 rounded-sm" />
                        <Line className="text-xs" width={index % 2 ? "w-16" : "w-24"} />
                        <Line className="text-right text-[0.65rem]" width="w-14" />
                        <Line className="text-right text-xs" width="w-8" />
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <Panel title="Payment methods" action={<HeaderLink>Manage</HeaderLink>}>
                <div className="flex h-full flex-col gap-3">
                  {/* The card: full width, at least min-h-48 (paymentMethodCard.tsx), centred in
                      the height above the dots and figures, which sit at the foot (panels.tsx). */}
                  <div className="flex flex-1 flex-col justify-center">
                    <Skeleton className="min-h-48 w-full rounded-2xl" />
                  </div>
                  {/* The dots and the figures as one block, 12px apart, as in panels.tsx. */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-center gap-1.5">
                      <span className="h-1.5 w-4 rounded-full bg-muted" />
                      <span className="size-1.5 rounded-full bg-muted" />
                      <span className="size-1.5 rounded-full bg-muted" />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                      <dl className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-center">
                        {["Received", "Payments", "Last payment"].map((label) => (
                          <div key={label} className="min-w-0">
                            <dt className="truncate text-[0.6rem] text-muted-foreground">{label}</dt>
                            <Line className="mt-0.5 text-sm" width="w-14" />
                          </div>
                        ))}
                      </dl>
                      <span className="size-8 shrink-0 rounded-md border bg-background" />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Panel credit (creditSummary.tsx), between Payment methods and Needs chasing. */}
              <section className="flex min-w-0 flex-col rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-medium">Panel credit</h2>
                  <HeaderLink>Top up</HeaderLink>
                </div>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">What new lines are made from</p>
                {/* Compact, as creditSummary.tsx: the count and "spent" on one line, a slim bar, the last top-up. */}
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-1.5">
                    <Line className="text-2xl" width="w-14" />
                    <span className="text-[0.65rem] text-muted-foreground">credits left</span>
                  </span>
                  <Line className="text-[0.6rem]" width="w-20" />
                </div>
                <div className="mt-2 flex h-2.5 w-full gap-1">
                  <Skeleton className="h-full flex-[3] rounded-[4px]" />
                  <Skeleton className="h-full flex-1 rounded-[4px]" />
                </div>
                <Line className="mt-2 text-[0.6rem]" width="w-28" />
              </section>

              <Panel title="Needs chasing" className="flex-1" action={<HeaderLink>All</HeaderLink>}>
                <ul className="flex flex-col gap-3 pt-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <li key={index} className="flex items-center gap-2.5">
                      <Skeleton className="size-7 shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1">
                        <Line className="text-xs" width={index % 2 ? "w-24" : "w-32"} />
                        <Line className="mt-0.5 text-[0.6rem]" width="w-20" />
                      </span>
                      <Line className="shrink-0 text-xs" width="w-12" />
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
