import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { PaymentMethodRow } from "@/lib/paymentMethods/types"

/** Configuration → Payment methods: `GET /api/payment-methods`, Admins only. */
export function getPaymentMethods(): Promise<ApiResult<PaymentMethodRow[]>> {
  return apiFetch<PaymentMethodRow[]>("/api/payment-methods", { authenticated: true })
}

/** One method, for the Edit page. A 404 means it does not exist. */
export function getPaymentMethod(id: string): Promise<ApiResult<PaymentMethodRow>> {
  return apiFetch<PaymentMethodRow>(`/api/payment-methods/${encodeURIComponent(id)}`, { authenticated: true })
}
