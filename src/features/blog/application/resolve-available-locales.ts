import type { ArticleLocale, ArticleRepository } from "../domain/article-repository";

/**
 * Resolves which of `candidateLocales` actually have an MDX file for
 * `slug`, per-locale, via `repository.findArticle`. Shared by the
 * article route's `generateMetadata` (task 4.5) and `app/sitemap.ts`
 * (task 9.3) so both compute hreflang alternates from the exact same
 * "which locales exist" answer — extracted here specifically so the two
 * call sites can never silently diverge (cross-ref 4.5/9.3).
 */
export async function resolveAvailableArticleLocales(
  repository: ArticleRepository,
  slug: string,
  candidateLocales: readonly ArticleLocale[],
): Promise<ArticleLocale[]> {
  const checks = await Promise.all(
    candidateLocales.map(async (locale) => ({
      locale,
      exists: (await repository.findArticle(slug, locale)) !== null,
    })),
  );

  return checks.filter((entry) => entry.exists).map((entry) => entry.locale);
}
