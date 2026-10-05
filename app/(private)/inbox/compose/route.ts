import { revalidatePath } from "next/cache"

import { backendRaw } from "@/lib/inbox/backendRaw"

/**
 * POST /inbox/compose?kind=send|draft — an email with its files, passed on to the
 * backend as it came (multipart: "message" JSON + "files").
 *
 * <p>A route rather than a server action because server actions cap a request at
 * 1 MB, and attachments go up to 18 MB.
 */
export async function POST(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") === "draft" ? "drafts" : "send"

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ message: "The email could not be read." }, { status: 400 })
  }

  const response = await backendRaw(`/api/inbox/${kind}`, { method: "POST", body: form })
  const body = await response.text()
  revalidatePath("/inbox")
  return new Response(body || null, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  })
}
