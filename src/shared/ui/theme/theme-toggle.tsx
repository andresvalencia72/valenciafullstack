"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "./use-theme";

/**
 * Light/dark theme toggle (design-system: Theme Toggle). Persists the
 * visitor's choice to `localStorage` via `useTheme`. Labels come from
 * the `theme` message namespace (i18n: UI strings) — the button carries
 * no visible text (icon-only, matching design-reference/'s
 * `[data-theme-toggle]`), so the label is exposed as `aria-label`
 * instead of text content; the accessible name stays identical either
 * way.
 *
 * Renders design-reference/'s pure-CSS moon/sun icons (`[data-ic-moon]`/
 * `[data-ic-sun]`): a moon (crescent via an inset box-shadow) while in
 * light mode — click to switch to dark — and a bordered circle (sun)
 * while in dark mode — click to switch to light.
 */
export function ThemeToggle() {
  const t = useTranslations("theme");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={label}
      className="grid h-9.5 w-9.5 place-items-center rounded-full border border-line text-ink transition-colors hover:border-coral"
    >
      <span aria-hidden="true" className="relative block h-4.25 w-4.25">
        {isDark ? (
          <span
            data-icon="sun"
            className="absolute inset-px rounded-full border-2 border-ink"
          />
        ) : (
          <span
            data-icon="moon"
            className="absolute inset-0 rounded-full shadow-[inset_-5px_-3px_0_0_var(--ink)]"
          />
        )}
      </span>
    </button>
  );
}
