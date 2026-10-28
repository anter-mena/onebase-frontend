"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { getSidebarCounts } from "@/app/(private)/actions";

/**
 * How much is waiting in each area, by its address ("/inbox": 3), for everything that
 * shows it: the sidebar's red counts and the header's Inbox dot (2026-10-28). Asked in
 * one place, so the two never disagree and Gmail is asked once, not twice: on every
 * page change, and every minute while the tab is in view.
 */
const NotificationCountsContext = createContext<Record<string, number>>({});

export function NotificationCountsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      getSidebarCounts()
        .then((next) => { if (!cancelled) setCounts(next); })
        .catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname]);

  return <NotificationCountsContext.Provider value={counts}>{children}</NotificationCountsContext.Provider>;
}

export function useNotificationCounts() {
  return useContext(NotificationCountsContext);
}
