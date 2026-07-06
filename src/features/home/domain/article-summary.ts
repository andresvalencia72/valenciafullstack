/**
 * `home`'s own view of an article for the embedded articles list
 * (home-page: Embedded Article List). Deliberately a plain domain type
 * with zero imports (design.md: `domain` may import nothing) rather
 * than importing `blog`'s `Article` entity or `shared/content`'s
 * `PublishedArticleSummary` directly — the `app/` composition root maps
 * `shared/content`'s output into this shape, so `home` never depends on
 * `blog` or on the filesystem-backed loader.
 */
export interface HomeArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTimeMinutes: number;
}
