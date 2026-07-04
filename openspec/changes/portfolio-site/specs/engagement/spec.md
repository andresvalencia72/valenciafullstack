# Engagement Specification

## Purpose

Per-article view counters and reactions backed by Postgres, with privacy-respecting, permanent deduplication.

**Test observation note**: count-increment scenarios below (First view, Add reaction, Duplicate reaction, etc.) are asserted at the repository level (querying `article_views`/`article_reactions` directly), not through the 60-second-cached aggregate GET endpoint, to avoid cache-staleness false negatives.

## Requirements

### Requirement: View Counting with Permanent Dedupe

The system MUST record at most one view per (article, visitor_hash) pair, permanently, via an insert-if-absent write to `article_views` (UNIQUE(slug, visitor_hash), `onConflictDoNothing`). A repeat view from the same visitor MUST NEVER increment the count again, regardless of how much time has elapsed since the first view. The view count is the aggregate count of rows per slug in `article_views`, not a separately incremented counter column. `POST /api/engagement/views` MUST return HTTP 204 No Content for both the first write and any subsequent duplicate — the response never distinguishes the two cases.

#### Scenario: First view

- GIVEN a visitor with no prior recorded view of article `my-post`
- WHEN they view the article
- THEN a new row MUST be inserted into `article_views` for that (slug, visitor_hash) pair
- AND the aggregate view count MUST increase by exactly one
- AND the endpoint MUST return HTTP 204 No Content

#### Scenario: Repeat view from the same visitor never increments

- GIVEN the same visitor's hashed key already has a recorded view row for `my-post`, at any point in the past
- WHEN they view the article again
- THEN no new row MUST be inserted
- AND the aggregate view count MUST NOT increase
- AND the endpoint MUST still return HTTP 204 No Content (idempotent, leaks no dedupe state)

#### Scenario: View triggered once per page load

- GIVEN a visitor's browser has finished hydrating an article page
- WHEN hydration completes
- THEN the client MUST fire exactly one view POST request for that page load
- AND MUST NOT fire additional view requests for the same page load (e.g. on re-render or scroll)

### Requirement: Reactions with Permanent Dedupe

The system MUST allow visitors to react to an article using exactly one of a fixed enum of three reaction types: `thumbs_up` (👍), `heart` (❤️), `fire` (🔥). No other reaction type MUST be accepted. The system MUST apply the same permanent, hashed-visitor dedupe rule as view counting, per reaction type (UNIQUE(slug, visitor_hash, kind), insert-if-absent). Removing or undoing a reaction is out of scope for v1. `POST /api/engagement/reactions` MUST return HTTP 204 No Content for both the first write and any subsequent duplicate, consistent with view counting (idempotent, leaks no dedupe state).

#### Scenario: Add reaction

- GIVEN a visitor has not reacted to article `my-post` with type `thumbs_up`
- WHEN they submit a `thumbs_up` reaction
- THEN a new row MUST be inserted into `article_reactions`
- AND the reaction count for `thumbs_up` MUST increase by one
- AND the endpoint MUST return HTTP 204 No Content

#### Scenario: Duplicate reaction is idempotent

- GIVEN a visitor already reacted with `thumbs_up` on `my-post`, at any point in the past
- WHEN they submit the same reaction again
- THEN no new row MUST be inserted and the count MUST NOT increase again
- AND the endpoint MUST return HTTP 204 No Content (idempotent success), not an error

#### Scenario: Visitor reacts with a different type on the same article

- GIVEN a visitor already reacted with `thumbs_up` on `my-post`
- WHEN they submit a `heart` reaction on the same article
- THEN the reaction count for `heart` MUST increment by one independently of `thumbs_up`

### Requirement: Privacy-Respecting Visitor Identity

