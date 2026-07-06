import type {
  Article,
  ArticleLocale,
  ArticleRepository,
} from "../domain/article-repository";

export type GetArticleResult =
  | { kind: "found"; article: Article }
  | {
      kind: "fallback";
      requestedLocale: ArticleLocale;
      contentLocale: ArticleLocale;
      article: Article;
    }
  | { kind: "not-found" };

function otherLocale(locale: ArticleLocale): ArticleLocale {
  return locale === "es" ? "en" : "es";
}

/**
 * Resolves an article for the requested locale, falling back to the
 * other supported locale when the requested one has no MDX file (blog:
 * Missing-Translation Fallback) instead of ever returning a 404 in that
 * case (blog: Article missing in both locales is the only 404 path).
 */
export async function getArticle(
  repository: ArticleRepository,
  slug: string,
  locale: ArticleLocale,
): Promise<GetArticleResult> {
  const primary = await repository.findArticle(slug, locale);
  if (primary) {
    return { kind: "found", article: primary };
  }

  const fallbackLocale = otherLocale(locale);
  const fallback = await repository.findArticle(slug, fallbackLocale);
  if (fallback) {
    return {
      kind: "fallback",
      requestedLocale: locale,
      contentLocale: fallbackLocale,
      article: fallback,
    };
  }

  return { kind: "not-found" };
}
