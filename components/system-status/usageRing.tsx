"use client";

import { useId, useSyncExternalStore } from "react";

import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { RingChart } from "@/components/charts/ring-chart";
import { PatternLines } from "@/components/charts/visx-pattern";
import { HATCH_INK } from "@/components/dashboard/hatch";

/**
 * How full something is, as bklit's Ring chart — one ring, the share used,
 * with the percentage (animated as it changes) and the two sizes in the middle.
 *
 * <p>The ring is given the percentage, not the bytes: its centre prints the
 * ring's own value, and "4.0%" is the figure worth reading — the sizes go on
 * the line under it.
 *
 * <p>Looks like the Dashboard's marks: the used part is hatched with the same
 * fine diagonal rules (same ink, same spacing as the Dashboard gauge), its ends
 * only slightly rounded, and a clear gap separates it from the track.
 *
 * <p>Colour is a `--viz-*` token, so it follows the theme like every other chart.
 *
 * <p>Drawn in the browser only: its animated number renders differently on the
 * server, which React reports as a mismatch.
 */
const noSubscribe = () => () => {};

/** True in the browser, false on the server — without a setState in an effect. */
function useInBrowser() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

export function UsageRing({
  percent,
  sublabel,
  color = "var(--viz-1)",
}: {
  /** 0–100. */
  percent: number;
  /** The small line under the percentage — "6.2 GB / 155 GB". */
  sublabel: string;
  color?: string;
}) {
  const share = Math.min(Math.max(percent, 0), 100);
  const patternId = `ring-hatch-${useId().replace(/:/g, "")}`;
  const inBrowser = useInBrowser();
  if (!inBrowser) return <div className="size-40" aria-hidden />;

  return (
    <RingChart
      data={[{ label: sublabel, value: share, maxValue: 100, color: `url(#${patternId})` }]}
      size={160}
      strokeWidth={14}
      baseInnerRadius={62}
      startAngle={0}
      endAngle={2 * Math.PI}
    >
      {/* The Dashboard gauge's hatch: the series colour, ruled with fine light diagonals. */}
      <PatternLines
        id={patternId}
        width={7}
        height={7}
        background={color}
        stroke={HATCH_INK}
        strokeWidth={2.5}
        orientation={["diagonal"]}
      />
      {/* No opening animation and no grow-on-hover: the ring is simply there, at its value. */}
      <Ring index={0} gap={6} cornerRadius={3} showGlow={false} animate={false} hoverScale={false} />
      <RingCenter defaultLabel={sublabel} suffix="%" formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
    </RingChart>
  );
}
