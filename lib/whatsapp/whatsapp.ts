import "server-only"

import { apiFetch } from "@/lib/api"
import type { WaConversation, WaMessage, WaStatus } from "@/lib/whatsapp/types"

export function getWhatsAppStatus() {
  return apiFetch<WaStatus>("/api/whatsapp/status", { authenticated: true })
}

export function getConversations() {
  return apiFetch<WaConversation[]>("/api/whatsapp/conversations", { authenticated: true })
}

/** Opening a conversation marks it read, here and on the client's phone. */
export function getMessages(conversationId: number) {
  return apiFetch<WaMessage[]>(`/api/whatsapp/conversations/${conversationId}/messages?markRead=true`, { authenticated: true })
}
