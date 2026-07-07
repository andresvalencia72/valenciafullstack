/**
 * `home`'s own view of a search result row (home-page: Embedded Article
 * List — search input; article-filter: Selecting a pill clears an
 * active search query). Deliberately a plain domain type with zero
 * imports, mirroring `HomeArticleSummary` — the `app/` composition
 * root's client wrapper (`ArticlesWithSearch`) maps the `search`
 * feature's own result shape into this type, so `home` never imports
 * `search/domain` or `search/ui` directly (cross-feature imports only
 * through `shared/*`/the composition root, same rule as `home` never
 * importing `blog`, task 3b.2).
 */
export interface HomeSearchResultSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  locale: "es" | "en";
}
