import "server-only"

import type { ActionKind, LogEntry, TargetKind } from "@/lib/action-log/types"
import { apiFetch, type ApiResult } from "@/lib/api"
import { initialsFromName } from "@/lib/auth"

/**
 * Where the Action log gets its lines: `GET /api/action-log`, Admins only,
 * newest first (the latest 1000 — the table filters and pages them here).
 *
 * <p>The backend speaks in its own terms (SIGNED_IN, PAYMENT_METHOD…); this
 * turns them into the row the table already draws.
 */

type BackendEntry = {
  id: number
  at: string
  userId: number | null
  actor: string
  action: "CREATED" | "UPDATED" | "ACTIVATED" | "DEACTIVATED" | "DELETED" | "EXPORTED" | "SIGNED_IN"
  targetType: "CLIENT" | "BRAND" | "PAYMENT_METHOD" | "SUBSCRIPTION" | "WORKSPACE" | "USER" | "PERK" | "PANEL_CREDIT"
  targetId: number | null
  targetName: string
  detail: string | null
  source: "WEB" | "MOBILE" | "API"
  ip: string | null
}

const actions: Record<BackendEntry["action"], ActionKind> = {
  CREATED: "Created",
  UPDATED: "Updated",
  ACTIVATED: "Activated",
  DEACTIVATED: "Deactivated",
  DELETED: "Deleted",
  EXPORTED: "Exported",
  SIGNED_IN: "Signed in",
}

const targets: Record<BackendEntry["targetType"], TargetKind> = {
  CLIENT: "Client",
  BRAND: "Brand",
  PAYMENT_METHOD: "Payment method",
  SUBSCRIPTION: "Subscription",
  WORKSPACE: "Workspace",
  USER: "User",
  PERK: "Perk",
  PANEL_CREDIT: "Panel credit",
}

const sources: Record<BackendEntry["source"], LogEntry["source"]> = { WEB: "Web", MOBILE: "Mobile", API: "API" }

/** The same tints, picked the same way (by user id), as the Users screen — one person, one colour. */
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

export async function getActionLog(): Promise<ApiResult<LogEntry[]>> {
  const result = await apiFetch<BackendEntry[]>("/api/action-log", { authenticated: true })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.map((entry) => ({
      id: entry.id,
      at: entry.at,
      actor: entry.actor,
      initials: initialsFromName(entry.actor),
      color: avatarColors[(entry.userId ?? 0) % avatarColors.length],
      action: actions[entry.action] ?? "Updated",
      targetKind: targets[entry.targetType] ?? "Workspace",
      targetName: entry.targetName,
      detail: entry.detail ?? "",
      source: sources[entry.source] ?? "Web",
      ip: entry.ip ?? "",
    })),
  }
}
