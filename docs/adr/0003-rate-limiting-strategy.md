# ADR-0003: Rate limiting strategy

**Status**: Draft (stub — full rationale lands in PR11, task 11.5)

## Decision

Postgres fixed-window rate limiting, scoped per endpoint, keyed by `ip_hash`
(`rate_limits` table, PRIMARY KEY(endpoint, key, window_start)).

## Rejected alternatives

- Redis/Upstash: extra infrastructure/datastore not justified at this scale — a single
  Postgres instance is already present for all other persistence needs.

See `design.md` (API Surface) and `specs/security/spec.md` (Rate Limiting) for the full write-up.
