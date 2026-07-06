import type { ArticleLocale } from "../domain/article-repository";

export interface ArticleSeoAlternates {
  /** Locale whose URL is canonical for the current request. */
  canonicalLocale: ArticleLocale;
  /** Locales to declare as hreflang alternates (self-referencing included). */
  hreflangLocales: ArticleLocale[];
  /** Locale the `x-default` hreflang alternate should point to. */
  xDefaultLocale: ArticleLocale;
}

/**
 * Resolves canonical + hreflang metadata for an article route (seo:
 * Bilingual Sitemap with Hreflang; i18n: SEO Metadata Consistency).
 *
 * - Bilingual article: canonical is the requested locale itself (both
 *   locale pages self-canonicalize), hreflang for both, `x-default` ->
 *   `es`.
 * - Single-locale article viewed at its own locale: canonical/hreflang
 *   self-reference that locale; `x-default` -> that locale (never a
 *   locale with no content).
 * - Single-locale article viewed via the missing-translation fallback
 *   (requested locale has no content): canonical points to the content
 *   locale, and no alternate is declared for the missing locale.
 */
export function resolveArticleSeoAlternates(
  requestedLocale: ArticleLocale,
  availableLocales: ArticleLocale[],
): ArticleSeoAlternates {
  const canonicalLocale = availableLocales.includes(requestedLocale)
    ? requestedLocale
    : availableLocales[0];

  const xDefaultLocale = availableLocales.includes("es")
    ? "es"
    : availableLocales[0];

  return {
    canonicalLocale,
    hreflangLocales: [...availableLocales],
    xDefaultLocale,
  };
}
