"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"
import type { WaMessage } from "@/lib/whatsapp/types"

type Result = { ok: true; message: WaMessage } | { ok: false; error: string; windowClosed?: boolean }

/** A text, within the 24-hour window. */
export async function sendWhatsAppText(conversationId: number, text: string): Promise<Result> {
  const result = await apiFetch<WaMessage>(`/api/whatsapp/conversations/${conversationId}/messages`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ text }),
  })
  revalidatePath("/whatsapp-inbox")
  if (!result.ok) return { ok: false, error: result.error.message, windowClosed: result.error.status === 409 }
  return { ok: true, message: result.data }
}

/** The approved template: the only message WhatsApp accepts after 24 hours. */
export async function sendWhatsAppTemplate(conversationId: number): Promise<Result> {
  const result = await apiFetch<WaMessage>(`/api/whatsapp/conversations/${conversationId}/template`, {
    method: "POST",
    authenticated: true,
  })
  revalidatePath("/whatsapp-inbox")
  if (!result.ok) return { ok: false, error: result.error.message }
  return { ok: true, message: result.data }
}
