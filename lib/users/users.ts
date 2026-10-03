import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import { initialsFromName } from "@/lib/auth"
import type { UserRole, WorkspaceUser } from "@/lib/users/types"

/**
 * Where the Users screen gets its people: `GET /api/users`, Admins only.
 *
 * <p>The backend speaks in its own terms (ADMIN, `createdAt`…); this turns them
 * into the row the table already draws, so the table never learns where its
 * data comes from.
 */

type BackendUser = {
  id: number
  fullName: string
  email: string
  role: "ADMIN" | "COMMERCIAL"
  active: boolean
  invitePending: boolean
  lastActiveAt: string | null
  createdAt: string
}

/**
 * The avatar tints the rest of the app uses, picked by id so a person keeps the
 * same colour on every visit (and on the server and browser alike).
 */
const avatarColors = [
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-cyan-100 text-cyan-800",
  "bg-fuchsia-100 text-fuchsia-800",
  "bg-indigo-100 text-indigo-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
  "bg-lime-100 text-lime-800",
]

const roles: Record<BackendUser["role"], UserRole> = { ADMIN: "Admin", COMMERCIAL: "Commercial" }

export async function getUsers(): Promise<ApiResult<WorkspaceUser[]>> {
  const result = await apiFetch<BackendUser[]>("/api/users", { authenticated: true })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.map((user) => ({
      id: user.id,
      name: user.fullName,
      initials: initialsFromName(user.fullName),
      email: user.email,
      color: avatarColors[user.id % avatarColors.length],
      role: roles[user.role] ?? "Commercial",
      active: user.active,
      invitePending: user.invitePending,
      lastActiveAt: user.lastActiveAt,
      addedAt: user.createdAt.slice(0, 10),
    })),
  }
}
