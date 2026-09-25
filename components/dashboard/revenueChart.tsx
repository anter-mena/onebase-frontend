"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "cn";

import { hatch } from "@/components/dashboard/hatch";
import { compactMoney, money } from "@/lib/format";
import type { RevenuePoint } from "@/lib/dashboard/sample";

/**
 * Money in and money out, around a zero line.
 *
 * <p>Two series, and they are poles rather than categories: revenue rises above
 * the baseline, expenses fall below it. That is the one arrangement that makes
 * the shape of a period readable at a glance — a tall blue column over a short
 * orange one is a good week, and no amount of legend-reading is needed to see
 * it. `New` and `Renewals` are folded into one revenue figure — the chart is
 * about money in against money out, and that split is a different question.
 *
 * <p>⚠️ <b>Hand-drawn rather than Bklit, and only this chart.</b> Bklit's bar
 * chart cannot cross zero: its value scale is fixed at `[0, max × 1.1]`, bar
 * height is `innerHeight - scale(value)`, and there is no domain prop — so bars
 * always grow from the floor of the plot. The registry's only sign-aware piece,
 * `profit-loss-line`, is for line charts. Everything else Bklit was installed
 * for is untouched.
 *
 * <p><b>Diverging colour, not categorical.</b> Green against orange because the
 * pair has to read as opposite — one cool, one warm — with a neutral zero line
 * between them. Two cool hues would say "two of the same thing", which is the
 * opposite of what this chart is about. Both are validated `--viz-ramp-*`
 * slots; see the note beside REVENUE.
 *
 * <p><b>Divs and gradients, not SVG.</b> The bars are laid out in CSS so the
 * labels stay at real font sizes and the hover target is an ordinary element;
 * the hatching is a `repeating-linear-gradient`, which takes a CSS custom
 * property directly and so follows the palette without a `<pattern>` per hue.
 *
 * <p>⚠️ The hatch is a deliberate style here, not the accessibility texture
 * channel — that one is reserved, ordered by magnitude, and opt-in. This is
 * decorative and applies equally to both series, so it carries no meaning and
 * takes none away.
 */

/**
 * How wide a bar is: a share of its band, with a ceiling.
 *
 * <p>A share rather than a fixed width, because this is now a broad column
 * rather than a thin mark — at a fixed size it would sit in an ever-growing
 * pool of empty band as the card widens, which is the look this replaced. The
 * ceiling stops a four-column range from turning into four slabs.
 *
 * <p>⚠️ Deliberately well past the 24px a thin-mark chart would cap at. That
 * rule buys elegance at a distance and costs surface: with only two series and
 * a hatch to show, the fill is doing work here, and a 24px column had almost
 * none of it to show. The leftover band still separates the columns — 30% of it
 * rather than most of it.
 */
const BAR_WIDTH_PERCENT = 70;
const BAR_MAX_WIDTH = 92;

/**
 * The gap each bar leaves between itself and the zero line, in pixels.
 *
 * <p>⚠️ <b>It is taken out of the bar's height, not added to its offset.</b>
 * Nudging the bar up by 3px would move its far end up with it and overstate
 * every value by three pixels' worth. Shortening it by the same amount and then
 * pushing it clear leaves the end exactly where the scale puts it — the gap is
 * paid for at the baseline, which is the end that carries no information.
 *
 * <p>Both arms clear the line, so it reads as a rule the bars hang off rather
 * than a floor they stand on, and the two directions look like one pair.
 */
const ZERO_GAP = 3;

/** So a tiny value is still a visible sliver rather than nothing. */
const MIN_BAR = 2;

type Column = {
  label: string;
  fullLabel: string;
  revenue: number;
  expenses: number;
};

/**
 * The gap between one tick and the next, rounded to something sayable.
 *
 * <p>⚠️ <b>The axis is built from a step, not from the tallest bar.</b> Halving
 * the peak gives ticks like 1,605 and 3,210 — numbers that exist only because a
 * bar happened to reach them, and which say nothing about any other bar. A
 * round step gives 0, 1,000, 2,000, and then every bar can be estimated against
 * it. The exact figure is the tooltip's job.
 */
function niceStep(span: number, targetCount = 4): number {
  const raw = Math.max(span, 1) / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(raw));

  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= raw) return candidate;
  }

  return magnitude * 10;
}

/** Round an arm up to a whole number of steps, so the axis ends on a tick. */
function armTo(value: number, step: number): number {
  return Math.max(Math.ceil(value / step), 1) * step;
}

/**
 * The same two hues as the brand split, so the dashboard has one palette
 * rather than a blue chart beside a green one.
 *
 * <p>Green for money in and orange for money out, not the other way round —
 * the pair has to read as opposite, and this is the reading a reader already
 * has. It is reinforcement, not the message: which series a bar belongs to is
 * carried by which side of the zero line it is on, which is position, the one
 * channel that survives everything.
 *
 * <p>Measured against each other: normal-vision ΔE 19.3, CVD ΔE 7.7 (protan).
 * The CVD figure is in the band that needs a second channel; position is it.
 */
