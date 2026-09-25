import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell/appShell";
import { SIDEBAR_COOKIE_NAME, parseSidebarOpen } from "@/lib/sidebar/state";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  /**
   * ⚠️ Read on the server, for the reason the root layout gives about the
   * theme: anything that resolves later — an effect, a hook reading
   * localStorage — renders the default first and corrects it in front of
   * whoever is looking, which for a sidebar means it opens and then shuts.
   *
   * <p>`SidebarProvider` already writes this cookie on every toggle, so there
   * is nothing new to persist here — the state was always available to the
   * server and was simply not being read.
   *
   * <p>⚠️ The cookie name comes from `lib/sidebar/state`, a plain module, not
   * from `components/ui/sidebar`. That one is `"use client"`, and a client
   * module's exports reach a server component as references rather than
   * values — which type-checks, builds, and silently never matches a cookie.
   */
  const cookieStore = await cookies();
  const defaultOpen = parseSidebarOpen(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);

  return <AppShell defaultOpen={defaultOpen}>{children}</AppShell>;
}
