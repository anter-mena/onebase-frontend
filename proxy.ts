import { NextResponse, type NextRequest } from "next/server"

import { canOpen, homeFor, roleFrom, type Role } from "@/lib/access"
import { SESSION_COOKIE } from "@/lib/cookieNames"

/**
 * Decides where someone belongs before a single byte of HTML is written.
 *
 * <p>Three kinds of route:
 * - <b>Guest-only</b> — sign in, the password pages, and accepting an invitation. Signed in? Sent to their role's start page.
 * - <b>Open</b> — the error pages. Anyone, either way.
 * - <b>Private</b> — everything else, by default. Signed out? Sent to sign in, with
 *   the page they wanted kept in `?next=` so they land back on it afterwards.
 *   Signed in but the role may not open it (lib/access)? The 403 page.
 *
 * <p>Private is the default on purpose (the LMS learned this): a page added later
 * is protected because nobody did anything, and making one public is a
 * deliberate line here.
 *
 * <p>⚠️ <b>This is not the security boundary.</b> It reads the token's expiry
 * without checking its signature — anyone can forge a cookie that gets past
 * this file. What stops them is the backend, which verifies every request, and
 * the private layout, which asks it who is signed in. This only chooses which
 * screen to build, so a signed-out person never sees the app flash before being
 * thrown out of it.
 */

const GUEST_ONLY = ["/login", "/reset-password", "/accept-invite"]
const OPEN = ["/401", "/403", "/404", "/429", "/500", "/503"]

/**
 * The token's expiry and role, read without verification. Malformed or expired
 * means "no session" — which fails towards sending people to sign in.
 */
function readSession(token: string | undefined): { role: Role } | null {
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number; role?: string }
    if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) return null
    return { role: roleFrom(claims.role) }
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value)
  const go = (to: string) => NextResponse.redirect(new URL(to, request.url))

  if (OPEN.includes(pathname)) {
    return NextResponse.next()
  }

  if (GUEST_ONLY.includes(pathname)) {
    /**
     * A session the backend has ended still looks alive from here — only the
     * backend knows it was logged out elsewhere or its password changed. The
     * private layout finds out, and sends the person here with this reason.
     * They must be allowed to land (or the two would bounce them back and forth
     * forever), and the dead cookie is cleared so it stops looking alive.
     */
    if (request.nextUrl.searchParams.get("reason") === "session-expired") {
      const response = NextResponse.next()
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
    return session ? go(homeFor(session.role)) : NextResponse.next()
  }

  if (!session) {
    const login = new URL("/login", request.url)
    if (pathname !== "/") login.searchParams.set("next", pathname + search)
    return NextResponse.redirect(login)
  }

  if (!canOpen(session.role, pathname)) {
    // "/" is a way in, not a destination: send each role to its own start page.
    if (pathname === "/") return go(homeFor(session.role))
    // Rewritten, not redirected: the address stays what they typed, and the
    // answer is a real 403 — the 403 page, with its "go back" link.
    return NextResponse.rewrite(new URL("/403", request.url), { status: 403 })
  }

  return NextResponse.next()
}

/**
 * Every page request, and nothing else: not `/api` (the backend proxy, which
 * checks its own token), not Next's internals, not files with an extension
 * (images, fonts, the favicon).
 */
export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\.[\\w]+$).*)"],
}
