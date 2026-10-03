"use client";

/*
 * Shared by "Choose a new password" and "Join One Base"; expiresAt comes from
 * the backend when the page checks its link.
 */

import { useEffect, useState } from "react";

/**
 * "Link expires in …", counting down live, under "Back to login".
 *
 * <p>The wording follows how much time is left: days and hours for an
 * invitation (7 days), hours and minutes on its last day, then minutes and
 * seconds in the last hour — which is all a 30-minute reset link ever shows.
 *
 * <p>⚠️ Drawn in the browser only. The server and the browser would compute
 * different "time left" (they run a moment apart), which React reports as a
 * mismatch; so the line is empty for the first instant, at its final height so
 * nothing moves, then fills in.
 */
export function LinkExpiry({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // A timer callback, not a direct setState in the effect body.
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  const left = now === null ? null : new Date(expiresAt).getTime() - now;

  return (
    // -mt-3: sits close under "Back to login" (the column's gap-4 is meant for whole blocks).
    <p className="-mt-3 flex h-4 items-center justify-center text-[0.65rem] text-muted-foreground tabular-nums" aria-live="polite">
      {left === null ? null : left <= 0 ? (
        <span className="text-(--viz-critical)">This link has expired.</span>
      ) : (
        <>Link expires in {formatLeft(left)}</>
      )}
    </p>
  );
}

function formatLeft(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"}, ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
