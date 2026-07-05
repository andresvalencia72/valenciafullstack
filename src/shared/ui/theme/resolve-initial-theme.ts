export type Theme = "light" | "dark";

const VALID_THEMES: readonly Theme[] = ["light", "dark"];

function isValidTheme(value: string | null): value is Theme {
  return value !== null && (VALID_THEMES as readonly string[]).includes(value);
}

/**
 * Resolves which theme should apply on first render, per
 * design-system: Theme Toggle.
 *
 * Precedence: an explicit visitor choice persisted in `localStorage`
 * always wins; otherwise fall back to the OS/browser
 * `prefers-color-scheme` signal.
 */
export function resolveInitialTheme(
  storedValue: string | null,
  prefersDark: boolean,
): Theme {
  if (isValidTheme(storedValue)) {
    return storedValue;
  }

  return prefersDark ? "dark" : "light";
}
