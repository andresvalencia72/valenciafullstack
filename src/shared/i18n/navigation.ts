import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives (`Link`, `usePathname`,
 * `useRouter`, `redirect`, `getPathname`), scoped to `routing`. Used by
 * the locale switcher (i18n: Locale Persistence on Navigation) to
 * switch locale while preserving the current page.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
