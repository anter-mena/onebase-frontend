"use server"

import { revalidatePath } from "next/cache"

import { apiFetch, type ApiError } from "@/lib/api"
import type { MessageTemplate, TemplateInput } from "@/lib/templates/types"

/**
 * Templates: add, edit, switch on or off. There is no delete — a template is
 * switched off instead. The backend checks the Admin role and every rule
 * (`TemplateRules`, the same as `lib/templates/rules.ts`); the screens show its answer.
 * Files are not here: they go up through the `/templates/file` route first.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function failed(error: ApiError): { ok: false; error: string } {
  const field = error.fieldErrors && Object.values(error.fieldErrors)[0]
  return { ok: false, error: field ?? error.message }
}

export async function createTemplate(input: TemplateInput): Promise<Result<MessageTemplate>> {
  const result = await apiFetch<MessageTemplate>("/api/templates", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(input),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/templates", "layout")
  return { ok: true, data: result.data }
}

export async function updateTemplate(id: number, input: TemplateInput): Promise<Result<MessageTemplate>> {
  const result = await apiFetch<MessageTemplate>(`/api/templates/${id}`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(input),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/templates", "layout")
  return { ok: true, data: result.data }
}

/** Off: it stays in the list but can't be sent from the inbox any more. */
export async function setTemplateActive(id: number, active: boolean): Promise<Result<null>> {
  const result = await apiFetch<unknown>(`/api/templates/${id}/status`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ active }),
  })
  if (!result.ok) return failed(result.error)
  revalidatePath("/templates", "layout")
  return { ok: true, data: null }
}
