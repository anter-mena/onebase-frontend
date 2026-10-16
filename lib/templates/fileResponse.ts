import "server-only"

import { backendRaw } from "@/lib/inbox/backendRaw"

/**
 * Formats a template's file may be shown in the page in: its photos and its
 * audio. Anything else (the PDF) is a download.
 */
const SHOWABLE = new Set([
  "image/jpeg",
  "image/png",
  "audio/mpeg",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/amr",
])

/**
 * A template's file from the backend, passed on to the browser: shown inline
 * when it is a photo or an audio, otherwise downloaded. Used by the builder
 * (`/templates/file`) and the inbox's picker (`/whatsapp-inbox/template-file`).
 */
export async function templateFileResponse(backendPath: string): Promise<Response> {
  const response = await backendRaw(backendPath)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    return Response.json({ message: body?.message ?? "The file could not be loaded." }, { status: response.status })
  }

  const mediaType = response.headers.get("Content-Type") ?? ""
  const baseType = mediaType.split(";")[0].trim().toLowerCase()

  return new Response(response.body, {
    headers: SHOWABLE.has(baseType)
      ? {
          "Content-Type": baseType,
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
          // Even shown, it may not run anything or load anything.
          "Content-Security-Policy": "default-src 'none'; sandbox",
          // A stored file never changes (a new upload is a new id).
          "Cache-Control": "private, max-age=3600",
        }
      : {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": response.headers.get("Content-Disposition") ?? "attachment",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store",
        },
  })
}
