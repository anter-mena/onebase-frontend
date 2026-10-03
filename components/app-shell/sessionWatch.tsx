"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { checkSession } from "@/app/(private)/actions";

/** How often an open tab asks, while it is being looked at. */
const EVERY_MS = 15_000;

/**
 * Notices, without a reload, that this session was ended somewhere else —
 * switched off by an Admin, signed out by a password change on another device,
 * or simply expired.
 *
 * <p>Moving between pages does not run the private layout again, so on its own
 * the app would only find out at the next full reload. This asks on every page
 * change, every 15 seconds while the tab is visible, and when the tab comes
 * back into view; an ended session goes to sign in with the reason shown.
 *
 * <p>A full navigation (not the router): the dead cookie has to be cleared by
 * proxy.ts, and nothing from the old session should stay on screen.
 */
export function SessionWatch() {
  const pathname = usePathname();
  const leaving = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (leaving.current || document.visibilityState !== "visible") return;
      try {
        const { ended } = await checkSession();
        if (ended && !cancelled && !leaving.current) {
          leaving.current = true;
          // A full load on purpose (see above): router.push would keep the old session's screens in memory.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/login?reason=session-expired");
        }
      } catch {
        // Offline or a deploy in progress: try again on the next tick.
      }
    };

    void check();
    const interval = window.setInterval(check, EVERY_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [pathname]);

  return null;
}
