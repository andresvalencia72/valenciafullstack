/**
 * Slugs that MUST NOT be used for an article because they would shadow
 * the `engagement` API routes (`/api/engagement/views`,
 * `/api/engagement/reactions`) — blog: Frontmatter Validation, Reserved
 * slug rejected.
 */
export const RESERVED_ARTICLE_SLUGS = ["views", "reactions"] as const;

export function isReservedArticleSlug(slug: string): boolean {
  return (RESERVED_ARTICLE_SLUGS as readonly string[]).includes(slug);
}
