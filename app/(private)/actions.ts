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
