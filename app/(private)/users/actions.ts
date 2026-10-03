"use server"

import { revalidatePath } from "next/cache"

import { apiFetch, type ApiError } from "@/lib/api"
import type { UserRole } from "@/lib/users/types"

/**
 * Everything the Users screens can change. Admins only — the backend refuses
 * anyone else, whatever this file is asked to do.
 *
 * <p>Each action reloads the Users page's data on success, so the table shows
 * the backend's truth rather than a guess made in the browser.
 */

export type ActionResult = { ok: true } | { ok: false; error: string }

function failure(error: ApiError): ActionResult {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return { ok: false, error: field ?? error.message }
}

async function run(path: string, init: RequestInit): Promise<ActionResult> {
  const result = await apiFetch(path, { ...init, authenticated: true })
  if (!result.ok) return failure(result.error)
  revalidatePath("/users")
  return { ok: true }
}

export async function setUserActive(id: number, active: boolean) {
  return run(`/api/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ active }) })
}

export async function resendInvite(id: number) {
  return run(`/api/users/${id}/invitation/resend`, { method: "POST" })
}

export async function cancelInvite(id: number) {
  return run(`/api/users/${id}/invitation`, { method: "DELETE" })
}

export async function inviteUsers(emails: string[], role: UserRole, message: string) {
  return run("/api/users/invitations", {
    method: "POST",
    body: JSON.stringify({ emails, role: role === "Admin" ? "ADMIN" : "COMMERCIAL", message: message.trim() || null }),
  })
}
