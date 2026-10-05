import "server-only"

import { getSessionToken } from "@/lib/session"

/**
 * A call to the backend that is not JSON: a file download, or an email with files
 * (multipart). `apiFetch` always speaks JSON, so these two go through here, with
 * the same session token from the httpOnly cookie.
 */
export async function backendRaw(path: string, init: RequestInit = {}): Promise<Response> {
  const base = process.env.BACKEND_URL
  if (!base) return Response.json({ message: "BACKEND_URL is not set." }, { status: 500 })

  const token = await getSessionToken()
  if (!token) return Response.json({ message: "Not signed in." }, { status: 401 })

  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  try {
    return await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" })
  } catch {
    return Response.json({ message: "Could not reach the server. Please try again." }, { status: 503 })
  }
}
