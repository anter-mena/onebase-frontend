/**
 * Whether the sidebar is open, kept where the server can see it.
 *
 * <p>⚠️ <b>A plain module, deliberately — not part of `components/ui/sidebar`.</b>
 * That file is `"use client"`, and every export of a client module read from a
 * server component comes back as a client <i>reference</i> rather than its
 * value. Importing the cookie name from there looked right, type-checked, built
 * cleanly, and handed `cookies().get()` an object instead of "sidebar_state" —
 * so the lookup missed every time and the sidebar was always open. The same
 * shape as `lib/theme/themes.ts`, which is a plain module for exactly this
 * reason.
 *
 * <p>The sidebar keeps its own state and writes this cookie on every toggle;
 * the private layout reads it so the first HTML already has the sidebar in the
 * right position. Anything that resolves later — an effect, a hook reading
 * localStorage — renders the default and corrects it in front of whoever is
 * looking, which for a sidebar means it opens and then shuts.
 */

export const SIDEBAR_COOKIE_NAME = "sidebar_state"

/** A week. Long enough to be a preference, short enough to lapse. */
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

/**
 * Open unless the cookie explicitly says otherwise.
 *
 * <p>A first visit has no cookie and should get the sidebar rather than a bare
 * rail, so only the exact string "false" closes it.
 */
export function parseSidebarOpen(value: string | undefined): boolean {
  return value !== "false"
}
