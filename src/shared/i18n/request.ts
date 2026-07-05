import { getRequestConfig } from "next-intl/server";
import { resolveRequestLocale } from "./resolve-request-locale";
import { defaultLocale, locales } from "./routing";

/**
 * next-intl RSC request config. Resolves the effective locale via the
 * shared, unit-tested `resolveRequestLocale` (i18n: Locale Routing) and
 * loads that locale's message catalog.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = resolveRequestLocale(requested, locales, defaultLocale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
