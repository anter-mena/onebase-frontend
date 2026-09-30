import "server-only"

import { cookies } from "next/headers"

/**
 * Where the access token will live once sign-in exists.
 *
 * <p>An httpOnly cookie rather than localStorage: nothing in the browser bundle
 * can read it, so one XSS — or one compromised dependency — cannot walk off
 * with a CRM session. The cost is that every authenticated call to the backend
 * happens server-side, which is why this module is server-only.
 *
 * <p>⚠️ Only the read side for now. Writing and clearing the cookie arrive with
 * the login screen's logic, together with `proxy.ts` (Next 16's name for
 * middleware), which will use it to pick the right screen before rendering.
 */
export const SESSION_COOKIE = "onebase_session"

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null
}
