"use client";

import { useId, useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";
import { cn } from "cn";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compactMoney, money } from "@/lib/format";
import type { RevenuePoint } from "@/lib/dashboard/sample";

/**
 * What came in and what went out, per day or per week.
 *
 * <p>Three series, grouped rather than stacked: new business and renewals are
 * both income and could stack, but expenses are the opposite sign and stacking
 * them on top would draw a total that means nothing. Grouped columns on one
 * axis lets all three be compared without inventing a quantity.
 *
 * <p><b>Built from divs, not an SVG viewBox, and not a charting library.</b>
 * A `viewBox` scales its text along with its geometry, so labels end up at
 * whatever size the container happens to be. Laying the columns out in CSS
 * keeps every label at a real font size and makes the hover target an ordinary
 * element. It also adds no dependency: the only other chart in this application
 * — `QuarterSparkline` — is hand-drawn for the same reason.
 *
 * <p>⚠️ <b>The table view is not a nicety.</b> One of the three series colours
 * sits at 2.82:1 against a white surface, below the 3:1 bar, which is allowed
 * only where the values are also readable as text. That is what the toggle is
 * for, and it is why it is a real view rather than a tooltip — a tooltip cannot
 * be read by someone who is not hovering.
 */

type SeriesKey = "newRevenue" | "renewals" | "expenses";

const series: readonly { key: SeriesKey; label: string; color: string }[] = [
  // Fixed slots, assigned in order and never cycled. See the note on the
  // --viz-* tokens in `globals.css`.
  { key: "newRevenue", label: "New", color: "var(--viz-1)" },
  { key: "renewals", label: "Renewals", color: "var(--viz-2)" },
  { key: "expenses", label: "Expenses", color: "var(--viz-3)" },
];

/**
 * The axis top, rounded to something a person would say.
 *
 * <p>Ticks at 1,750 are ticks nobody reads. This walks up to the next clean
 * step above the tallest column so the four gridlines land on round numbers.
 */
function niceMax(values: number[]): number {
  const peak = Math.max(...values, 1);
  const magnitude = 10 ** Math.floor(Math.log10(peak));

  for (const step of [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= peak) return candidate;
  }

  return magnitude * 10;
}

export function RevenueChart({
  points,
  rangeNote,
}: {
  points: RevenuePoint[];
  /** "last 7 days" — names the period the deltas and totals refer to. */
  rangeNote: string;
}) {
  const [asTable, setAsTable] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const tableId = useId();

  const max = niceMax(points.flatMap((point) => series.map(({ key }) => point[key])));
  // Top to bottom, so they can be laid out in document order.
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        {/* A legend is always present for more than one series — identity never
            rests on colour-matching alone. */}
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {series.map(({ key, label, color }) => (
            <li key={key} className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: color }}
              />
              {label}
            </li>
          ))}
        </ul>

        <div role="group" aria-label="Chart or table" className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5">
          {[
            { value: false, label: "Chart", icon: ChartColumn },
            { value: true, label: "Table", icon: Table2 },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setAsTable(value)}
              aria-pressed={asTable === value}
              aria-label={`${label} view`}
              title={`${label} view`}
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                asTable === value
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {asTable ? (
        <div className="mt-4 overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
          <Table id={tableId} className="text-xs [&_td]:px-2 [&_th]:px-2">
            <TableHeader className="[&_tr]:border-0 [&_th]:border-0 [&_th]:bg-muted/95 [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="w-32">Period</TableHead>
                {series.map(({ key, label }) => (
                  <TableHead key={key} className="text-right">{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((point) => (
                <TableRow key={point.label} className="border-b border-border/80 last:border-0">
                  <TableCell className="whitespace-nowrap">{point.fullLabel}</TableCell>
                  {series.map(({ key }) => (
                    <TableCell key={key} className="text-right tabular-nums">
                      {money(point[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <figure className="mt-4 min-w-0">
          <figcaption className="sr-only">
            New revenue, renewals and expenses over the {rangeNote}. The same
            figures are available as a table using the Table view button.
          </figcaption>

          <div className="flex min-w-0 gap-2">
            {/* Ticks carry every value that is not directly labelled. */}
            <div className="flex h-44 w-10 shrink-0 flex-col justify-between py-0 text-right text-[0.6rem] tabular-nums text-muted-foreground">
              {ticks.map((tick) => (
                <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:-translate-y-full">
                  {compactMoney(tick)}
                </span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {/* Hairline, solid, one step off the surface. Never dashed. */}
              <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
                {ticks.map((tick) => (
                  <span key={tick} className="h-px w-full bg-border" />
                ))}
              </div>

              <div className="relative flex h-44 items-end">
                {points.map((point, index) => (
                  <div
                    key={point.label}
                    // The whole column is the hit target, not the individual
                    // bars — a 14px bar is far below a comfortable one.
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered((current) => (current === index ? null : current))}
                    tabIndex={0}
                    aria-label={`${point.fullLabel}: ${series
                      .map(({ key, label }) => `${label} ${money(point[key])}`)
                      .join(", ")}`}
                    className={cn(
                      "group relative flex h-full flex-1 items-end justify-center gap-0.5 rounded-t-md px-0.5 outline-none transition-colors",
                      "focus-visible:bg-muted/60",
                      hovered === index && "bg-muted/60",
                    )}
                  >
                    {series.map(({ key, label, color }) => (
                      <span
                        key={key}
                        title={`${label}: ${money(point[key])}`}
                        // 4px rounded data-end, square at the baseline; capped
                        // so a wide card gets air rather than fatter bars.
                        className="w-full max-w-[14px] rounded-t-[4px]"
                        style={{
                          height: `${Math.max((point[key] / max) * 100, 1)}%`,
                          background: color,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* The tooltip sits above the plot so it never covers the column
                  it describes, and never leaves the card. */}
              {hovered !== null ? (
                <div
                  role="status"
                  className={cn(
                    "pointer-events-none absolute -top-2 z-10 w-max -translate-y-full rounded-lg bg-popover p-2.5 text-popover-foreground shadow-md ring-1 ring-foreground/10",
                    hovered > points.length / 2 ? "right-0" : "left-0",
                  )}
                >
                  <p className="text-[0.65rem] font-medium">{points[hovered].fullLabel}</p>
                  <dl className="mt-1.5 grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
                    {series.map(({ key, label, color }) => (
                      <div key={key} className="contents">
                        <dt className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                          {label}
                        </dt>
                        <dd className="text-right text-[0.65rem] font-medium tabular-nums">
                          {money(points[hovered][key])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex min-w-0 gap-2">
            <span aria-hidden className="w-10 shrink-0" />
            <div className="flex min-w-0 flex-1">
              {points.map((point) => (
                <span key={point.label} className="flex-1 text-center text-[0.6rem] text-muted-foreground">
                  {point.label}
                </span>
              ))}
            </div>
          </div>
        </figure>
      )}
    </div>
  );
}
