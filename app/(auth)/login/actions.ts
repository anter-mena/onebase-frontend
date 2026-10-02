"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import { safeNextPath } from "@/lib/auth"
import { createSession } from "@/lib/session"

export type LoginState = {
  /** One sentence for the form, straight from the backend when it has one. */
  error?: string
  /** Kept so a failed attempt does not wipe what was typed. */
  email?: string
}

type LoginResponse = { accessToken: string; expiresIn: number }

/**
 * Sign in.
 *
 * <p>Runs on the server: the browser posts the form here, this calls the
 * backend, and the token goes straight into the httpOnly cookie — the browser
 * never holds it. The backend's own messages are shown as they are: "Invalid
 * email or password." for a wrong password or unknown email alike, and the
 * lock message after 5 wrong tries.
 */
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  const forwarded = (await headers()).get("x-forwarded-for")
  const result = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    // So the backend's session list records the person's address, not this server's.
    headers: forwarded ? { "X-Forwarded-For": forwarded } : undefined,
  })

  if (!result.ok) {
    const field = result.error.fieldErrors && Object.values(result.error.fieldErrors)[0]
    return { error: field ?? result.error.message, email }
  }

  await createSession(result.data.accessToken, result.data.expiresIn)
  // Outside any try/catch: redirect() works by throwing.
  redirect(safeNextPath(formData.get("next")))
}
