"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import { destroySession } from "@/lib/session"

/**
 * Sign out.
 *
 * <p>Two halves, and both matter: the backend ends the session (so the token is
 * dead even if someone copied it), then the cookie is deleted here. If the
 * backend cannot be reached the cookie still goes — the person asked to leave,
 * and they will.
 */
export async function logout() {
  await apiFetch("/api/auth/logout", { method: "POST", authenticated: true })
  await destroySession()
  redirect("/login")
}

/**
 * Is this session still alive? Asked by the shell's SessionWatch on every page
 * change and every few seconds, because moving between pages does not run the
 * private layout again — without this, someone switched off by an Admin could
 * keep clicking around until they reloaded.
 *
 * <p>Only "ended" (401) counts. The backend being down for a moment is not a
 * reason to throw someone out.
 */
export async function checkSession(): Promise<{ ended: boolean }> {
  const result = await apiFetch("/api/auth/me", { authenticated: true })
  return { ended: !result.ok && result.error.status === 401 }
}

export type ActionResult = { ok: true } | { ok: false; error: string }

function firstError(error: { message: string; fieldErrors?: Record<string, string> }): string {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return field ?? error.message
}

export type AccountSettings = {
  fullName: string
  language: string
  timeZone: string
  dateFormat: string
  notifyRenewals: boolean
  notifyFailedPayments: boolean
  notifyWeeklyDigest: boolean
}

/** Account settings → General → Save. */
export async function saveAccountSettings(settings: AccountSettings): Promise<ActionResult> {
  const result = await apiFetch("/api/auth/me", {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ ...settings, fullName: settings.fullName.trim() }),
  })
  return result.ok ? { ok: true } : { ok: false, error: firstError(result.error) }
}

/**
 * Account settings → Security → Change password. The backend keeps this device
 * signed in and signs out every other one.
 */
export async function changePassword(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResult> {
  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: "The two new passwords do not match." }
  }
  const result = await apiFetch("/api/auth/password/change", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ currentPassword: input.currentPassword, newPassword: input.newPassword }),
  })
  return result.ok ? { ok: true } : { ok: false, error: firstError(result.error) }
}
