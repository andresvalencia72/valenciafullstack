# ADR-0001: Hybrid MDX + Postgres content strategy

**Status**: Draft (stub — full rationale lands in PR11, task 11.5)

## Decision

Article content (blog posts) lives in versioned MDX files under `content/blog/{slug}/{locale}.mdx`.
Dynamic data (contact messages, per-article views/reactions, full-text search index, rate limits)
lives in Postgres via Drizzle behind repository interfaces.

## Rejected alternatives

- All-DB CMS: adds infrastructure and editorial UI overhead not needed for a single-author portfolio.
- All-static (no DB): cannot support contact persistence, engagement counters, or full-text search.

See `design.md` (Technical Approach, Persistence) for the full write-up.
