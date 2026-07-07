# ADR-0003: Rate limiting strategy

**Status**: Accepted (finalized in PR11, task 11.5)

## Decision

Postgres fixed-window rate limiting, scoped per endpoint, keyed by `ip_hash`
(`rate_limits` table, PRIMARY KEY(endpoint, key, window_start)).

## Rejected alternatives

- Redis/Upstash: extra infrastructure/datastore not justified at this scale — a single
  Postgres instance is already present for all other persistence needs.

## Consequences

Held through implementation across all four rate-limited endpoints (`security` spec:
contact 3/10min, search 30/min, engagement writes 20/min, engagement summary read 60/min),
each independently scoped by the `(endpoint, key, window_start)` primary key — exhausting one
endpoint's budget never affects another's, verified by a dedicated cross-endpoint scenario test
(PR6/PR7/PR8 apply findings). `shared/rate-limit/*` (PR5b) centralizes the atomic
`INSERT ... ON CONFLICT ... DO UPDATE SET count = count + 1 RETURNING count` upsert as one
shared primitive rather than reimplementing it three times, which the original ADR scope didn't
explicitly call out but followed naturally from "a single Postgres instance is already present."
No serverless cold-start or connection-pool contention issues were observed against pglite/real
Postgres during implementation — the single-DB tradeoff held at this project's scale as predicted.

See `design.md` (API Surface) and `specs/security/spec.md` (Rate Limiting) for the full write-up.
