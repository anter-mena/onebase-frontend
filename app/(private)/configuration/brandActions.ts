"use server"

import { revalidatePath } from "next/cache"

import type { BrandLookup, BrandRow, Socials } from "@/lib/brands/types"
import { apiFetch, type ApiError } from "@/lib/api"

/**
 * Configuration → Brands. Each calls the backend, which checks the Admin role
 * and every rule (duplicates, social links, the logo, the website safety
 * layer); the screen only shows its answer.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function failed(error: ApiError): { ok: false; error: string } {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return { ok: false, error: field ?? error.message }
}

/** Reads a website: name, social links and logo. Saves nothing. */
export async function lookUpBrand(url: string): Promise<Result<BrandLookup>> {
  const result = await apiFetch<BrandLookup>("/api/brands/lookup", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ url }),
  })
  return result.ok ? { ok: true, data: result.data } : failed(result.error)
}

export type BrandDraft = {
  websiteUrl: string
  name: string
  socials: Socials
  /** A new logo as a data: address; null keeps the current one (Edit) or means none (Add). */
  logo: string | null
  removeLogo?: boolean
  /** "Fetch again" was used before saving — the Action log says so. */
  fetchedFromSite?: boolean
  /** The GA4 property number for the SEO page; "" = none. */
  ga4PropertyId?: string
}

/** Add (no id) or Edit (with id). */
export async function saveBrand(id: number | null, draft: BrandDraft): Promise<Result<BrandRow>> {
  const result = await apiFetch<BrandRow>(id === null ? "/api/brands" : `/api/brands/${id}`, {
    method: id === null ? "POST" : "PUT",
    authenticated: true,
    body: JSON.stringify(draft),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/configuration")
  return { ok: true, data: result.data }
}

/** Off: the brand can't be chosen for new clients or payments. Nothing is deleted. */
export async function setBrandActive(id: number, active: boolean): Promise<Result<BrandRow>> {
  const result = await apiFetch<BrandRow>(`/api/brands/${id}/status`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ active }),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/configuration")
  return { ok: true, data: result.data }
}
