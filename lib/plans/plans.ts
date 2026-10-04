import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/** One plan of the grid: its price (Subscriptions), and its cost and panel credit (Expenses). USD. */
export type PlanPrice = {
  devices: number
  months: number
  price: number
  /** Null only before the Expenses values exist. */
  cost: number | null
  credits: number | null
  updatedAt: string
}

/** The 16 plans: `GET /api/plans`, Admins only. */
export function getPlans(): Promise<ApiResult<PlanPrice[]>> {
  return apiFetch<PlanPrice[]>("/api/plans", { authenticated: true })
}
