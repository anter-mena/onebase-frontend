import { backendRaw } from "@/lib/inbox/backendRaw"

/**
 * GET /inbox/attachment?folder=…&id=…&index=… — one file of an email, as a download.
 *
 * <p>Through this app rather than straight to the backend, because the access
 * token lives in an httpOnly cookie only this server can read.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id") ?? ""
  const index = url.searchParams.get("index") ?? ""
  const folder = url.searchParams.get("folder") ?? "inbox"
  if (!/^\d+$/.test(id) || !/^\d+$/.test(index)) {
    return Response.json({ message: "Unknown file." }, { status: 400 })
  }

  const response = await backendRaw(
    `/api/inbox/messages/${id}/attachments/${index}?folder=${encodeURIComponent(folder)}`
  )
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    return Response.json({ message: body?.message ?? "The file could not be downloaded." }, { status: response.status })
  }

  return new Response(response.body, {
    headers: {
      // Always a download, never shown in the page.
      "Content-Type": "application/octet-stream",
      "Content-Disposition": response.headers.get("Content-Disposition") ?? "attachment",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  })
}
