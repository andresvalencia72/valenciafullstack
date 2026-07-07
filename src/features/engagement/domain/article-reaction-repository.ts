/**
 * Storage-agnostic article-reaction persistence (domain: repository
 * interface, persistence: Domain Repository Interfaces). Zero
 * drizzle-orm/database imports — enforced structurally by
 * eslint-plugin-boundaries' `domain: allow: []` rule (see
 * eslint.config.mjs). `infrastructure/drizzle-article-reaction-repository.ts`
 * is the Drizzle-backed implementation.
 */

/** Fixed 3-value reaction catalog — see design.md Resolved Decisions. */
export type ReactionKind = "thumbs_up" | "heart" | "fire";

export type ReactionCounts = Record<ReactionKind, number>;

export interface ArticleReactionRepository {
  /**
   * Insert-if-absent permanent dedupe on (slug, visitorHash, kind) — see
   * engagement: Reactions with Permanent Dedupe. Returns `true` when
   * this call inserted a new row (first reaction of this kind by this
   * visitor), `false` when it already existed (duplicate — still a
   * no-op write, idempotent).
   */
  recordReaction(
    slug: string,
    visitorHash: string,
    kind: ReactionKind,
  ): Promise<boolean>;

  /** Aggregate counts per reaction kind for a slug (0 for unused kinds). */
  countReactionsByKind(slug: string): Promise<ReactionCounts>;
}
