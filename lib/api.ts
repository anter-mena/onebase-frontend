import "server-only"

import { headers } from "next/headers"

import { getSessionToken } from "@/lib/session"

/**
 * Server-side calls to the backend.
 *
 * <p>The one place a page or server action asks the Spring Boot API for
 * anything. The browser never talks to the backend directly — it calls this
 * app, which forwards from the server — so the backend address stays out of
 * the client bundle and the access token can stay in an httpOnly cookie.
 *
 * <p>Which backend is answered by `BACKEND_URL` alone (see `.env.example`):
 * swapping one line in `.env.local` moves the whole app between the local and
 * the live API, and nothing here changes.
 *
 * <p>Never throws. Every outcome — success, a refusal, the backend being down —
 * comes back as an {@link ApiResult}, so a screen handles all three the same way.
 */
const BACKEND_URL = process.env.BACKEND_URL

/** What every failure looks like, whatever the backend said or did not say. */
export type ApiError = {
  status: number
  error: string
  message: string
  path?: string
  fieldErrors?: Record<string, string>
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { authenticated?: boolean } = {}
): Promise<ApiResult<T>> {
  if (!BACKEND_URL) {
    return {
      ok: false,
      error: {
        status: 500,
        error: "Configuration",
        message: "BACKEND_URL is not set. Copy .env.example to .env.local.",
      },
    }
  }

  const { authenticated, headers, ...rest } = init
  const requestHeaders = new Headers(headers)
  requestHeaders.set("Content-Type", "application/json")
  await passCallerAlong(requestHeaders)

  if (authenticated) {
    const token = await getSessionToken()
    if (!token) {
      return {
        ok: false,
        error: { status: 401, error: "Unauthorized", message: "Not signed in." },
      }
    }
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      // Per-user answers from a CRM must never be cached between people.
      cache: "no-store",
    })
  } catch {
    // The backend being unreachable is a normal operational state, not a crash.
    return {
      ok: false,
      error: {
        status: 503,
        error: "Service Unavailable",
        message: "Could not reach the server. Please try again.",
      },
    }
  }

  const body = await response.text()
  const parsed = body ? safeJson(body) : null

  if (!response.ok) {
    return {
      ok: false,
      error: {
        status: response.status,
        error: parsed?.error ?? response.statusText,
        message: parsed?.message || "Something went wrong. Please try again.",
        path: parsed?.path,
        fieldErrors: parsed?.fieldErrors,
      },
    }
  }

  return { ok: true, data: parsed as T }
}

/**
 * The person's own address and browser, for the backend's sign-in records and
 * Action log ("Signed in from a new device"). Without this the backend would
 * only ever see this server. Outside a request (at build time) there is no
 * caller, and nothing is added.
 */
async function passCallerAlong(outgoing: Headers) {
  try {
    const incoming = await headers()
    const forwarded = incoming.get("x-forwarded-for")
    const agent = incoming.get("user-agent")
    if (forwarded && !outgoing.has("X-Forwarded-For")) outgoing.set("X-Forwarded-For", forwarded)
    if (agent && !outgoing.has("User-Agent")) outgoing.set("User-Agent", agent)
  } catch {
    // Not inside a request.
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
