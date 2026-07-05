/**
 * Resolves the effective request locale (i18n: Locale Routing). The
 * requested locale wins only when it is one of the supported locales;
 * otherwise the pinned default locale (`es`) is used — Accept-Language
 * content negotiation is intentionally NOT performed here, per
 * design.md's i18n section.
 */
export function resolveRequestLocale<TLocale extends string>(
  requested: string | undefined,
  supportedLocales: readonly TLocale[],
  defaultLocale: TLocale,
): TLocale {
  if (requested && (supportedLocales as readonly string[]).includes(requested)) {
    return requested as TLocale;
  }

  return defaultLocale;
}
