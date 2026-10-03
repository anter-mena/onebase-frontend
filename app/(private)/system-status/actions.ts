"use server"

import { getSystemHealth } from "@/lib/system/health"
import type { SystemHealth } from "@/lib/system/healthTypes"

/**
 * One reading for the page's 5-second poll.
 *
 * <p>A server action rather than a call from the browser: the access token sits
 * in an httpOnly cookie only this server can read, so the browser cannot ask the
 * backend itself.
 */
export async function readSystemHealth(): Promise<{ ok: true; data: SystemHealth } | { ok: false; error: string }> {
  const result = await getSystemHealth()
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error.message }
}
