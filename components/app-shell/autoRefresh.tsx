"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps a page's data fresh while it is open: asks the server for the page
 * again every few seconds (and when the tab comes back into view), and React
 * swaps in only what changed — filters, sorting and the open page stay as they
 * are.
 *
 * <p>Polling, not a live connection: the frontend runs on Vercel, which does not
 * keep long-lived connections open, and a few seconds is quick enough for an
 * admin screen. Paused while the tab is hidden, so a forgotten tab costs nothing.
 */
export function AutoRefresh({ everyMs = 10_000 }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, everyMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [everyMs, router]);

  return null;
}
