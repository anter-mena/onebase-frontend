import { revalidatePath } from "next/cache"

import { backendRaw } from "@/lib/inbox/backendRaw"

/**
 * POST /whatsapp-inbox/file?conversation=…: one file (and an optional caption) to send,
 * passed on as it came. A route rather than a server action: those cap a request at 1 MB.
 */
export async function POST(request: Request) {
  const id = new URL(request.url).searchParams.get("conversation") ?? ""
  if (!/^\d+$/.test(id)) return Response.json({ message: "Unknown conversation." }, { status: 400 })
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ message: "The file could not be read." }, { status: 400 })
  }
  const caption = form.get("caption")
  const query = typeof caption === "string" && caption.trim() ? `?caption=${encodeURIComponent(caption.trim())}` : ""
  const upload = new FormData()
  const file = form.get("file")
  if (file instanceof File) upload.append("file", file, file.name)
  const response = await backendRaw(`/api/whatsapp/conversations/${id}/files${query}`, { method: "POST", body: upload })
  revalidatePath("/whatsapp-inbox")
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  })
}
