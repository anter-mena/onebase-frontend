"use client";

import { useEffect, useId, useState } from "react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { PatternLines } from "@/components/charts/visx-pattern";
import { HATCH_INK } from "@/components/dashboard/hatch";
import { count } from "@/lib/format";
import type { TrafficPoint } from "@/lib/seo/sample";

/**
 * Organic sessions over the period.
 *
 * <p><b>Bklit's bar chart, not a hand-drawn one.</b> The revenue chart on the
 * dashboard is hand-rolled for one reason — its bars cross zero and Bklit's
 * cannot. Nothing here goes below the axis, so the registry component does the
 * job, which means this chart gets the enter animation, the crosshair, the
 * responsive sizing and the loading chrome without any of it being rewritten.
 *
 * <p>One series. A legend is for telling two things apart, so there is none:
 * the card's title says what the columns are.
 *
 * <p>⚠️ <b>Sessions, not users.</b> The two are within a fifth of each other
 * and plotting both would be two near-identical columns saying almost the same
 * thing. Users is a figure in the tile row instead, where it is read rather
 * than compared.
 */

const SESSIONS = "var(--viz-ramp-2)";

export function TrafficChart({
  points,
  rangeNote,
}: {
  points: TrafficPoint[];
  /** "last 7 days" — names the period the columns cover. */
  rangeNote: string;
}) {
  // Scoped to this instance: two charts on one page would otherwise both fill
  // from whichever pattern rendered last.
  //
  // ⚠️ Stripped to letters and digits. React 19 wraps `useId` in guillemets
  // («r0»), which survive as an id attribute but break the `url(#…)` that has
  // to reference it.
  const patternId = `traffic-hatch-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  /**
   * The sweep, on the first paint only.
   *
   * <p>⚠️ Not on every range or brand change. A skeleton that reappears when a
   * filter moves makes the page flicker; the rule for data already on screen is
   * to hold the previous render.
   *
   * <p>⚠️ Nothing is fetched — this timer stands in for the GA4 call so the
   * state is real code rather than one nobody has seen. When the property is
   * connected, delete the timer and drive `status` from the request.
   */
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">
        Organic search sessions per day over the {rangeNote}.
      </figcaption>

      <BarChart
        data={points as unknown as Record<string, unknown>[]}
        xDataKey="label"
        status={loading ? "loading" : "ready"}
        aspectRatio="16 / 7"
        className="min-w-0"
        // The registry defaults to 40px on every side, which is sized for a
        // chart carrying axis furniture on all four. This one has labels along
        // the bottom and nothing down the sides, so the sides come in and the
        // plot uses the card's width. `bottom` stays at the default: the day
        // labels and the tooltip's date pill both live down there.
        margin={{ top: 8, right: 8, bottom: 40, left: 8 }}
      >
        {/* Collected into the chart's own <defs>; an SVG fill takes a pattern,
            not a CSS gradient, so the hatch is drawn rather than composed.
            Same ink and angle as every other mark in the workspace. */}
        <PatternLines
          id={patternId}
          width={7}
          height={7}
          background={SESSIONS}
          stroke={HATCH_INK}
          strokeWidth={2.5}
          orientation={["diagonal"]}
        />

        <Grid horizontal vertical={false} />

        {/* ⚠️ No `<BarYAxis />`. It is not a value axis — it renders the
            category labels down the left, positioned on the band scale, which
            is what a *horizontal* bar chart needs. On a vertical chart it
            printed the days a second time down the side of the plot and, with
            nothing to size the left margin to, straight out of the card.

            This registry has no numeric axis for vertical bars. The grid lines
            carry the scale and the tooltip carries the figures, which is why
            the hero total sits directly above the plot. */}
        <BarXAxis />

        {/* `stroke` is what the tooltip dot takes, because `fill` is a pattern
            url and a dot cannot be filled with one. */}
        <Bar dataKey="sessions" fill={`url(#${patternId})`} stroke={SESSIONS} />

        <ChartTooltip
          rows={(point) => [
            {
              label: "Sessions",
              value: count(Number(point.sessions)),
              color: SESSIONS,
            },
            {
              label: "Users",
              value: count(Number(point.users)),
              color: SESSIONS,
            },
          ]}
        />
      </BarChart>
    </figure>
  );
}
