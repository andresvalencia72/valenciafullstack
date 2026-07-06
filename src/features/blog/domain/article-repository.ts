/**
 * Domain-owned locale type (deliberately duplicated from
 * `@/shared/i18n/routing`'s `Locale`, not imported from it) — per
 * design.md's Boundary Rules, `domain` may import nothing, so it cannot
 * depend on `shared/*`. The two types are structurally identical
 * (`"es" | "en"`), so callers passing a real `Locale` satisfy this type
 * without any conversion.
 */
export type ArticleLocale = "es" | "en";

/** A single locale's resolved article content (domain: Article entity). */
export interface Article {
  slug: string;
  locale: ArticleLocale;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  cover?: string;
  readingTimeMinutes: number;
  content: string;
}

/**
 * Storage-agnostic article access (domain: repository interface). The
 * MDX filesystem loader is one possible `infrastructure` implementation
 * — this interface has zero knowledge of MDX, the filesystem, or Zod.
 */
export interface ArticleRepository {
  /** Reads a single slug/locale pair, or `null` if that file is absent. */
  findArticle(slug: string, locale: ArticleLocale): Promise<Article | null>;
  /** All known article slugs (used for static generation). */
  listSlugs(): Promise<string[]>;
}
