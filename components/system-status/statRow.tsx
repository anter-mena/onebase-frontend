import type { ReactNode } from "react";
import { cn } from "cn";

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
  tone = "bg-foreground/70",
  compact = false,
}: {
  label: string;
  hint: ReactNode;
  value: string;
  /** The right-hand context — "of 100", "since restart". */
  detail?: string;
  /** 0–100. Omit where there is no meaningful ceiling. */
  percent?: number;
  tone?: string;
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

      {percent !== undefined ? (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
        </div>
      ) : null}
    </div>
  );
}
