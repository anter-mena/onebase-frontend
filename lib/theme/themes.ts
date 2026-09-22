/**
 * Which palette the workspace is wearing, and whether it is in light or dark.
 *
 * <p>Two independent choices, deliberately. The palette says which colours;
 * the mode says which half of that palette. Every theme in `app/themes.css`
 * ships both halves, so the two can be set without consulting each other —
 * which is what lets the navbar carry a plain light/dark toggle while the
 * palette lives in the settings window.
 *
 * <p><b>Cookies, not `localStorage` — the same call `inboxLayout.ts` makes and
 * for the same reason.</b> Both have to be correct in the very first HTML or
 * the whole application paints one way and repaints another, which is a flash
 * across every pixel on screen rather than a pane quietly resizing.
 * `localStorage` cannot be read while the page renders on the server; a cookie
 * travels with the request.
 *
 * <p>⚠️ Which is also why {@link usePersistedChoice} is the wrong tool here even
 * though it looks like an exact fit. It returns the default during server
 * rendering by design, so wiring either of these through it would build in the
 * very flash this avoids.
 *
 * <p>The values themselves live in `app/themes.css`, not here. Tailwind v4 is
 * CSS-first, and a palette in TypeScript would be a second copy to keep in step
 * with the one the browser actually uses.
 */

export const themes = [
  { id: "default", label: "Default" },
  { id: "claude", label: "Claude" },
  { id: "caffeine", label: "Caffeine" },
  { id: "darkmatter", label: "Darkmatter" },
  { id: "mono", label: "Mono" },
  { id: "supabase", label: "Supabase" },
  { id: "sage-garden", label: "Sage Garden" },
  { id: "twitter", label: "Twitter" },
  { id: "sunset-horizon", label: "Sunset Horizon" },
] as const satisfies readonly { id: string; label: string }[]

export type Theme = (typeof themes)[number]
export type ThemeId = Theme["id"]

/** Light ink or dark ink. Not a third "system" option — see `useTheme`. */
export type ThemeMode = "light" | "dark"

/** What a browser with no cookie, or a nonsense one, gets. */
export const DEFAULT_THEME: ThemeId = "default"

/**
 * ⚠️ <b>This is the server's assumption, not the first-visit behaviour.</b>
 *
 * <p>A first visit follows the operating system — see {@link MODE_INIT_SCRIPT}.
 * The server cannot know `prefers-color-scheme`, since it is never sent with a
 * request, so it renders light and a script corrects it before anything is
 * painted. Nothing here can do better; the browser is the only one that knows.
 */
export const DEFAULT_MODE: ThemeMode = "light"

/** Read by the root layout on the server, written by the controls in the browser. */
export const THEME_COOKIE = "onebase_theme"
export const MODE_COOKIE = "onebase_mode"

/** A year. Both are preferences, not sessions. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Follows the operating system until somebody chooses for themselves.
 *
 * <p>Runs before first paint, from the top of `<body>`. A synchronous script
 * blocks parsing, so the class is on `<html>` before anything renders and there
 * is no flash of the wrong mode.
 *
 * <p><b>No cookie is written, and that is the feature.</b> While there is no
 * cookie the browser keeps answering the question fresh on each load, so the
 * workspace follows the system if it changes from light to dark next week.
 * Choosing Light or Dark writes the cookie, and from then on this does nothing.
 * That is "system until you say otherwise" without a third mode to store, and
 * it costs four lines instead of a media-query copy of all nine dark palettes.
 *
 * <p>⚠️ A script is unavoidable here, and it is worth saying why the pure-CSS
 * version does not work. `@media (prefers-color-scheme: dark)` can apply the
 * dark tokens, but it cannot add a class — and every `dark:` utility in the
 * primitives keys off `.dark`. Tokens without the class would recolour the
 * palette while leaving those utilities on their light branch, which is the
 * half-loaded look this whole file exists to avoid.
 *
 * <p>⚠️ The element it mutates is `<html>`, which React also renders, so the
 * root layout marks it `suppressHydrationWarning`. Without that, React compares
 * the class it sent against the one the script added and reports a mismatch.
 */
export const MODE_INIT_SCRIPT = [
  "try{",
  // Built from MODE_COOKIE rather than spelling the name again: this string is
  // the one place the cookie is read outside TypeScript, and a second copy of
  // the name is a rename waiting to half-apply.
  //
  // Anchored at a boundary so a differently-named cookie ending in the same
  // text cannot masquerade as this one.
  `if(!/(?:^|;\\s*)${MODE_COOKIE}=/.test(document.cookie)`,
  "&&matchMedia('(prefers-color-scheme: dark)').matches)",
  "{document.documentElement.classList.add('dark')}",
  "}catch(e){}",
].join("")

/**
 * Broadcast whenever either choice changes.
 *
 * <p>The same event-plus-`useSyncExternalStore` shape as
 * `use-persisted-boolean`, so that two controls showing the same setting — the
 * navbar toggle and the switch in the settings window — agree the instant
 * either one is used, without a context provider wrapped around the app.
 */
export const THEME_EVENT = "onebase:theme-change"

/**
 * The cookie's value, or the default.
 *
 * <p>Anybody can type anything into a cookie, and an id that is not in the list
 * would put an attribute on `<html>` matching no block — leaving the `:root`
 * defaults showing while the picker claims something else is selected.
 */
export function parseTheme(raw: string | undefined): ThemeId {
  return themes.some((theme) => theme.id === raw) ? (raw as ThemeId) : DEFAULT_THEME
}

export function parseMode(raw: string | undefined): ThemeMode {
  return raw === "dark" ? "dark" : DEFAULT_MODE
}

/**
 * What is actually on, read from the document itself.
 *
 * <p>`<html>` is the source of truth rather than a copy of one: the server sets
 * both from cookies and the controls write them directly. Reading them back is
 * how a control that only exists in the browser learns the current value
 * without a prop threaded down through every component in between.
 */
export function readAppliedTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME
  return parseTheme(document.documentElement.dataset.theme)
}

export function readAppliedMode(): ThemeMode {
  if (typeof document === "undefined") return DEFAULT_MODE
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

/**
 * Plain `document.cookie`. Next forbids cookie writes during a render, which
 * is a rule about the server and says nothing about the browser.
 */
function remember(name: string, value: string): void {
  document.cookie = [
    `${name}=${value}`,
    "Path=/",
    `Max-Age=${THEME_COOKIE_MAX_AGE}`,
    "SameSite=Lax",
  ].join("; ")
}

/**
 * Put a palette on, and remember it.
 *
 * <p>The attribute first, because that is what makes the change instant — every
 * utility already resolves through `var(--token)`, so the page re-tints on the
 * next frame with no navigation and no `router.refresh()`. The cookie only
 * makes the choice survive a reload.
 */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id
  remember(THEME_COOKIE, id)
  window.dispatchEvent(new CustomEvent(THEME_EVENT))
}

/**
 * Switch between the palette's two halves.
 *
 * <p>The class, not an attribute, because `@custom-variant dark (&:is(.dark *))`
 * in `globals.css` is what every `dark:` utility in the primitives keys off.
 * Each theme's dark block is written to match it, so this one line re-tints the
 * palette and switches those variants together.
 */
export function applyMode(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", mode === "dark")
  remember(MODE_COOKIE, mode)
  window.dispatchEvent(new CustomEvent(THEME_EVENT))
}