const REVENUE = "var(--viz-ramp-2)";
const EXPENSES = "var(--viz-ramp-1)";

const legend = [
  { label: "Revenue", color: REVENUE },
  { label: "Expenses", color: EXPENSES },
] as const;

/**
 * Which colour is which.
 *
 * <p>Exported so the card can put it in its header, opposite the hero figure,
 * rather than stacked under it — a key belongs on the same line as the title of
 * the thing it is keying, where it is read once on the way into the chart.
 * It lives in this file so the swatches cannot drift from the bars: both read
 * the same `legend` list.
 *
 * <p>A legend is always present for more than one series. Identity never rests
 * on colour-matching alone, and the swatches carry the hatch for the same
 * reason — they have to look like what is in the plot.
 */
export function RevenueLegend() {
  return (
    <ul className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
      {legend.map(({ label, color }) => (
        <li key={label} className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundImage: hatch(color) }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function RevenueChart({
  points,
  rangeNote,
}: {
  points: RevenuePoint[];
  /** "last 7 days" — names the period the figures refer to. */
  rangeNote: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  /**
   * The sweep, on the first paint only.
   *
   * <p>⚠️ Not on every range change. A skeleton that reappears whenever a
   * filter moves makes the page flicker; the rule for data already on screen is
   * to hold the previous render. Switching range is instant here anyway.
   *
   * <p>⚠️ Nothing is fetched — this timer stands in for a request so the state
   * is real code rather than one nobody has seen. When the API arrives, delete
   * the timer and drive `loading` from the request.
   */
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const columns: Column[] = useMemo(
    () =>
      points.map((point) => ({
        label: point.label,
        fullLabel: point.fullLabel,
        revenue: point.newRevenue + point.renewals,
        expenses: point.expenses,
      })),
    [points],
  );

  // One step for both arms, each rounded up to a whole number of it. The two
  // arms then take the share of the height their own totals earn — a period
  // with small expenses gets a low zero line rather than half the plot.
  const peakUp = Math.max(...columns.map((column) => column.revenue));
  const peakDown = Math.max(...columns.map((column) => column.expenses));
  const step = niceStep(peakUp + peakDown);
  const topMax = armTo(peakUp, step);
  const bottomMax = armTo(peakDown, step);
  const span = topMax + bottomMax;
  const zeroAt = (topMax / span) * 100;

  // Every multiple of the step across the range. Zero is always one of them,
  // because it is the line the whole chart is read against.
  const ticks = useMemo(() => {
    const values: number[] = [];
    for (let value = -bottomMax; value <= topMax + step / 2; value += step) {
      values.push(Math.round(value));
    }
    return values;
  }, [bottomMax, topMax, step]);

  /**
   * The axis gutter, exactly as wide as its widest tick.
   *
   * <p>It was a flat `w-11` — 44px for labels that need about 25. The surplus
   * was empty card between the title and the plot, and it made the chart look
   * inset from the heading above it. Sizing the gutter to its own content puts
   * the widest label's left edge on the card's content edge, level with the
   * title, and hands the ~20px back to the plot.
   *
   * <p>⚠️ `ch` rather than a measurement. The labels are `tabular-nums`, so
   * every digit is the width of a `0` and a count of characters is an exact
   * width — no ref, no layout read during render. The 2px covers `$` and `-`,
   * which a font is not obliged to make tabular.
   *
   * <p>Short labels still sit in from the edge, because they are right-aligned
   * against the axis. That is the alignment a column of figures wants; it is
   * the widest one that is supposed to meet the margin.
   */
  const tickLabels = useMemo(() => ticks.map(compactMoney), [ticks]);
  const axisGutter = `calc(${Math.max(...tickLabels.map((label) => label.length))}ch + 2px)`;

  return (
    <div className="flex min-w-0 flex-col">
      {/* The legend is not here — see RevenueLegend, which the card renders in
          its header opposite the hero figure. */}
      <figure className="min-w-0">
        <figcaption className="sr-only">
          Revenue above the zero line and expenses below it, over the {rangeNote},
          in US dollars.
        </figcaption>

        <div className="flex min-w-0 gap-2">
          {/* Ticks carry every value that is not directly labelled.
              The type styles sit on the container, not the spans, so the `ch`
              in its width resolves against the font the labels are actually
              set in. */}
          <div
            className="relative h-44 shrink-0 text-[0.6rem] tabular-nums text-muted-foreground"
            style={{ width: axisGutter }}
          >
            {ticks.map((tick, index) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2"
                style={{ top: `${((topMax - tick) / span) * 100}%` }}
              >
                {tickLabels[index]}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            {/* Hairline, solid, recessive. The zero line is the exception: it
                is the one the bars are measured from, so it gets the axis
                colour rather than the grid's. */}
            <div aria-hidden className="absolute inset-0">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className={cn(
                    "absolute inset-x-0 h-px",
                    tick === 0 ? "bg-muted-foreground/40" : "bg-border",
                  )}
                  style={{ top: `${((topMax - tick) / span) * 100}%` }}
                />
              ))}
            </div>

            <div className="relative flex h-44 items-stretch px-2">
              {columns.map((column, index) => (
                <div
                  key={column.label}
                  // The whole column is the hit target, not the bars — an 18px
                  // bar is well below a comfortable one.
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered((current) => (current === index ? null : current))}
                  tabIndex={0}
                  aria-label={`${column.fullLabel}: revenue ${money(column.revenue)}, expenses ${money(column.expenses)}`}
                  className={cn(
                    "group relative flex h-full flex-1 flex-col rounded-md outline-none transition-colors",
                    "focus-visible:bg-muted/60",
                    hovered === index && "bg-muted/60",
                  )}
                >
                  {/* Above the line. Rounded on every corner and standing clear
                      of zero — it is its own shape, not something growing out
                      of the axis. */}
                  <div className="flex items-end justify-center" style={{ height: `${zeroAt}%` }}>
                    <span
                      className="rounded-[6px] transition-[height] duration-500"
                      style={{
                        width: `${BAR_WIDTH_PERCENT}%`,
                        maxWidth: BAR_MAX_WIDTH,
                        marginBottom: ZERO_GAP,
                        height: loading
                          ? 0
                          : `max(${MIN_BAR}px, calc(${(column.revenue / topMax) * 100}% - ${ZERO_GAP}px))`,
                        backgroundImage: hatch(REVENUE),
                      }}
                    />
                  </div>

                  {/* Below it, the same shape mirrored. */}
                  <div className="flex items-start justify-center" style={{ height: `${100 - zeroAt}%` }}>
                    <span
                      className="rounded-[6px] transition-[height] duration-500"
                      style={{
                        width: `${BAR_WIDTH_PERCENT}%`,
                        maxWidth: BAR_MAX_WIDTH,
                        marginTop: ZERO_GAP,
                        height: loading
                          ? 0
                          : `max(${MIN_BAR}px, calc(${(column.expenses / bottomMax) * 100}% - ${ZERO_GAP}px))`,
                        backgroundImage: hatch(EXPENSES),
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* The sweep. Sits over the empty plot while the bars are at
                  zero height, and leaves as they grow. */}
              {loading ? (
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
                  <div
                    className="h-full w-1/3 animate-[viz-sweep_1.4s_ease-in-out_infinite] motion-reduce:animate-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, transparent, color-mix(in oklch, var(--foreground) 8%, transparent), transparent)",
                    }}
                  />
                </div>
              ) : null}
            </div>

            {hovered !== null ? (
              <div
                role="status"
                className="pointer-events-none absolute -top-2 z-10 w-44 -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-3 py-3 text-popover-foreground shadow-md ring-1 ring-foreground/10"
                style={{
                  // Centred over the column it describes, not parked at
                  // whichever side of the plot the index fell on. A tooltip
                  // that appears somewhere else makes the reader find the bar
                  // again; over the bar, the pointer is already there.
                  //
                  // The bars sit inside the plot's own `px-2`, so the column
                  // centre is 8px in plus its share of what is left — not a
                  // flat percentage of the plot, which would drift by up to
                  // half a gutter at the ends.
                  //
                  // `clamp` against half the tooltip's width keeps it inside
                  // the plot at the first and last column. This is why the
                  // width is fixed at `w-44` rather than `w-max`: the clamp
                  // needs a number, and measuring the element would mean
                  // reading a ref during render.
                  left: `clamp(88px, calc(8px + (100% - 16px) * ${(hovered + 0.5) / columns.length}), calc(100% - 88px))`,
                }}
              >
                <p className="text-[0.65rem] font-medium">{columns[hovered].fullLabel}</p>
                {/* The two series, and nothing else.
                    It used to break revenue into new and renewals underneath,
                    which put four rows and two indent levels in a box that
                    exists to answer one question — what are these two bars
                    worth. The split is a different question and belongs on a
                    screen that is about it. */}
                {/* `1fr` on the label column now that the box has a fixed
                    width, so the figures line up against the right edge
                    instead of floating in the middle of it. */}
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                  {[
                    { label: "Revenue", value: columns[hovered].revenue, color: REVENUE },
                    { label: "Expenses", value: columns[hovered].expenses, color: EXPENSES },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="contents">
                      <dt className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                        {label}
                      </dt>
                      <dd className="text-right text-[0.65rem] font-medium tabular-nums">{money(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex min-w-0 gap-2">
          {/* Matches the gutter above, so the day labels stay under their
              columns. One value drives both. */}
          <span aria-hidden className="shrink-0" style={{ width: axisGutter }} />
          <div className="flex min-w-0 flex-1 px-2">
            {columns.map((column) => (
              <span key={column.label} className="flex-1 text-center text-[0.6rem] text-muted-foreground">
                {column.label}
              </span>
            ))}
          </div>
        </div>
      </figure>
    </div>
  );
}
