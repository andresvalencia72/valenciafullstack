import type { Article, ArticleLocale, ArticleRepository } from "../domain/article-repository";
import { getArticle } from "./get-article";

export interface ArticleTeaser {
  slug: string;
  locale: ArticleLocale;
  title: string;
  category: string;
  readingTimeMinutes: number;
}

function toTeaser(article: Article): ArticleTeaser {
  return {
    slug: article.slug,
    locale: article.locale,
    title: article.title,
    category: article.category,
    readingTimeMinutes: article.readingTimeMinutes,
  };
}

/**
 * Resolves the "next article" teaser shown at the bottom of an article
 * page (design-reference: next-article card), ordered chronologically
 * (oldest to newest) with wraparound after the newest article. Not a
 * formal spec requirement of its own — a small, self-contained piece of
 * navigation UX requested alongside the article page, scoped without
 * depending on the full articles-list feature (home-page: Embedded
 * Article List, PR3b).
 */
export async function getNextArticle(
  repository: ArticleRepository,
  currentSlug: string,
  locale: ArticleLocale,
): Promise<ArticleTeaser | null> {
  const slugs = await repository.listSlugs();

  const resolved: Article[] = [];
  for (const slug of slugs) {
    const result = await getArticle(repository, slug, locale);
    if (result.kind !== "not-found") {
      resolved.push(result.article);
    }
  }

  if (resolved.length <= 1) {
    return null;
  }

  const sorted = [...resolved].sort((a, b) => a.date.localeCompare(b.date));
  const currentIndex = sorted.findIndex((a) => a.slug === currentSlug);

  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = (currentIndex + 1) % sorted.length;
  return toTeaser(sorted[nextIndex]);
}
