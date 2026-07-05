# ADR-0007: CSP script-src strategy

**Status**: Draft (stub — full rationale lands in PR11, task 11.5; header set ships in PR1, task 1.8)

## Decision

`script-src` and `style-src` are both `'self' 'unsafe-inline'`, plus `object-src 'none'`,
`frame-ancestors 'none'`, and `base-uri 'self'`. See `src/shared/config/security-headers.ts`
for the implementation and `src/shared/config/security-headers.test.ts` for the enforcing
unit tests.

## Rejected alternatives

- sha256 hash allowlist: unimplementable on the App Router — dynamic inline RSC scripts
  cannot be pre-hashed.
- Nonce-based CSP: forces dynamic rendering on every request, breaking static/ISR rendering.

## Accepted tradeoff

The site renders no user-generated HTML and all inputs are Zod-validated, so the
`'unsafe-inline'` script/style risk is bounded rather than eliminated by allowlisting.
Compensating controls: the remaining hardened headers (HSTS, X-Content-Type-Options,
`frame-ancestors none`, `object-src none`, `base-uri self`) and the absence of any
third-party script sources. No further CSP tightening is planned after PR11 (task 11.1)
verifies the header set and Lighthouse.

See `design.md` (Resolved Decisions) and `specs/security/spec.md` (Security Headers) for
the full write-up.
