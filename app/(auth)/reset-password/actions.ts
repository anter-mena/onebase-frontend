"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Ask for a reset link (also the "Resend email" button).
 *
 * <p>The backend answers the same whether or not the email has an account, so
 * `ok` here only means "the request went through" — never "this person exists".
 */
export async function requestResetLink(email: string): Promise<ActionResult> {
  const result = await apiFetch("/api/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  })
  if (result.ok) return { ok: true }
  const field = result.error.fieldErrors && Object.values(result.error.fieldErrors)[0]
  return { ok: false, error: field ?? result.error.message }
}

export type NewPasswordState = { error?: string }

/**
 * Set the new password from the emailed link.
 *
 * <p>The backend signs the account out everywhere, so on success the person is
 * sent to sign in with a note saying it worked.
 */
export async function setNewPassword(_previous: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const token = String(formData.get("token") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")
  const confirm = String(formData.get("confirmPassword") ?? "")

  if (newPassword !== confirm) {
    return { error: "The two passwords do not match." }
  }

  const result = await apiFetch("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  })

  if (!result.ok) {
    const field = result.error.fieldErrors && Object.values(result.error.fieldErrors)[0]
    return { error: field ?? result.error.message }
  }

  redirect("/login?reset=done")
}
