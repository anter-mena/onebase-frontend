"use client";

import type { CSSProperties, ReactNode } from "react";

import { AppFooter } from "@/components/app-shell/appFooter";
import { AppNavbar } from "@/components/app-shell/appNavbar";
import { AppSidebar } from "@/components/app-shell/appSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePersistedBoolean } from "@/hooks/use-persisted-boolean";

const SIDEBAR_STORAGE_KEY = "onebase:sidebar-open";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = usePersistedBoolean(
    SIDEBAR_STORAGE_KEY,
    true,
  );

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
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
