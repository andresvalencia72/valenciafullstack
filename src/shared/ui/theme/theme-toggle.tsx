"use client";

import { useTheme } from "./use-theme";

const LABELS = {
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
};

/**
 * Light/dark theme toggle (design-system: Theme Toggle). Persists the
 * visitor's choice to `localStorage` via `useTheme`.
 *
 * Labels are hardcoded English strings for now — this component is
 * decoupled from next-intl until PR2b lands the i18n shell, at which
 * point labels move to the `theme` message namespace (see
 * `src/shared/i18n/messages/{es,en}.json`).
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? LABELS.switchToLight : LABELS.switchToDark;

  return (
    <button type="button" onClick={toggleTheme} aria-pressed={isDark}>
      {label}
    </button>
  );
}
