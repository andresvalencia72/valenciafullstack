import type { ArticleLocale } from "../domain/article-repository";
import { resolveArticleSeoAlternates } from "./resolve-article-seo-alternates";

/** One article's slug plus the locales that actually have an MDX file for it. */
export interface ArticleSitemapSource {
  slug: string;
  availableLocales: ArticleLocale[];
}

export interface ArticleSitemapEntry {
  url: string;
  locale: ArticleLocale;
  alternates: {
    languages: Record<string, string>;
  };
}

function articleUrl(siteUrl: string, locale: ArticleLocale, slug: string): string {
  return new URL(`/${locale}/blog/${slug}`, siteUrl).toString();
}

/**
 * Builds one sitemap entry per (slug, available locale) pair, with
 * hreflang alternates + `x-default` (seo: Bilingual Sitemap with
 * Hreflang). Reuses the same `resolveArticleSeoAlternates` pure
 * function task 4.5's `generateMetadata` already relies on, so the
 * sitemap and the per-route canonical/hreflang tags can never silently
 * diverge (cross-ref 4.5) — a bilingual article yields two entries
 * (one per locale, each self-canonical), a single-locale article yields
 * exactly one, and an article with zero available locales yields none.
 */
export function buildArticleSitemapEntries(
  articles: ArticleSitemapSource[],
  siteUrl: string,
): ArticleSitemapEntry[] {
  const entries: ArticleSitemapEntry[] = [];

  for (const { slug, availableLocales } of articles) {
    for (const locale of availableLocales) {
      const { hreflangLocales, xDefaultLocale } = resolveArticleSeoAlternates(
        locale,
        availableLocales,
      );

      const languages: Record<string, string> = {};
      for (const hreflangLocale of hreflangLocales) {
        languages[hreflangLocale] = articleUrl(siteUrl, hreflangLocale, slug);
      }
      languages["x-default"] = articleUrl(siteUrl, xDefaultLocale, slug);

      entries.push({
        url: articleUrl(siteUrl, locale, slug),
        locale,
        alternates: { languages },
      });
    }
  }

  return entries;
}
