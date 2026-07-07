/**
 * Storage-agnostic article-search persistence (domain: repository
 * interface, persistence: Domain Repository Interfaces). Zero
 * drizzle-orm/database imports — enforced structurally by
 * eslint-plugin-boundaries' `domain: allow: []` rule (see
 * eslint.config.mjs). `infrastructure/drizzle-article-search-repository.ts`
 * is the Drizzle-backed implementation. `scripts/sync-search.ts`'s
 * full-reconcile shape dictates this contract, per task 8.1 — deferred
 * from PR5b for exactly this reason (see tasks.md PR5b apply findings).
 *
 * `SearchLocale` is deliberately duplicated as a literal union rather
 * than importing `Locale` from `@/shared/i18n/routing` — domain MAY NOT
 * import anything, same rationale as `blog`'s `ArticleLocale` (PR4) and
 * `contact`'s `ContactLocale` (PR6).
 */
export type SearchLocale = "es" | "en";

export interface ArticleSearchEntry {
  slug: string;
  locale: SearchLocale;
  title: string;
  description: string;
  category: string;
  bodyText: string;
}

export interface ArticleSearchResultRow {
  slug: string;
  locale: SearchLocale;
  title: string;
  description: string;
  category: string;
}

export interface ArticleSearchRepository {
  /**
   * Full reconcile (search: Index Sync Full Reconcile): upserts every
   * (slug, locale) entry in `entries` AND prunes any existing
   * `article_search` row whose (slug, locale) is absent from `entries`.
   * A single call performs both halves — there is no separate
   * upsert-only method, so a caller can never accidentally skip the
   * prune half of a "full reconcile".
   */
  reconcile(entries: ArticleSearchEntry[]): Promise<void>;

  /**
   * Full-text search filtered to `locale`, ordered by relevance
   * (search: Full-Text Query, Relevance Ranking). `query` is the raw,
   * already-validated user search string — the implementation is
   * responsible for parsing it with `websearch_to_tsquery` (never raw
   * `to_tsquery`, per the search spec).
   */
  search(locale: SearchLocale, query: string): Promise<ArticleSearchResultRow[]>;
}
