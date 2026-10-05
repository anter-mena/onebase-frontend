import { backendRaw } from "@/lib/inbox/backendRaw"

/**
 * Formats safe to show inside the page: photos, audio and video only. Never HTML,
 * SVG or anything a browser could run — a file from a stranger in any other format
 * is always a download.
 */
const SHOWABLE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/amr",
  "video/mp4",
  "video/3gpp",
])

/**
 * GET /whatsapp-inbox/media?message=…[&inline=1] — the file of a WhatsApp message.
 * With inline=1 and a showable format it is served to be displayed (a photo, a
 * voice message, a video); otherwise as a download.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get("message") ?? ""
  if (!/^\d+$/.test(id)) return Response.json({ message: "Unknown file." }, { status: 400 })
  const response = await backendRaw(`/api/whatsapp/messages/${id}/media`)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    return Response.json({ message: body?.message ?? "The file could not be downloaded." }, { status: response.status })
  }

  const mediaType = response.headers.get("X-Media-Type") ?? ""
  const baseType = mediaType.split(";")[0].trim().toLowerCase()
  const inline = url.searchParams.get("inline") === "1" && SHOWABLE.has(baseType)

  return new Response(response.body, {
    headers: inline
      ? {
          "Content-Type": mediaType,
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
          // Even shown, it may not run anything or load anything.
          "Content-Security-Policy": "default-src 'none'; sandbox",
          // A message's file never changes: no need to fetch it again on every refresh.
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
