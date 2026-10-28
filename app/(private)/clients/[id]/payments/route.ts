import { revalidatePath } from "next/cache"

import { backendRaw } from "@/lib/inbox/backendRaw"

/**
 * POST /clients/{id}/payments: a payment with its proof (multipart: "payment" JSON
 * + "proofs" files), passed on as it came. The backend saves both or neither.
 *
 * <p>A route rather than a server action because server actions cap a request at
 * 2 MB here, and the proof files go up to 10 MB together (proofUpload.ts).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return Response.json({ message: "Unknown client." }, { status: 400 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ message: "The payment could not be read. Please try again." }, { status: 400 })
  }

  const response = await backendRaw(`/api/clients/${id}/payments`, { method: "POST", body: form })
  const body = await response.text()
  if (response.ok) revalidatePath("/clients", "layout")
  return new Response(body || null, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  })
}
