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
 *
 * <p>The header is drawn by `SystemOverview`, because the tabs sit in it (as on
 * Configuration) and they are state the browser owns.
 */
export default async function SystemStatusPage() {
  const first = await getSystemHealth();

  return <SystemOverview initial={first.ok ? first.data : null} initialError={first.ok ? null : first.error.message} />;
}
