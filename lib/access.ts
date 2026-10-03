/**
 * Who can open what — the one place the frontend decides it.
 *
 * <p>Two roles. <b>Admin</b> sees everything — there can be several, and there
 * must always be at least one. <b>Commercial</b> sees the screens their day is
 * made of: Clients (with each client's page), Renewals, the WhatsApp Inbox and
 * the email Inbox — none of Workspace or Administration. The privileges are
 * fixed, not configurable per person.
 *
 * <p>Read by `proxy.ts` (to answer 403 before a forbidden page renders), the
 * sidebar and navbar (to show only what opens), and the sign-in action (to land
 * each role on a page it may see). No imports, so the proxy can use it too.
 *
 * <p>⚠️ <b>Frontend only, for now.</b> The backend still has its original roles
 * (OWNER, ADMIN, MANAGER) and does not yet refuse anything by role. Until it
 * does, this file decides what is <i>shown</i>, not what is <i>allowed</i>:
 * the real boundary has to be added to each backend endpoint as it is built.
 */

export type Role = "ADMIN" | "COMMERCIAL"

/**
 * The backend's role, in the frontend's two.
 *
 * <p>The backend's OWNER (the first account) and ADMIN are both Admin here.
 * Anything else becomes COMMERCIAL — the smaller set of pages — so an unknown or
 * future role fails closed, never open.
 */
export function roleFrom(backendRole: string | undefined | null): Role {
  return backendRole === "OWNER" || backendRole === "ADMIN" ? "ADMIN" : "COMMERCIAL"
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  COMMERCIAL: "Commercial",
}

/** Each page a Commercial may open, with everything under it (`/clients/12`). */
const COMMERCIAL_PAGES = ["/clients", "/renewals", "/whatsapp-inbox", "/inbox"]

export function canOpen(role: Role, pathname: string): boolean {
  if (role === "ADMIN") return true
  return COMMERCIAL_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
}

/** Where each role lands after signing in, or when it asks for `/`. */
export function homeFor(role: Role): string {
  return role === "ADMIN" ? "/dashboard" : "/clients"
}
