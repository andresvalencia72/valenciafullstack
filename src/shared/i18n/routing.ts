import { defineRouting } from "next-intl/routing";

/**
 * Supported locales and default, per i18n spec (Locale Routing). `es`
 * is the default; `localePrefix: "always"` means every route —
 * including the default locale — is served under an explicit prefix.
 */
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