The system MUST derive `visitor_hash` as an HMAC-SHA256 of visitor-identifying signals (IP + user agent), keyed by the server-side secret `VISITOR_HASH_SECRET`, and MUST NOT use tracking cookies or persist raw identifying data. `visitor_hash` is used exclusively for engagement dedupe and MUST NOT be reused as the rate-limiting key (rate limiting uses `ip_hash`, an HMAC-SHA256 of IP only, per the `security` capability). Accepted tradeoff: because `visitor_hash` derives from IP+UA, visitors who share both an IP (e.g. behind NAT/CGNAT) and an identical user-agent string will collide and be treated as a single visitor, which can undercount distinct views/reactions — this is a documented privacy/accuracy tradeoff, not a bug.

#### Scenario: No tracking cookie set

- GIVEN a visitor views or reacts to an article
- WHEN the response is inspected
- THEN no tracking cookie MUST be set for engagement purposes

### Requirement: Endpoint Validation, Unknown Slug Rejection, and Rate Limiting

Engagement endpoints MUST validate input (article slug, reaction type) with a Zod enum restricted to `thumbs_up`, `heart`, `fire`, MUST validate the slug against the set of published article slugs, and MUST enforce rate limiting per `ip_hash` — 20 requests/min for the `views`/`reactions` write endpoints, per the `security` capability's concrete limits.

#### Scenario: Invalid reaction type

- GIVEN a request submits a reaction type outside `thumbs_up`, `heart`, `fire` (e.g. "like")
- WHEN the endpoint processes it
- THEN the system MUST return HTTP 400 and MUST NOT record the reaction

#### Scenario: Unknown slug rejected

- GIVEN a request targets a slug that does not exist in the published article set
- WHEN the view or reaction endpoint processes it
- THEN the system MUST return HTTP 404 and MUST NOT record a view or reaction row

### Requirement: Public Read of Aggregate Counts

View and reaction counts MUST be publicly readable per article without exposing any visitor identifiers, hashed or otherwise, via `GET /api/engagement/[slug]`, rate-limited per the `security` capability (60 requests/min). Successful (HTTP 200) responses MUST set `Cache-Control: public, s-maxage=60`; 4xx/5xx responses MUST NOT be cacheable (no caching directive). Rate limiting is evaluated at the origin server, so a request served from a CDN/edge cache on a hit never reaches the origin and does not consume that client's rate-limit budget — this is an accepted tradeoff, not a gap. The slug MUST be validated against the published article set.

#### Scenario: Public read of aggregate counts

- GIVEN article `my-post` has recorded views and reactions
- WHEN a visitor requests `GET /api/engagement/my-post`
- THEN the response MUST return `{views, reactions: {thumbs_up, heart, fire}}` with no visitor identifiers
- AND the response MUST include `Cache-Control: public, s-maxage=60`

#### Scenario: Error responses are never cached

- GIVEN `GET /api/engagement/[slug]` returns a 404 or 503 response
- WHEN response headers are inspected
- THEN no caching directive MUST be present on the response

#### Scenario: Unknown slug returns 404 on summary read

- GIVEN a request targets a slug that does not exist in the published article set
- WHEN `GET /api/engagement/[slug]` processes it
- THEN the system MUST return HTTP 404

### Requirement: Data Retention

`article_views` and `article_reactions` rows MUST be retained indefinitely, since permanent dedupe depends on their continued presence. No automated purge job exists for these tables in v1.

### Requirement: Graceful Degradation When Database Unavailable

WHEN Postgres is unavailable, the engagement view/reaction/summary API endpoints MUST return HTTP 503. The article page MUST render normally as static HTML — the server-rendered page MUST NOT probe database health to decide whether to render engagement UI. The client MUST detect the 503 response and hide or placeholder the view/reaction counts only in reaction to a failed API call.

#### Scenario: Database unavailable during article render

- GIVEN Postgres is unreachable
- WHEN the article page's client-side engagement hook requests counts or fires a view
- THEN the engagement API MUST return HTTP 503
- AND the client MUST hide or placeholder the view/reaction counts in response to the failed call
- AND the article page itself MUST continue to render normally
