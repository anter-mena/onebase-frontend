"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"
import type { PlanPrice } from "@/lib/plans/plans"

export type PriceChange = { devices: number; months: number; price: number }

/**
 * The Save button on Subscriptions: every changed price, together. The backend
 * keeps all of them or none (one invalid price → nothing saved), and writes one
 * Action log line per change.
 */
export async function savePlanPrices(changes: PriceChange[]): Promise<{ ok: true; data: PlanPrice[] } | { ok: false; error: string }> {
  const result = await apiFetch<PlanPrice[]>("/api/plans/prices", {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify({ changes }),
  })
  if (!result.ok) {
    const field = result.error.fieldErrors && Object.values(result.error.fieldErrors)[0]
    return { ok: false, error: field ?? result.error.message }
  }
  revalidatePath("/configuration")
  return { ok: true, data: result.data }
}
