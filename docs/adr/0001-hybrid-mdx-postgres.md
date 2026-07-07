# ADR-0001: Hybrid MDX + Postgres content strategy

**Status**: Accepted (finalized in PR11, task 11.5)

## Decision

Article content (blog posts) lives in versioned MDX files under `content/blog/{slug}/{locale}.mdx`.
Dynamic data (contact messages, per-article views/reactions, full-text search index, rate limits)
lives in Postgres via Drizzle behind repository interfaces.

## Rejected alternatives

- All-DB CMS: adds infrastructure and editorial UI overhead not needed for a single-author portfolio.
- All-static (no DB): cannot support contact persistence, engagement counters, or full-text search.

## Consequences

Held through implementation without deviation: `content/blog/` ships four real articles
(three bilingual, one es-only fixture — PR4), all editorial content is reviewed via git diff
like code, and every dynamic capability (contact, engagement, search, rate limiting) lives in
the five-table Postgres schema (`shared/db/schema.ts`, PR5a) behind repository interfaces
(PR5b). One design nuance this hybrid split forced: `article_search.search_vector` cannot be a
Postgres generated column (see ADR-0002 Consequences) because `to_tsvector()` is not
`IMMUTABLE`, so `scripts/sync-search.ts` (PR8) explicitly re-derives the search index from the
MDX source of truth on every sync — the database never invents search content, it only mirrors it.

See `design.md` (Technical Approach, Persistence) for the full write-up.
