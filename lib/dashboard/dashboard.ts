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
export async function getDashboard(range: string, from?: string, to?: string): Promise<ApiResult<DashboardOverview>> {
  const result = await apiFetch<DashboardOverview>(`/api/dashboard?${periodQuery(range, from, to)}`, { authenticated: true })
  if (!result.ok) return result
  // A backend from before the cash view (2026-10-16) sends no breakdown: 0, not undefined.
  const totals = result.data.totals
  return { ok: true, data: { ...result.data, totals: { ...totals, topups: totals.topups ?? 0, perks: totals.perks ?? 0 } } }
}

/** `GET /api/ledger` — every payment received in the period; one account with `methodId`. Admins only. */
export async function getLedger(range: string, from?: string, to?: string, methodId?: number): Promise<ApiResult<LedgerData>> {
  const query = periodQuery(range, from, to)
  if (methodId) query.set("methodId", String(methodId))
  const result = await apiFetch<LedgerData>(`/api/ledger?${query}`, { authenticated: true })
  if (!result.ok) return result
  // A backend from before the cash view (2026-10-16) sends no top-ups nor cash totals: worked out
  // from the payments alone, so the page still reads right.
  const data = result.data
  const topups = data.topups ?? []
  const moneyIn = data.moneyIn ?? data.rows.reduce((sum, row) => sum + row.payment.amount, 0)
  const moneyOut =
    data.moneyOut ??
    topups.reduce((sum, topup) => sum + topup.amount, 0) + data.rows.reduce((sum, row) => sum + row.payment.perksCost, 0)
  return { ok: true, data: { ...data, topups, moneyIn, moneyOut, net: data.net ?? moneyIn - moneyOut } }
}
