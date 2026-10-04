"use server"

import { revalidatePath } from "next/cache"

import { apiFetch, type ApiError } from "@/lib/api"
import type { CreditSummary, PerkRow } from "@/lib/expenses/types"
import type { PlanPrice } from "@/lib/plans/plans"

/**
 * Configuration → Expenses. The backend checks the Admin role and every rule;
 * the screen only shows its answer. Everything is USD.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function failed(error: ApiError): { ok: false; error: string } {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return { ok: false, error: field ?? error.message }
}

async function send<T>(path: string, method: string, body: unknown): Promise<Result<T>> {
  const result = await apiFetch<T>(path, { method, authenticated: true, body: JSON.stringify(body) })
  if (!result.ok) return failed(result.error)
  revalidatePath("/configuration")
  return { ok: true, data: result.data }
}

export type CostChange = { devices: number; months: number; cost: number; credits: number }

/** The Save button on Cost per plan: every change together, all or nothing. */
export async function savePlanCosts(changes: CostChange[]): Promise<Result<PlanPrice[]>> {
  return send<PlanPrice[]>("/api/plans/costs", "PUT", { changes })
}

export type PerkDraft = { name: string; description: string; cost: number }

/** Create (no id) or Edit (with id) a perk. */
export async function savePerk(id: number | null, draft: PerkDraft): Promise<Result<PerkRow>> {
  return send<PerkRow>(id === null ? "/api/perks" : `/api/perks/${id}`, id === null ? "POST" : "PUT", draft)
}

/** Offer a perk, or stop offering it. Nothing is deleted. */
export async function setPerkActive(id: number, active: boolean): Promise<Result<PerkRow>> {
  return send<PerkRow>(`/api/perks/${id}/status`, "PATCH", { active })
}

/** Credits bought, and what they cost. Never edited or deleted. */
export async function topUpCredit(credits: number, amount: number, note: string): Promise<Result<CreditSummary>> {
  return send<CreditSummary>("/api/credit/topups", "POST", { credits, amount, note })
}
