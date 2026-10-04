import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/** One price of the Subscriptions grid, in USD. */
export type PlanPrice = {
  devices: number
  months: number
  price: number
  updatedAt: string
}

/** The 16 plans: `GET /api/plans`, Admins only. */
export function getPlans(): Promise<ApiResult<PlanPrice[]>> {
  return apiFetch<PlanPrice[]>("/api/plans", { authenticated: true })
}
