"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "./use-theme";

/**
 * Light/dark theme toggle (design-system: Theme Toggle). Persists the
 * visitor's choice to `localStorage` via `useTheme`. Labels come from
 * the `theme` message namespace (i18n: UI strings).
 */
export function ThemeToggle() {
  const t = useTranslations("theme");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <button type="button" onClick={toggleTheme} aria-pressed={isDark}>
      {label}
    </button>
  );
}
