import type { ReactNode } from "react";
import { cn } from "cn";

import { hatch } from "@/components/dashboard/hatch";
import { HintedLabel } from "@/components/system-status/hint";

/**
 * One measurement: what it is, what it reads, and how close to its limit.
 *
 * <p>The bar is optional because half of these have no ceiling. A cache hit
 * ratio is out of 100; a database size is out of nothing in particular, and a
 * bar for it would invent a limit that does not exist.
 */
export function StatRow({
  label,
  hint,
  value,
  detail,
  percent,
  color = "var(--viz-1)",
  compact = false,
}: {
  label: string;
  hint: ReactNode;
  value: string;
  /** The right-hand context — "of 100", "since restart". */
  detail?: string;
  /** 0–100. Omit where there is no meaningful ceiling. */
  percent?: number;
  /** Any CSS colour, normally a `--viz-*` token so it follows the theme. */
  color?: string;
  /** Tighter, without the divider — for the small lists inside a container card. */
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", !compact && "border-b pb-3 last:border-b-0 last:pb-0")}>
      <div className="flex items-baseline justify-between gap-3">
        <HintedLabel label={label} className={cn("text-muted-foreground", compact ? "text-[0.7rem]" : "text-xs")}>
          {hint}
        </HintedLabel>
        <span className="flex items-baseline gap-2">
          <span className={cn("font-medium tabular-nums", compact ? "text-[0.7rem]" : "text-xs")}>{value}</span>
          {detail ? <span className="text-[0.65rem] text-muted-foreground tabular-nums">{detail}</span> : null}
        </span>
      </div>

      {percent !== undefined ? <Meter percent={percent} color={color} /> : null}
    </div>
  );
}

/**
 * The bar under a figure — styled like the rings: the used part hatched with the
 * Dashboard's diagonal rules, slightly rounded, with a clear gap before the
 * grey track. Finer rules than on the Dashboard bars, which are much taller.
 */
function Meter({ percent, color }: { percent: number; color: string }) {
  const share = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="flex h-2 gap-[3px]" aria-hidden>
      {share > 0 ? (
        <div className="h-full shrink-0 rounded-[3px]" style={{ width: `${share}%`, background: hatch(color, { line: 1, pitch: 4 }) }} />
      ) : null}
      {share < 100 ? <div className="h-full min-w-0 flex-1 rounded-[3px] bg-muted" /> : null}
    </div>
  );
}
