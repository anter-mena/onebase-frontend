import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { DashboardOverview, LedgerData } from "@/lib/dashboard/types"

/** The period in the address bar, as the backend reads it. */
function periodQuery(range: string, from?: string, to?: string): URLSearchParams {
  const query = new URLSearchParams({ range })
  if (range === "custom" && from && to) {
    query.set("from", from)
    query.set("to", to)
  }
  return query
}

/** `GET /api/dashboard` — Admins only. */
export function getDashboard(range: string, from?: string, to?: string): Promise<ApiResult<DashboardOverview>> {
  return apiFetch<DashboardOverview>(`/api/dashboard?${periodQuery(range, from, to)}`, { authenticated: true })
}

/** `GET /api/ledger` — every payment received in the period; one account with `methodId`. Admins only. */
export function getLedger(range: string, from?: string, to?: string, methodId?: number): Promise<ApiResult<LedgerData>> {
  const query = periodQuery(range, from, to)
  if (methodId) query.set("methodId", String(methodId))
  return apiFetch<LedgerData>(`/api/ledger?${query}`, { authenticated: true })
}
