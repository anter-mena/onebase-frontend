"use server"

import { revalidatePath } from "next/cache"

import { apiFetch, type ApiError } from "@/lib/api"
import type { BackendCardNetwork, BackendProvider, PaymentMethodRow } from "@/lib/paymentMethods/types"

/**
 * Configuration → Payment methods. The backend checks the Admin role and every
 * rule (unique names, the fields); the screens only show its answer.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function failed(error: ApiError): { ok: false; error: string } {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return { ok: false, error: field ?? error.message }
}

export type PaymentMethodDraft = {
  provider: BackendProvider
  name: string
  holder: string
  cardNetwork: BackendCardNetwork
  instructions: string
  active: boolean
}

/** Add (no id) or Edit (with id). */
export async function savePaymentMethod(id: number | null, draft: PaymentMethodDraft): Promise<Result<PaymentMethodRow>> {
  const result = await apiFetch<PaymentMethodRow>(id === null ? "/api/payment-methods" : `/api/payment-methods/${id}`, {
    method: id === null ? "POST" : "PUT",
    authenticated: true,
    body: JSON.stringify(draft),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/configuration")
  return { ok: true, data: result.data }
}

/** Off: the method can't be chosen for new payments. Old payments keep it. */
export async function setPaymentMethodActive(id: number, active: boolean): Promise<Result<PaymentMethodRow>> {
  const result = await apiFetch<PaymentMethodRow>(`/api/payment-methods/${id}/status`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ active }),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/configuration")
  return { ok: true, data: result.data }
}
