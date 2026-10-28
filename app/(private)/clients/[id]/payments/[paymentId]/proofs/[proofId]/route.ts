import { backendRaw } from "@/lib/inbox/backendRaw"

/** What a browser can show by itself. Everything else (Word, Excel, emails, HEIC…) is a download. */
const PICTURES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/bmp"])
const PDF = "application/pdf"

/**
 * GET /clients/{id}/payments/{paymentId}/proofs/{proofId}: a payment's proof, for
 * "See proof" (a new tab). Pictures and PDFs open in the tab; anything else downloads
 * under its own name. Never run as a page: the type is the one the backend read from
 * the bytes, and the browser may not guess another (nosniff).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string; proofId: string }> },
) {
  const { id, paymentId, proofId } = await params
  if (![id, paymentId, proofId].every((part) => /^\d+$/.test(part))) {
    return Response.json({ message: "Unknown proof." }, { status: 400 })
  }

  const response = await backendRaw(`/api/clients/${id}/payments/${paymentId}/proofs/${proofId}`)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    return Response.json({ message: body?.message ?? "The proof could not be loaded." }, { status: response.status })
  }

  const type = (response.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase()
  // The backend names it ("attachment; filename=…"); shown, it keeps the name for "Save as".
  const disposition = response.headers.get("Content-Disposition") ?? "attachment"
  const common = { "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" }

  if (PICTURES.has(type)) {
    return new Response(response.body, {
      headers: {
        ...common,
        "Content-Type": type,
        "Content-Disposition": disposition.replace(/^attachment/, "inline"),
        // Shown, it may still not run or load anything.
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    })
  }
  if (type === PDF) {
    // ⚠️ No CSP sandbox here: Chrome refuses to open a PDF in a sandboxed page.
    return new Response(response.body, {
      headers: { ...common, "Content-Type": PDF, "Content-Disposition": disposition.replace(/^attachment/, "inline") },
    })
  }
  return new Response(response.body, {
    headers: { ...common, "Content-Type": "application/octet-stream", "Content-Disposition": disposition },
  })
}
