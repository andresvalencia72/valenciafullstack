# ADR-0006: Repository test strategy

**Status**: Draft (stub — full rationale lands in PR11, task 11.5)

## Decision

Test Drizzle repositories against pglite (in-process Postgres) — fast, no Docker required
in the unit/integration CI job.

## Fallback trigger

If pglite does not support the `spanish`/`english` regconfig or `websearch_to_tsquery` with
parity to real Postgres (verified during PR5b), fall back to testcontainers for the search
integration tests only.

## Rejected alternatives

- testcontainers (default): heavier for this project's scale.
- mocks-only: does not validate real SQL/FTS behavior.

See `design.md` (Testing Strategy) for the full write-up.
