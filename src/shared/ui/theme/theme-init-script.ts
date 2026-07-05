/** localStorage key used to persist the visitor's theme choice. */
export const THEME_STORAGE_KEY = "pf-theme";

/**
 * Builds the source for the blocking inline `<script>` that sets
 * `data-theme` on `<html>` before first paint (design-system: Theme
 * Toggle — no flash of incorrect theme).
 *
 * Must run synchronously in `<head>`, before any stylesheet or body
 * content, so the browser never paints the wrong theme. Mirrors the
 * precedence in `resolveInitialTheme`: a stored choice wins, otherwise
 * fall back to `prefers-color-scheme`. Wrapped in try/catch because
 * `localStorage` can throw in privacy/incognito modes.
 */
export function buildThemeInitScript(): string {
  return `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
}
