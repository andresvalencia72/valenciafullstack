# Security Specification

## Purpose

Cross-cutting security requirements applied to every endpoint and page in the system: input validation, rate limiting, headers, and secret handling.

## Requirements

### Requirement: Input Validation on Every Endpoint

Every API route MUST validate incoming input with a Zod schema before executing business logic and MUST reject invalid input with HTTP 400.

#### Scenario: Malformed payload rejected

- GIVEN any API route receives a payload violating its Zod schema
- WHEN the route handler executes
- THEN the system MUST return HTTP 400 before any persistence, email, or external call occurs

### Requirement: Rate Limiting on Write/Query Endpoints

Every endpoint that writes data (contact, engagement) or executes a database query on user input (search, engagement summary read) MUST enforce rate limiting per client, keyed by `ip_hash` (an HMAC-SHA256 of the client IP, keyed by the server-side secret `VISITOR_HASH_SECRET`). `ip_hash` is the rate-limiting key for all rate-limited endpoints; it is distinct from `visitor_hash` (HMAC of IP+UA), which is used only for engagement dedupe.

**Client IP resolution is platform-conditional**, not an unconditional "first `x-forwarded-for` entry" rule: on generic append-style proxies, the first `x-forwarded-for` entry is client-controlled and MUST NOT be trusted. In production, behind a platform-managed proxy that sanitizes headers before the request reaches the app (e.g. Vercel), the client IP used to derive `ip_hash` MUST be read from that platform-provided `x-forwarded-for` header's first entry — trusted specifically because the platform overwrites/sanitizes it, not because "first entry" is inherently safe. When the header is absent (local dev, CI e2e running against `next start`), the socket/connection remote address MUST be used instead, as the trusted off-platform source.

Rate limits are tracked per endpoint in the `rate_limits` table, PRIMARY KEY(endpoint, key, window_start) — each endpoint maintains its own independent limit window; exhausting one endpoint's budget MUST NOT affect another endpoint's counter. This spec is the single source of truth for concrete limits:

| Endpoint | Limit |
|----------|-------|
| `POST /api/contact` | 3 requests / 10 min |
| `GET /api/search` | 30 requests / min |
| `POST /api/engagement/{views,reactions}` | 20 requests / min |
| `GET /api/engagement/[slug]` (summary) | 60 requests / min |

#### Scenario: Rate limit enforced

- GIVEN a client exceeds the configured request threshold for an endpoint
- WHEN they issue another request within that endpoint's window
- THEN the system MUST return HTTP 429 and MUST NOT execute the underlying operation

#### Scenario: Rate limits are scoped per endpoint

- GIVEN a client has exhausted the rate limit for `POST /api/contact`
- WHEN the same client issues a request to `GET /api/search`
- THEN the search request MUST be evaluated against its own independent limit and MUST NOT be blocked by the contact endpoint's exhausted budget

### Requirement: No PII or Internal Detail Leakage

API error responses MUST NOT include stack traces, raw database errors, or personally identifiable information beyond what the requester already submitted.

#### Scenario: Internal error sanitized

- GIVEN an unexpected server error occurs while processing a request
- WHEN the error response is returned
- THEN the body MUST contain a generic error message only

### Requirement: Security Headers

The application MUST set security headers (at minimum: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options or equivalent frame-ancestors policy) on all responses. **CSP strategy**: `script-src` and `style-src` MUST both be `'self' 'unsafe-inline'`; the policy MUST also include `object-src 'none'`, `frame-ancestors 'none'`, and `base-uri 'self'`. Hash- or nonce-based `script-src` is rejected as unimplementable on App Router (see `design.md` ADR-0007: the framework emits dynamic inline RSC scripts that cannot be pre-hashed, and nonce-based CSP would force dynamic rendering, breaking static/ISR). This is an accepted tradeoff: the site renders no user-generated HTML and all inputs are Zod-validated; compensating controls are the remaining hardened headers and the absence of third-party script sources. **Phasing**: this full CSP ships in the scaffolding slice (PR1, task 1.8); the hardening slice (PR11, task 11.1) verifies the full header set and Lighthouse only — no further CSP tightening is planned.

#### Scenario: Headers present

- GIVEN any page or API response
- WHEN response headers are inspected
- THEN the required security headers MUST be present with restrictive values

#### Scenario: CSP baseline directives present

- GIVEN the CSP header is inspected on any page response
- WHEN `script-src` and `style-src` are evaluated
- THEN both MUST be `'self' 'unsafe-inline'`
- AND `object-src 'none'`, `frame-ancestors 'none'`, and `base-uri 'self'` MUST also be present

### Requirement: No Client-Side Secrets

No API keys, database credentials, or other secrets MUST be exposed to client-side bundles. Secrets MUST only be read from server-side environment variables.

#### Scenario: Client bundle inspected

- GIVEN the production client JavaScript bundle
- WHEN it is inspected for secret values (email API key, DB connection string, GitHub token)
- THEN none MUST be present

### Requirement: Hashed Visitor Keys, No Tracking Cookies

Engagement deduplication MUST use `visitor_hash`, an HMAC-SHA256 of IP + user agent keyed by the server-side secret `VISITOR_HASH_SECRET`, and MUST NOT set tracking cookies, per the `engagement` capability. `visitor_hash` MUST NOT be reused as the rate-limiting key; rate limiting uses `ip_hash` (HMAC-SHA256 of IP only).

#### Scenario: No engagement tracking cookie

- GIVEN a visitor interacts with view/reaction endpoints
- WHEN response cookies are inspected
- THEN no tracking cookie MUST be present
