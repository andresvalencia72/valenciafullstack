"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { locales, type Locale } from "@/shared/i18n/routing";

/**
 * Locale switcher — generic behavior only: switches locale and
 * preserves the current page (i18n: Locale Persistence on Navigation).
 * Article-aware behavior (same-slug resolution, fallback-notice
 * handling) is a `blog` capability concern layered on top later.
 */
export function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === activeLocale) {
      return;
    }

    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div role="group" aria-label={t("label")}>
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={locale === activeLocale}
          onClick={() => handleSelect(locale)}
        >
          {t(locale)}
        </button>
      ))}
    </div>
  );
}
