import type { Metadata } from "next";

import { DashboardWorkspace } from "@/components/dashboard/dashboardWorkspace";
import { LoadError } from "@/components/errors/loadError";
import { getDashboard } from "@/lib/dashboard/dashboard";
import { isSeoRange } from "@/lib/seo/types";

export const metadata: Metadata = {
  title: "Dashboard | One Base",
};

/** The period is in the address bar (?range=…&from=&to=), so the server fetches that period. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const range = isSeoRange(query.range) ? query.range : "month";
  const data = await getDashboard(range, query.from, query.to);

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
        {data.ok ? (
          <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
            <DashboardWorkspace data={data.data} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <LoadError title="The dashboard could not be loaded." reason={data.error.message} />
          </div>
        )}
      </section>
    </div>
  );
}
