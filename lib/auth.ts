import "server-only"

import { canOpen, homeFor, type Role } from "@/lib/access"
import { apiFetch, type ApiResult } from "@/lib/api"

/**
 * The signed-in person, as the backend describes them (`GET /api/auth/me`).
 *
 * <p>Asked fresh on every page load by the private layout — this is the real
 * check that a session is still alive. `proxy.ts` only reads the cookie and
 * cannot know the backend has ended a session.
 */
export type CurrentUser = {
  id: number
  fullName: string
  email: string
  /** ADMIN or COMMERCIAL; read it through `roleFrom` in lib/access. */
  role: string
  language: string
  timeZone: string
  dateFormat: string
  notifyRenewals: boolean
  notifyFailedPayments: boolean
  notifyWeeklyDigest: boolean
  /** When the password was last set; null for an account older than this record. */
  passwordChangedAt: string | null
}

export function getCurrentUser(): Promise<ApiResult<CurrentUser>> {
  return apiFetch<CurrentUser>("/api/auth/me", { authenticated: true })
}

/** "Admin" → "AD", "Amine El Idrissi" → "AE": the tile in the sidebar's user box. */
export function initialsFromName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Where to send someone after signing in, from the `next` the proxy attached.
 *
 * <p>Only paths on this site — `//evil.com` and `https://…` are refused, so the
 * sign-in page cannot be used to bounce someone to another site — and only
 * pages their role may open. Anything else lands on the role's start page:
 * a Commercial who followed an old Dashboard link goes to Clients, not to a 403.
 */
export function safeNextPath(next: unknown, role: Role): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return homeFor(role)
  }
  const pathname = next.split(/[?#]/)[0]
  return canOpen(role, pathname) ? next : homeFor(role)
}
