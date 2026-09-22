"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  THEME_EVENT,
  applyMode,
  applyTheme,
  readAppliedMode,
  readAppliedTheme,
  type ThemeId,
  type ThemeMode,
} from "@/lib/theme/themes";

/**
 * The palette and the light/dark mode, live.
 *
 * <p><b>The document is the store.</b> `<html data-theme>` and `<html class="dark">`
 * are what the CSS actually reads, so keeping a second copy in React state
 * would mean two things that can disagree — and the one the person sees would
 * be whichever the stylesheet believes. This subscribes to the DOM instead, the
 * same shape `use-persisted-boolean` uses for `localStorage`: an event to
 * subscribe to, a snapshot read on demand.
 *
 * <p>That also means every control showing this setting agrees instantly. Flip
 * the navbar toggle and the switch inside the settings window moves with it,
 * with no context provider wrapped around the application.
 *
 * <p>⚠️ <b>The server snapshot is the default, so do not render anything from
 * these values in a component that is server-rendered.</b> A person whose
 * cookie says dark would get "light" in the HTML and "dark" on hydration, and
 * React reports that as a mismatch. The navbar's toggle sidesteps this entirely
 * by showing both icons and letting CSS pick — `.dark` is already on `<html>`
 * in the first response, so the right one is visible before any JavaScript
 * runs. Inside the settings window it is safe to read directly: that window
 * only ever mounts in the browser.
 *
 * <p>No "system" option. It would be a third state that follows
 * `prefers-color-scheme`, and it needs its own answer to what the cookie should
 * say when the operating system changes its mind while the tab is closed. Worth
 * adding deliberately if it is wanted, rather than falling into it.
 */
export function useTheme() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(THEME_EVENT, onStoreChange);
    // A second tab writing the cookie does not touch this document, so there is
    // no `storage` listener here — unlike the localStorage hooks, where the
    // browser does deliver one. Changing the palette in another tab therefore
    // shows up on this one's next load rather than immediately, which is the
    // honest behaviour for something stored per-request.
    return () => window.removeEventListener(THEME_EVENT, onStoreChange);
  }, []);

  const theme = useSyncExternalStore(
    subscribe,
    readAppliedTheme,
    () => DEFAULT_THEME,
  );

  const mode = useSyncExternalStore(
    subscribe,
    readAppliedMode,
    () => DEFAULT_MODE,
  );

  const setTheme = useCallback((next: ThemeId) => applyTheme(next), []);
  const setMode = useCallback((next: ThemeMode) => applyMode(next), []);

  /**
   * Flip to the other mode.
   *
   * <p>Reads the document rather than the `mode` above, so it is correct even
   * when called from a component that never rendered with it — which is exactly
   * the navbar's case.
   */
  const toggleMode = useCallback(() => {
    applyMode(readAppliedMode() === "dark" ? "light" : "dark");
  }, []);

  return { theme, mode, setTheme, setMode, toggleMode };
}
