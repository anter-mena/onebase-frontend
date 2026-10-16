import { templateFileResponse } from "@/lib/templates/fileResponse"

/**
 * GET /whatsapp-inbox/template-file?id=…: a file of an active template, for the
 * preview in the Templates window. Here rather than under /templates, which
 * only Admins may open: Commercials send templates too.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!/^\d+$/.test(id)) return Response.json({ message: "Unknown file." }, { status: 400 })
  return templateFileResponse(`/api/whatsapp/templates/files/${id}`)
}
