# ADR-0002: Drizzle over Prisma

**Status**: Draft (stub — full rationale lands in PR11, task 11.5)

## Decision

Use Drizzle ORM (lightweight, SQL-first, typed, edge-friendly) for all Postgres access.

## Rejected alternatives

- Prisma: heavier engine, migration model less aligned with edge/serverless deployment targets.

See `design.md` (Patterns, Persistence) for the full write-up.
