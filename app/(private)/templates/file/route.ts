import { backendRaw } from "@/lib/inbox/backendRaw"
import { templateFileResponse } from "@/lib/templates/fileResponse"

/**
 * POST /templates/file: one file for a template block (multipart field `file`),
 * passed on as it came. Stored at once, so the template only keeps its id. A
 * route rather than a server action: those cap a request at 2 MB.
 */
export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ message: "The file could not be read." }, { status: 400 })
  }
  const file = form.get("file")
  if (!(file instanceof File)) return Response.json({ message: "Choose a file." }, { status: 400 })
  const upload = new FormData()
  upload.append("file", file, file.name)
  const response = await backendRaw("/api/templates/files", { method: "POST", body: upload })
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  })
}

/** GET /templates/file?id=…: a stored file, for the builder's preview. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!/^\d+$/.test(id)) return Response.json({ message: "Unknown file." }, { status: 400 })
  return templateFileResponse(`/api/templates/files/${id}`)
}
