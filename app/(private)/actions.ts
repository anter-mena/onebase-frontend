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

/**
 * Which sidebar items get the red dot, by their address. Asked by the sidebar on
 * every page change and every minute: real news only — unread WhatsApp messages,
 * unread email in the Inbox, and Renewals clients to act on now (ending soon or a
 * callback; Pending and Inactive are standing lists, not news).
 *
 * <p>A part that cannot be read shows no dot rather than an error: the pages
 * themselves say what went wrong.
 */
export async function getSidebarAlerts(): Promise<Record<string, boolean>> {
  const [whatsapp, inbox, renewals] = await Promise.all([
    apiFetch<{ unread: number }>("/api/whatsapp/status", { authenticated: true }),
    apiFetch<{ folders: { id: string; unread: number }[] }>("/api/inbox/overview", { authenticated: true }),
    apiFetch<{ group: string }[]>("/api/renewals", { authenticated: true }),
  ])
  return {
    "/whatsapp-inbox": whatsapp.ok && whatsapp.data.unread > 0,
    "/inbox": inbox.ok && inbox.data.folders.some((folder) => folder.id === "inbox" && folder.unread > 0),
    "/renewals": renewals.ok && renewals.data.some((row) => row.group === "ENDING_SOON" || row.group === "CALLBACK"),
  }
}
