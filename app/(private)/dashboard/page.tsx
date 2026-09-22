import type { Metadata } from "next";

import { DashboardWorkspace } from "@/components/dashboard/dashboardWorkspace";

export const metadata: Metadata = {
  title: "Dashboard | One Base",
};

export default function DashboardPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your One Base workspace at a glance.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Dashboard content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <DashboardWorkspace />
        </div>
      </section>
    </div>
  );
}
