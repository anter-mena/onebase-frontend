import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/**
 * The signed-in person, as the backend describes them (`GET /api/auth/me`).
 *
 * <p>Asked fresh on every page load by the private layout — this is the real
 * check that a session is still alive. `proxy.ts` only reads the cookie and
 * cannot know the backend has ended a session.
 */
export type SessionUser = {
  id: number
  fullName: string
  email: string
  role: "OWNER" | "ADMIN" | "MANAGER"
  language: string
  timeZone: string
  dateFormat: string
}

export function getCurrentUser(): Promise<ApiResult<SessionUser>> {
  return apiFetch<SessionUser>("/api/auth/me", { authenticated: true })
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
 * <p>Only paths on this site: `//evil.com` and `https://…` are refused, so the
 * sign-in page cannot be used to bounce someone to another site.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/dashboard"
  }
  return next
}
