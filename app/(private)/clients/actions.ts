"use server"

import { revalidatePath } from "next/cache"

import { apiFetch, type ApiError } from "@/lib/api"
import type { ApiClient, ApiPayment, ClientDraft, NewPayment } from "@/lib/clients/types"

/**
 * Clients: edit, the note, delete. There is no add — a client is made by their
 * first WhatsApp message. The backend checks every rule (one client
 * per number, the country code, Admins only for delete); the screens show its answer.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function failed(error: ApiError): { ok: false; error: string } {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return { ok: false, error: field ?? error.message }
}

/** Edit: the left card of the client page. */
export async function saveClient(id: number, draft: ClientDraft): Promise<Result<{ id: number }>> {
  const result = await apiFetch<ApiClient>(`/api/clients/${id}`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(draft),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/clients", "layout")
  return { ok: true, data: { id: result.data.id } }
}

/** Empty removes the note. */
export async function saveClientNote(id: number, note: string): Promise<Result<{ note: string }>> {
  const result = await apiFetch<ApiClient>(`/api/clients/${id}/note`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify({ note }),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/clients", "layout")
  return { ok: true, data: { note: result.data.note ?? "" } }
}

/**
 * A payment. The backend prices it from Configuration, spends the panel credit
 * and makes the client Active; `warning` is set when the credit went below zero.
 */
export async function addPayment(clientId: number, payment: NewPayment): Promise<Result<{ warning: string | null }>> {
  const result = await apiFetch<{ payment: ApiPayment; warning: string | null }>(`/api/clients/${clientId}/payments`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payment),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/clients", "layout")
  return { ok: true, data: { warning: result.data.warning } }
}

/** Admins only. Soft and logged: it leaves every total, and its panel credits come back. */
export async function deletePayment(paymentId: string): Promise<Result<null>> {
  if (!/^\d+$/.test(paymentId)) return { ok: false, error: "Unknown payment." }
  const result = await apiFetch<unknown>(`/api/payments/${paymentId}`, { method: "DELETE", authenticated: true })
  if (!result.ok) return failed(result.error)
  revalidatePath("/clients", "layout")
  return { ok: true, data: null }
}

/** Admins only. Soft: their past payments still count. */
export async function deleteClient(id: number): Promise<Result<null>> {
  const result = await apiFetch<unknown>(`/api/clients/${id}`, { method: "DELETE", authenticated: true })
  if (!result.ok) return failed(result.error)
  revalidatePath("/clients", "layout")
  return { ok: true, data: null }
}
