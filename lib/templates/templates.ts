import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { MessageTemplate } from "@/lib/templates/types"

/** The Templates page: `GET /api/templates`, Admins only, newest change first. */
export function getTemplates(): Promise<ApiResult<MessageTemplate[]>> {
  return apiFetch<MessageTemplate[]>("/api/templates", { authenticated: true })
}

/** One template, for the builder. A 404 means it does not exist. */
export function getTemplate(id: string): Promise<ApiResult<MessageTemplate>> {
  return apiFetch<MessageTemplate>(`/api/templates/${encodeURIComponent(id)}`, { authenticated: true })
}

/** What the WhatsApp inbox can send: the active ones, for Admins and Commercials alike. */
export function getSendableTemplates(): Promise<ApiResult<MessageTemplate[]>> {
  return apiFetch<MessageTemplate[]>("/api/whatsapp/templates", { authenticated: true })
}
