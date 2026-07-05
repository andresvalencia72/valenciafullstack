"use client";

import { useCallback, useEffect, useState } from "react";
import { type Theme } from "./resolve-initial-theme";
import { THEME_STORAGE_KEY } from "./theme-init-script";

const SSR_SAFE_DEFAULT: Theme = "light";

function readCurrentTheme(): Theme {
  if (typeof document === "undefined") {
    return SSR_SAFE_DEFAULT;
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * Client hook exposing the current theme and a setter that keeps the
 * document attribute, React state, and `localStorage` persistence in
 * sync (design-system: Theme Toggle).
 *
 * The page's overall theme never flashes: the inline no-flash script
 * sets `data-theme` on `<html>` (and therefore all CSS custom
 * properties) before hydration even starts. This hook's own React
 * state, however, MUST start at the same SSR-safe default the server
 * rendered (`"light"`) — reading the live `document` value during the
 * first render would diverge from the server's markup and trigger a
 * React hydration mismatch (verified via Playwright during PR2: a
 * stored "dark" preference produced a real hydration error on
 * `ThemeToggle`'s `aria-pressed`/label). The real value is synced
 * immediately after mount instead, via `useEffect`.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(SSR_SAFE_DEFAULT);

  useEffect(() => {
    // Intentional one-time sync from an external system (the `<html>`
    // `data-theme` attribute, already mutated by the pre-hydration
    // no-flash script) into React state — exactly the case the
    // `react-hooks/set-state-in-effect` rule's own guidance carves out
    // ("synchronize state... with... other platform APIs"). This
    // cannot be a lazy `useState` initializer instead: that would read
    // the already-mutated DOM during the FIRST client render and
    // diverge from the server-rendered markup, reproducing the exact
    // hydration mismatch this effect exists to avoid (see the
    // module-level doc comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readCurrentTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. privacy mode) — the theme still
      // applies for the current session, it just won't persist.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
