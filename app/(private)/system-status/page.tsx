import type { Metadata } from "next";

import { SystemOverview } from "@/components/system-status/systemOverview";
import { getSystemHealth } from "@/lib/system/health";

export const metadata: Metadata = {
  title: "System status | One Base",
};

/**
 * How One Base and the server under it are doing — Admins only (lib/access on
 * this side, `anyRequest().hasRole("ADMIN")` on the backend).
 *
 * <p>The first reading is taken here, so the page opens with real figures
 * instead of a spinner; the browser then asks again every five seconds. A
 * failure is not fatal: the page says why and keeps trying — which matters
 * most exactly when the backend is unwell, the moment someone opens this page.
 */
export default async function SystemStatusPage() {
  const first = await getSystemHealth();

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">System status</h1>
        <p className="mt-1 text-xs text-muted-foreground">How One Base and the server under it are doing.</p>
      </header>

      <section className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background" aria-label="System status content">
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable] lg:overflow-hidden">
          <SystemOverview initial={first.ok ? first.data : null} initialError={first.ok ? null : first.error.message} />
        </div>
      </section>
    </div>
  );
}
