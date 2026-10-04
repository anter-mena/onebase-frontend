import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { CreditSummary, PerkRow } from "@/lib/expenses/types"

/** Expenses → Perks: `GET /api/perks`, Admins only. */
export function getPerks(): Promise<ApiResult<PerkRow[]>> {
  return apiFetch<PerkRow[]>("/api/perks", { authenticated: true })
}

/** Expenses → Panel credit: `GET /api/credit`, Admins only. */
export function getCredit(): Promise<ApiResult<CreditSummary>> {
  return apiFetch<CreditSummary>("/api/credit", { authenticated: true })
}
