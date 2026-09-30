import "server-only"

import { apiFetch } from "@/lib/api"

/**
 * Whether the backend answers, asked fresh on every visit.
 *
 * <p>The first screen wired to the real API rather than a sample: it is the
 * smallest possible proof that `BACKEND_URL`, the proxy and `apiFetch` line up,
 * so it goes first and everything after it can assume the pipe works.
 *
 * <p>It asks `/actuator/health`, the one endpoint the backend leaves public —
 * so it needs no sign-in, and it keeps working while the rest of the API sits
 * behind a login.
 *
 * <p>⚠️ Basic version. It reports up/down and how long the answer took; the
 * database, disk and the other services join it as they come online.
 */

export type BackendStatus = {
  /** `UP` when Spring says so; anything else — or no answer at all — is down. */
  online: boolean
  /** What Spring reported, or why there was nothing to report. */
  detail: string
  /** Round trip from this server to the backend, in milliseconds. */
  latencyMs: number
  /** Which backend `BACKEND_URL` points at — the address itself stays server-side. */
  target: "Local" | "Live server" | "Not configured"
  checkedAt: string
}

type Health = { status: string }

export async function getBackendStatus(): Promise<BackendStatus> {
  const started = performance.now()
  const result = await apiFetch<Health>("/actuator/health")
  const latencyMs = Math.round(performance.now() - started)

  return {
    online: result.ok && result.data.status === "UP",
    detail: result.ok ? result.data.status : result.error.message,
    latencyMs,
    target: targetOf(process.env.BACKEND_URL),
    checkedAt: new Date().toISOString(),
  }
}

function targetOf(url: string | undefined): BackendStatus["target"] {
  if (!url) return "Not configured"
  try {
    const { hostname } = new URL(url)
    return hostname === "localhost" || hostname === "127.0.0.1" ? "Local" : "Live server"
  } catch {
    return "Not configured"
  }
}
