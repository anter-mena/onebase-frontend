import "server-only"

import { cookies } from "next/headers"

import { SESSION_COOKIE } from "@/lib/cookieNames"

/**
 * Where the access token lives.
 *
 * <p>An httpOnly cookie rather than localStorage: nothing in the browser bundle
 * can read it, so one XSS — or one compromised dependency — cannot walk off
 * with a CRM session. The cost is that every authenticated call to the backend
 * happens server-side, which is why this module is server-only.
 *
 * <p>The cookie only carries the token. Whether the session is still good is
 * the backend's call on every request — it can end a session (log out, password
 * change, account switched off) while this cookie still looks alive.
 */
export { SESSION_COOKIE }

const isProduction = process.env.NODE_ENV === "production"

export async function createSession(token: string, expiresInSeconds: number) {
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // `lax` still sends the cookie on top-level navigations, which is what makes
    // the redirect straight after sign-in land already authenticated.
    sameSite: "lax",
    // Off in development only because localhost is plain HTTP and a `secure`
    // cookie would never be stored there. Vercel is HTTPS, so it is on in production.
    secure: isProduction,
    path: "/",
    maxAge: expiresInSeconds,
  })
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null
}

export async function destroySession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}
