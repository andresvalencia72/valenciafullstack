# ADR-0007: CSP script-src strategy

**Status**: Accepted (finalized in PR11, task 11.5; header set shipped in PR1, task 1.8)

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

## Consequences

Held through implementation with no further tightening, exactly as planned. PR11 (task 11.1)
re-verified the full production header set byte-for-byte against this canonical policy — both
at the unit level (`security-headers.test.ts`) and against a real HTTP response
(`e2e/smoke.spec.ts`) — with zero drift since PR1. Lighthouse's Best Practices score (which
includes CSP-adjacent audits) landed at 96-100 across the home page and an article page during
PR11's budget run, consistent with the "bounded, not eliminated" risk this ADR accepts: no
CSP-related Best Practices deduction was observed in practice.

## Dev-only exception: `'unsafe-eval'`

React's development build requires `eval()` for debugging features (e.g. reconstructing
component stacks), so `next dev` (Turbopack) violates a strict `script-src` CSP without it,
printing a console error on every page load. `src/shared/config/security-headers.ts` exposes
`buildSecurityHeaders(isDev)`, which appends `'unsafe-eval'` to `script-src` only when
`isDev` is true; the exported `securityHeaders` derives `isDev` from
`process.env.NODE_ENV === "development"`. `buildSecurityHeaders()` defaults `isDev` to
`false`, and the production CSP string is unchanged and covered by a unit test asserting
byte-for-byte equality with the canonical policy above. React never uses `eval()` in
production, so this exception is never shipped.
