/**
 * Storage-agnostic article-view persistence (domain: repository
 * interface, persistence: Domain Repository Interfaces). Zero
 * drizzle-orm/database imports — enforced structurally by
 * eslint-plugin-boundaries' `domain: allow: []` rule (see
 * eslint.config.mjs). `infrastructure/drizzle-article-view-repository.ts`
 * is the Drizzle-backed implementation.
 */
export interface ArticleViewRepository {
  /**
   * Insert-if-absent permanent dedupe on (slug, visitorHash) — see
   * engagement: View Counting with Permanent Dedupe. Returns `true` when
   * this call inserted a new row (first view for this visitor), `false`
   * when the row already existed (repeat view — still a no-op write).
   */
  recordView(slug: string, visitorHash: string): Promise<boolean>;

  /** Aggregate count of distinct (deduped) views for a slug. */
  countViews(slug: string): Promise<number>;
}
