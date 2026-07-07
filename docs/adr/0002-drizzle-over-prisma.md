# ADR-0002: Drizzle over Prisma

**Status**: Accepted (finalized in PR11, task 11.5)

## Decision

Use Drizzle ORM (lightweight, SQL-first, typed, edge-friendly) for all Postgres access.

## Rejected alternatives

- Prisma: heavier engine, migration model less aligned with edge/serverless deployment targets.

## Consequences

Held through implementation with one real limitation surfaced (PR5a): Drizzle's generated-column
support requires the generation expression to be Postgres-`IMMUTABLE`, but the per-locale
regconfig `to_tsvector(regconfig, text)` `article_search.search_vector` needs is classified
`STABLE`, not `IMMUTABLE` — Drizzle (correctly) has no way around this, since it's a Postgres
constraint, not an ORM one. `search_vector` therefore ships as a plain nullable `tsvector`
column (via a hand-rolled `customType`, since Drizzle has no first-class `tsvector` builder),
populated exclusively by `scripts/sync-search.ts` rather than a generated expression or trigger.
Every repository (`shared/db`, PR5a/PR5b) still gets full type-safety from `drizzle-kit
generate`'s output, and the "SQL-first, typed" tradeoff Prisma would not have offered as
cleanly held up in practice.

See `design.md` (Patterns, Persistence) for the full write-up.
