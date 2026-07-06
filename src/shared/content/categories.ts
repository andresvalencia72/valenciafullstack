/**
 * Stable, slug-like article category ids (blog: Frontmatter Validation —
 * `category` is a stable identifier shared across locales, never
 * translated text). Display labels for each id live in the i18n message
 * catalogs under `blog.categories.<id>` (see
 * `src/shared/i18n/messages/{es,en}.json`) and are resolved by UI code
 * via `useTranslations`/`getTranslations`, never stored here.
 *
 * This list is the "i18n category catalog" referenced by the blog spec's
 * Frontmatter Validation requirement: every article's `category` value
 * MUST be one of these ids, and every id here MUST have a corresponding
 * label in both locale catalogs (enforced by
 * `src/shared/i18n/category-catalog.test.ts`).
 */
export const ARTICLE_CATEGORY_IDS = [
  "architecture",
  "patterns",
  "technologies",
] as const;

export type ArticleCategoryId = (typeof ARTICLE_CATEGORY_IDS)[number];

export function isKnownArticleCategory(
  category: string,
): category is ArticleCategoryId {
  return (ARTICLE_CATEGORY_IDS as readonly string[]).includes(category);
}
