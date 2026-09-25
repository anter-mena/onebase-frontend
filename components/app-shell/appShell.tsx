"use client";

import type { CSSProperties, ReactNode } from "react";

import { AppFooter } from "@/components/app-shell/appFooter";
import { AppNavbar } from "@/components/app-shell/appNavbar";
import { AppSidebar } from "@/components/app-shell/appSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * ⚠️ `defaultOpen` comes from the server, which read the cookie — it is not a
 * fallback. The sidebar used to hold its open state in localStorage, which no
 * server can see: the first paint was always "open", and the moment React
 * hydrated it read storage and shut the sidebar in front of the reader. The
 * flash was always there; it only became visible once this page had enough
 * JavaScript to make hydration take a moment.
 *
 * <p>Uncontrolled on purpose. `SidebarProvider` keeps the state itself and
 * writes the cookie on every toggle, so there is nothing for this component to
 * own — a controlled wrapper here is what created the round trip.
 */
export function AppShell({
  children,
  defaultOpen,
}: {
  children: ReactNode;
  defaultOpen: boolean;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "14rem",
          "--sidebar-width-icon": "3.25rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="h-svh min-w-0 overflow-hidden bg-muted/30">
        <AppNavbar />
        <main className="min-h-0 flex-1 overflow-hidden p-4 md:p-6">
          {children}
        </main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
