/**
 * The session cookie's name, on its own so both sides can reach it.
 *
 * <p>`lib/session.ts` is server-only and reads `next/headers`, neither of which
 * exists in `proxy.ts`. Keeping the string here, with no imports at all, means
 * both read one constant instead of two literals that would eventually drift.
 */
export const SESSION_COOKIE = "onebase_session"
