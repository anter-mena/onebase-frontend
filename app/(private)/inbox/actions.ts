"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"

export type MailAction = "read" | "unread" | "star" | "unstar" | "archive" | "junk" | "trash" | "inbox"

/** One change to one email, done in Gmail itself. */
export async function mailAction(
  folder: string,
  id: string,
  action: MailAction
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d+$/.test(id)) return { ok: false, error: "Unknown email." }
  const result = await apiFetch<null>(`/api/inbox/messages/${id}/actions`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ folder, action }),
  })
  if (!result.ok) return { ok: false, error: result.error.message }
  revalidatePath("/inbox")
  return { ok: true }
}
