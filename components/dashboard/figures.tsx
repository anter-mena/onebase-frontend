"use client";

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";

// Aliased: this module exports a `Gauge` of its own, which wraps this one.
import { Gauge as NotchGauge } from "@/components/charts/gauge";
import { PatternLines } from "@/components/charts/visx-pattern";
import { HATCH_INK, hatch } from "@/components/dashboard/hatch";
import { signedPercent } from "@/lib/format";

/**
 * The pieces of a dashboard that are numbers rather than charts.
 *
 * <p>A single current value is a stat tile, not a one-bar chart. A single ratio
 * against a limit is a meter, not a two-slice pie. Both are here because both
 * were, in the design this follows, drawn as charts.
 */

/**
 * One headline number, with how it moved.
 *
 * <p>⚠️ <b>Direction is never colour alone.</b> The delta carries an arrow and
 * the period it is measured against, so it survives being printed, being read
 * by somebody with a colour vision deficiency, and being glanced at.
 *
 * <p>`upIsGood` exists because the answer is not always yes. Revenue climbing
 * is green; expenses climbing is the same arrow in the opposite colour, and
 * getting that backwards is the sort of thing a dashboard does not recover from.
 */
export function StatTile({
  label,
  value,
  change,
  changeNote,
  upIsGood = true,
}: {
  label: string;
  value: string;
  /** Signed percentage. Omit when there is nothing to compare against. */
  change?: number;
  /** The period the change is measured against — "vs previous 7 days". */
  changeNote?: string;
  upIsGood?: boolean;
}) {
  const rising = change !== undefined && change > 0;
  const good = rising === upIsGood;
  const Icon = rising ? TrendingUp : TrendingDown;

  return (
    <div className="flex min-w-0 flex-col">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      {/* Proportional figures, not tabular: this is a standalone number and
          equal-width digits make it look loose at this size. */}
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>

      {change !== undefined ? (
        <p className="mt-1.5 flex items-center gap-1 text-[0.65rem]">
          <Icon
            aria-hidden
            className="size-3 shrink-0"
            style={{ color: good ? "var(--viz-good)" : "var(--viz-critical)" }}
          />
          <span
            className="font-medium"
            style={{ color: good ? "var(--viz-good)" : "var(--viz-critical)" }}
          >
            {signedPercent(change)}
          </span>
          <span className="truncate text-muted-foreground">{changeNote}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * A ratio against a limit.
 *
 * <p><b>Drawn as a two-part split, not as a fill inside a track.</b> Earned and
 * still-to-go are two shares of one target, which is the same sentence the
 * brand split makes — so it is made the same way: two hatched blocks, each
 * rounded on all four corners, separated by a gap in the surface colour. Two
 * bars on one screen that mean the same kind of thing should not be drawn in
 * two different grammars.
 *
 * <p>⚠️ Green for the earned part and the ramp's grey for the remainder, where
 * this used to be a blue fill on a wash of itself. The grey is the same slot
 * the split uses for the tail — it reads as the part with nothing in it, which
 * is exactly what "to go" is, and it keeps the ink on the share that was
 * actually earned.
 *
 * <p>The figure and the remainder are both printed above and below the bar, so
 * nothing here depends on reading a length or telling two hues apart.
 */
export function Meter({
  label,
  valueLabel,
  limitLabel,
  ratio,
  tone = "var(--viz-ramp-2)",
}: {
  label: ReactNode;
  valueLabel: string;
  limitLabel?: string;
  /** 0 to 1. Clamped, because a target can be overshot. */
  ratio: number;
  tone?: string;
}) {
  const filled = Math.min(Math.max(ratio, 0), 1);
  const remaining = 1 - filled;

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span className="shrink-0 text-xs font-medium tabular-nums">{valueLabel}</span>
      </div>

      <div
        role="meter"
        aria-valuenow={Math.round(filled * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === "string" ? label : undefined}
        className="mt-2 flex h-7 w-full gap-1"
      >
        {/* Each block only when it has something in it. At a full target the
            remainder is nothing, and a zero-width block still shows as a 6px
            stub of grey — a target met would appear to be just short. */}
        {filled > 0 ? (
          <span
            className="h-full min-w-1.5 rounded-[6px]"
            style={{ flex: "1 1 0", flexGrow: filled, backgroundImage: hatch(tone, { line: 2.5, pitch: 9 }) }}
          />
        ) : null}
        {remaining > 0 ? (
          // Flat, not hatched. The texture marks the parts that are data; this
          // one is the absence of it.
          <span
            className="h-full min-w-1.5 rounded-[6px]"
            style={{ flex: "1 1 0", flexGrow: remaining, background: "var(--viz-ramp-rest)" }}
          />
        ) : null}
      </div>

      {limitLabel ? (
        <p className="mt-1.5 text-[0.6rem] text-muted-foreground">{limitLabel}</p>
      ) : null}
    </div>
  );
}

/** Ties the hatch pattern to this component, so two gauges cannot collide. */
const GAUGE_PATTERN_ID = "gauge-notch-hatch";

/**
 * The same ratio, drawn as a ring of notches.
 *
 * <p>Bklit's gauge rather than the arc this used to draw by hand. A notched
 * ring is a scale with its own tick marks: the reader can count filled notches
 * instead of judging the length of a stroke, which is the one thing a bent bar
 * is bad at. The 270° sweep is the registry's default and leaves the opening at
 * the bottom, where nothing is read.
 *
 * <p>⚠️ <b>The active notches carry the same hatch as every other mark on this
 * dashboard</b>, through a `PatternLines` in the gauge's own `<defs>` rather
 * than a CSS gradient — an SVG fill cannot take one. Same angle, same spacing,
 * same translucent white, so it reads as one family with the bars. The
 * unfilled notches are flat in the ramp's grey: texture marks what is there,
 * absence stays plain, exactly as in {@link Meter}.
 *
 * <p>One value, so there is no legend — the number sits in the middle and the
 * card's note says what it is a share of.
 */
export function Gauge({
  ratio,
  centerLabel,
  tone = "var(--viz-ramp-2)",
}: {
  ratio: number;
  /** The small line under the number — what the percentage is of. */
  centerLabel: string;
  tone?: string;
}) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      role="img"
      aria-label={`${percent} percent — ${centerLabel}`}
    >
      <NotchGauge
        value={percent}
        centerValue={percent}
        suffix="%"
        defaultLabel={centerLabel}
        activeFill={`url(#${GAUGE_PATTERN_ID})`}
        activeFillOpacity={1}
        inactiveFill="var(--viz-ramp-rest)"
        inactiveFillOpacity={1}
        // The wrapper's own 300px floor would push the card wider than the
        // column on a phone. The gauge scales down fine; the layout does not.
        minWidth={0}
      >
        <PatternLines
          id={GAUGE_PATTERN_ID}
          width={7}
          height={7}
          background={tone}
          // The same ink as the CSS hatch — see HATCH_INK.
          stroke={HATCH_INK}
          strokeWidth={2.5}
          orientation={["diagonal"]}
        />
      </NotchGauge>
    </div>
  );
}

/**
 * A monochrome Simple Icons mark, tinted with the current text colour.
 *
 * <p>A CSS mask rather than an `<img>`, so the logo takes the ink around it and
 * needs no per-mode artwork — the same trick `Brands` and the Clients table
 * already use, and the reason the slug is stored rather than a URL.
 *
 * <p>⚠️ No fallback chain here, unlike `Brands`. That one renders whatever
 * domain somebody pasted; these slugs are ours. If one is wrong the mark comes
 * out blank and the row still reads — the name beside it is the label, and the
 * logo was never carrying it alone.
 */
function BrandMark({ slug, className }: { slug: string; className?: string }) {
  const src = `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${slug}.svg`;

  return (
    <span
      aria-hidden
      className={cn("block shrink-0 bg-current", className)}
      style={{ mask: `url(${src}) center / contain no-repeat`, WebkitMask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

/**
 * Part-to-whole, as one horizontal bar plus the figures.
 *
 * <p>A bar rather than a donut, because the reader's job is comparing two close
 * shares and an angle is the hardest way to do that. The list underneath is the
 * relief the light-mode contrast warning requires: every share is also a number.
 *
 * <p>⚠️ Segments are separated by a gap in the surface colour, not by a stroke
 * around each one. A border adds ink that is not data. Each segment is rounded
 * on all four corners rather than only at the ends of the bar, so a share reads
 * as its own block — the bar is a row of shares, not one pill cut up.
 *
 * <p>⚠️ Proportion is `flex-grow`, not a width percentage. Percentages plus
 * gaps come to more than the track, which the old version hid by clipping the
 * last segment — so every share was drawn slightly short and the last one
 * shortest of all. Growing from a zero basis divides what is left after the
 * gaps, in exactly the right ratio.
 */
export function SplitBar({
  rows,
  total,
}: {
  rows: readonly {
    label: string;
    value: number;
    color: string;
    note?: string;
    /** Simple Icons slug. Optional — without one the row shows its swatch alone. */
    logo?: string;
  }[];
  total: number;
}) {
  const visible = rows.filter((row) => row.value > 0);

  return (
    <div className="min-w-0">
      <div className="flex h-7 w-full gap-1">
        {visible.map((row) => (
          <span
            key={row.label}
            className="h-full min-w-1.5 rounded-[6px]"
            // A coarser hatch than the chart's: these blocks are nearly three
            // times the height, and the fine rule reads as a flat lighter
            // colour once it is spread over this much surface.
            style={{ flex: "1 1 0", flexGrow: row.value, backgroundImage: hatch(row.color, { line: 2.5, pitch: 9 }) }}
          />
        ))}
      </div>

      {/* `mt-6`, not `mt-4`. The bar is 28px of solid hatch and the first
          legend row carries a swatch of the same fill — at 16px the two read
          as one block and the eye runs straight from the bar into the list
          without registering that one is the key to the other. */}
      <ul className="mt-6 flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            {/* The swatch is a miniature of the segment — same shape, same
                hatch — because matching the two is the whole job of a legend. */}
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundImage: hatch(row.color) }}
            />
            {row.logo ? <BrandMark slug={row.logo} className="size-3.5 text-foreground/70" /> : null}
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            {row.note ? (
              <span className="shrink-0 text-[0.65rem] text-muted-foreground">{row.note}</span>
            ) : null}
            <span className="w-10 shrink-0 text-right font-medium tabular-nums">
              {total === 0 ? "0%" : `${Math.round((row.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
