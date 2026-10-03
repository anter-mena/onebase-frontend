import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/appShell";
import { ErrorScreen } from "@/components/errors/errorScreen";
import { roleFrom } from "@/lib/access";
import { getCurrentUser, initialsFromName } from "@/lib/auth";
import { SIDEBAR_COOKIE_NAME, parseSidebarOpen } from "@/lib/sidebar/state";

/**
 * Every signed-in screen goes through here — the real check, not `proxy.ts`.
 *
 * <p>Asks the backend who is signed in on each load. Three outcomes:
 * - <b>A user</b> → the app, with their name in the sidebar.
 * - <b>401</b> → the session is over (logged out elsewhere, password changed,
 *   account switched off, or simply expired): back to sign in, with the reason
 *   so `proxy.ts` lets them land and clears the dead cookie.
 * - <b>Anything else</b> (backend down, 5xx) → the matching error screen, rather
 *   than an app shell with nobody in it.
 */
export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentUser();

  if (!me.ok) {
    if (me.error.status === 401) redirect("/login?reason=session-expired");
    // 503 is also what apiFetch reports when the backend cannot be reached at all.
    const code = me.error.status === 429 ? 429 : me.error.status === 503 ? 503 : 500;
    return <ErrorScreen code={code} />;
  }

  const cookieStore = await cookies();
  const defaultOpen = parseSidebarOpen(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);
  const user = {
    fullName: me.data.fullName,
    email: me.data.email,
    initials: initialsFromName(me.data.fullName),
    role: roleFrom(me.data.role),
    settings: {
      language: me.data.language,
      timeZone: me.data.timeZone,
      dateFormat: me.data.dateFormat,
      // The ?? fallbacks only matter while an older backend (without these) is still live.
      notifyRenewals: me.data.notifyRenewals ?? true,
      notifyFailedPayments: me.data.notifyFailedPayments ?? true,
      notifyWeeklyDigest: me.data.notifyWeeklyDigest ?? false,
      passwordChangedAt: me.data.passwordChangedAt ?? null,
    },
  };

  return (
    <AppShell defaultOpen={defaultOpen} user={user}>
      {children}
    </AppShell>
  );
}
