"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"

/** The pencil on "Monthly target": this month's target, in USD. Admins only; logged. */
export async function setMonthlyTarget(target: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiFetch<unknown>("/api/dashboard/target", {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify({ target }),
  })
  if (!result.ok) {
    const field = result.error.fieldErrors && Object.values(result.error.fieldErrors)[0]
    return { ok: false, error: field ?? result.error.message }
  }
  revalidatePath("/dashboard")
  return { ok: true }
}
