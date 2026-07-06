import type { Locale } from "@/shared/i18n/routing";
import type { MdxLoader } from "./mdx-loader";

/**
 * Locale-resolved article summary for list views (home-page: Embedded
 * Article List, article-filter: Category Filtering). Deliberately a
 * plain shape rather than the `blog` feature's `Article` domain entity
 * — this lives in `shared/content` precisely so `home` never needs to
 * import from `blog` (design.md: cross-feature imports only through
 * `shared/*`).
 */
export interface PublishedArticleSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readingTimeMinutes: number;
}

/**
 * Lists every article that has an MDX file in `locale`, latest first
 * (home-page: Embedded Article List — "articles list consumes the real
 * MDX loader, filtered by active locale, latest first"). Articles
 * missing a translation for `locale` are excluded (home-page: Article
 * missing a locale is excluded from that locale's list).
 */
export function listPublishedArticles(
  loader: MdxLoader,
  locale: Locale,
): PublishedArticleSummary[] {
  const summaries: PublishedArticleSummary[] = [];

  for (const slug of loader.getSlugs()) {
    const file = loader.readArticleFile(slug, locale);
    if (!file) {
      continue;
    }

    summaries.push({
      slug,
      title: file.frontmatter.title,
      description: file.frontmatter.description,
      category: file.frontmatter.category,
      date: file.frontmatter.date,
      readingTimeMinutes: file.readingTimeMinutes,
    });
  }

  return summaries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
