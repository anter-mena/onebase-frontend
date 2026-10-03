"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"

export type AcceptState = { error?: string }

/**
 * The invited person chooses their name and password.
 *
 * <p>On success they are sent to sign in with a note saying the account is
 * ready — the backend does not hand out a session here, so the first sign-in is
 * an ordinary one, with the password they just chose.
 */
export async function acceptInvitation(_previous: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "")
  const fullName = String(formData.get("fullName") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirmPassword") ?? "")

  if (password !== confirm) {
    return { error: "The two passwords do not match." }
  }

  const result = await apiFetch("/api/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ token, fullName, password }),
  })

  if (!result.ok) {
    const field = result.error.fieldErrors && Object.values(result.error.fieldErrors)[0]
    return { error: field ?? result.error.message }
  }

  redirect("/login?invite=accepted")
}
