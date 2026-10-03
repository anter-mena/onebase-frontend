import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { SystemHealth } from "@/lib/system/healthTypes"

/**
 * `GET /api/system/health`, Admins only: the server, the containers, the
 * backend and the database in one answer, so the panels describe one moment.
 */
export function getSystemHealth(): Promise<ApiResult<SystemHealth>> {
  return apiFetch<SystemHealth>("/api/system/health", { authenticated: true })
}
