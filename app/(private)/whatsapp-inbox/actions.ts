"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"
import { getSendableTemplates } from "@/lib/templates/templates"
import type { MessageTemplate } from "@/lib/templates/types"
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

/**
 * The saved templates (the Templates page), for the composer's Templates window.
 * Asked when the window opens rather than with the page, which reloads every 5 seconds.
 */
export async function listSendableTemplates(): Promise<{ ok: true; templates: MessageTemplate[] } | { ok: false; error: string }> {
  const result = await getSendableTemplates()
  if (!result.ok) return { ok: false, error: result.error.message }
  return { ok: true, templates: result.data }
}

/**
 * A saved template, sent as ordinary messages (texts, files, buttons) one after
 * the other, so within the 24-hour window only. Several pieces can take ~10 seconds.
 */
export async function sendSavedTemplate(
  conversationId: number,
  templateId: number,
): Promise<{ ok: true; messages: WaMessage[] } | { ok: false; error: string; windowClosed?: boolean }> {
  const result = await apiFetch<WaMessage[]>(`/api/whatsapp/conversations/${conversationId}/templates/${templateId}`, {
    method: "POST",
    authenticated: true,
  })
  revalidatePath("/whatsapp-inbox")
  if (!result.ok) return { ok: false, error: result.error.message, windowClosed: result.error.status === 409 }
  return { ok: true, messages: result.data }
}
