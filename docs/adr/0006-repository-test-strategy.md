# ADR-0006: Repository test strategy

**Status**: Accepted (finalized in PR11, task 11.5)

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

## Consequences

The fallback trigger never fired: pglite was verified during PR5b to support the exact
`spanish`/`english` regconfig, `websearch_to_tsquery`, `ts_rank`, and GIN index behavior the
`search` capability needs, with full parity to real Postgres — confirmed by applying the real
generated migration (`drizzle/0000_persistence_schema.sql`) against a fresh in-memory pglite
instance (`shared/db/create-pglite-test-db.ts`) before writing any repository code. Every
Drizzle repository across contact/engagement/rate-limit/search (PR5b/PR8) is integration-tested
this way; no testcontainers dependency was ever added. One operational bonus this decision paid
for during PR11 hardening: pglite's cold-start time under full-suite parallelism + coverage
instrumentation could exceed Vitest's 5000ms default test timeout (an intermittent, environment-
level flake, not a pglite-parity issue) — fixed by raising `testTimeout`/`hookTimeout` globally
in `vitest.config.ts`, unrelated to the regconfig/FTS parity this ADR is actually about.

See `design.md` (Testing Strategy) for the full write-up.
