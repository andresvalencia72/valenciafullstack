"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { locales, type Locale } from "@/shared/i18n/routing";

/**
 * Locale switcher — generic behavior only: switches locale and
 * preserves the current page (i18n: Locale Persistence on Navigation).
 * Article-aware behavior (same-slug resolution, fallback-notice
 * handling) is a `blog` capability concern layered on top later.
 *
 * The design-reference is Spanish-only and has no locale switcher of
 * its own, so this adapts the design's nav-link idiom instead of
 * copying an existing element: compact "ES / EN" text buttons at the
 * same 15px/500 weight as `SectionNav`'s links, active locale in
 * coral, inactive in ink with the same coral hover treatment. The
 * full locale name stays available to assistive tech via `aria-label`
 * (`t(locale)`) — visible text is just the ISO code, never translated.
 * `useLocale()` resolves identically on the server and the client (via
 * `NextIntlClientProvider`), so this introduces no client-only initial
 * render state that could diverge from the SSR markup (see the
 * PR2a/PR2b theme-toggle hydration-mismatch history — that lesson
 * applies here too, hence no locale-dependent `useState`/`useEffect`).
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
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-2 text-[15px] font-medium"
    >
      {locales.map((locale, index) => (
        <div key={locale} className="flex items-center gap-2">
          {index > 0 && (
            <span aria-hidden="true" className="text-ink-faint">
              /
            </span>
          )}
          <button
            type="button"
            aria-pressed={locale === activeLocale}
            aria-label={t(locale)}
            onClick={() => handleSelect(locale)}
            className={
              locale === activeLocale
                ? "text-coral"
                : "text-ink transition-colors hover:text-coral"
            }
          >
            {locale.toUpperCase()}
          </button>
        </div>
      ))}
    </div>
  );
}
