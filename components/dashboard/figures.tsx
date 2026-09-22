"use client";

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

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
 * <p>The track is the fill's own hue at low opacity rather than a grey, so the
 * whole bar reads as one measure — a grey track reads as a different thing that
 * happens to sit behind. Translucency rather than a fixed light step because it
 * has to work on a white card and a near-black one.
 */
export function Meter({
  label,
  valueLabel,
  limitLabel,
  ratio,
  tone = "var(--viz-1)",
}: {
  label: ReactNode;
  valueLabel: string;
  limitLabel?: string;
  /** 0 to 1. Clamped, because a target can be overshot. */
  ratio: number;
  tone?: string;
}) {
  const filled = Math.min(Math.max(ratio, 0), 1);

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
        className="mt-2 h-2 w-full overflow-hidden rounded-full"
        style={{ background: `color-mix(in oklch, ${tone} 18%, transparent)` }}
      >
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{ width: `${filled * 100}%`, background: tone }}
        />
      </div>

      {limitLabel ? (
        <p className="mt-1.5 text-[0.6rem] text-muted-foreground">{limitLabel}</p>
      ) : null}
    </div>
  );
}

/**
 * The same ratio, drawn as an arc.
 *
 * <p>One value, so there is no legend: the caption under it says what is being
 * measured. The track is the fill's hue at low opacity, exactly as in
 * {@link Meter} — a gauge is a meter that has been bent.
 *
 * <p>Drawn with `stroke-dasharray` on a half-circle rather than as a pie, so
 * the geometry is a length rather than an angle and the number stays readable
 * in the middle.
 */
export function Gauge({
  ratio,
  caption,
  tone = "var(--viz-1)",
}: {
  ratio: number;
  caption: string;
  tone?: string;
}) {
  const filled = Math.min(Math.max(ratio, 0), 1);
  // A half circle of radius 42 is π × 42 ≈ 131.95 long.
  const length = Math.PI * 42;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[13rem]">
        <svg viewBox="0 0 100 56" className="w-full" role="img" aria-label={`${Math.round(filled * 100)} percent. ${caption}`}>
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            style={{ stroke: `color-mix(in oklch, ${tone} 18%, transparent)` }}
          />
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${filled * length} ${length}`}
            style={{ stroke: tone }}
          />
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-2xl font-semibold tracking-tight">
            {Math.round(filled * 100)}%
          </span>
        </div>
      </div>

      <p className="mt-2 text-center text-[0.65rem] leading-relaxed text-muted-foreground">
        {caption}
      </p>
    </div>
  );
}

/**
 * Part-to-whole, as one horizontal bar plus the figures.
 *
 * <p>A bar rather than a donut, because the reader's job is comparing two close
 * shares and an angle is the hardest way to do that. The list underneath is the
 * relief the light-mode contrast warning requires: every share is also a number.
 *
 * <p>⚠️ Segments are separated by a 2px gap in the surface colour, not by a
 * stroke around each one. A border adds ink that is not data.
 */
export function SplitBar({
  rows,
  total,
}: {
  rows: readonly { label: string; value: number; color: string; note?: string }[];
  total: number;
}) {
  const visible = rows.filter((row) => row.value > 0);

  return (
    <div className="min-w-0">
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {visible.map((row) => (
          <span
            key={row.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(row.value / total) * 100}%`, background: row.color }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />
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
