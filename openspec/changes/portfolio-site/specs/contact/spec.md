# Contact Specification

## Purpose

Validated contact form delivering real email notifications via an API route, with messages persisted to Postgres.

**Check order note**: per-request checks execute in this order: rate limit → honeypot → Zod validation. A request that trips the honeypot still consumes rate-limit budget (the rate-limit counter is incremented before the honeypot check runs). Accepted tradeoff: repeated honeypot hits from the same client can exhaust that client's rate-limit budget and surface an HTTP 429 on subsequent legitimate requests — this is documented, not a bug. This check-order orchestration MUST be implemented in the `contact` feature's `application` layer (use-case), not in the `app/api/contact/route.ts` handler itself, so it is covered by the `src/**` unit-test coverage gate rather than the excluded `app/` route-adapter layer.

**Success response**: a fully successful submission (validation passes, message persisted, email sent) returns HTTP 200 with body `{status: "sent"}`.

## Requirements

### Requirement: Server-Side Input Validation

The contact API route MUST validate all input with a Zod schema and MUST reject invalid requests with a 400 response before any persistence or email attempt: `name` (non-empty, ≤ 100 chars), `email` (valid format, ≤ 254 chars), `message` (non-empty, ≤ 5000 chars), and `locale` (client-submitted, validated as enum `es`/`en`).

#### Scenario: Valid submission

- GIVEN a visitor submits name, valid email, and a non-empty message
- WHEN the API route processes the request
- THEN validation MUST pass
- AND the message MUST be persisted to Postgres
- AND an email notification MUST be sent via the configured email service
- AND the API MUST return HTTP 200 with body `{status: "sent"}`

#### Scenario: Invalid email format

- GIVEN a visitor submits an invalid email address
- WHEN the API route processes the request
- THEN the system MUST return HTTP 400 with a validation error
- AND MUST NOT persist the message or send an email

### Requirement: Message Persistence Independent of Email Delivery

The system MUST persist a valid contact message to Postgres even if the email delivery step subsequently fails. HTTP 503 is reserved for persistence failure only. WHEN persistence succeeds but email delivery fails or is unavailable, the API MUST respond with a success-shaped HTTP 202 — the message was received and the visitor does not need to retry.

#### Scenario: Email service failure

- GIVEN a validated contact submission
- WHEN persistence succeeds but the email service is unavailable
- THEN the message MUST still be persisted to Postgres
- AND the API MUST return HTTP 202 with a body/message of "received, delivery delayed", without exposing internal error details
- AND the visitor MUST NOT be prompted to retry

#### Scenario: Email service not configured

- GIVEN the `RESEND_API_KEY` environment variable is not set
- WHEN a valid contact submission is received
- THEN the message MUST still be persisted to Postgres
- AND the API MUST return HTTP 202 with a body/message of "received, delivery delayed"

#### Scenario: Persistence failure

- GIVEN a validated contact submission
- WHEN the Postgres persistence step itself fails
- THEN the API MUST return HTTP 503 with a friendly, generic message
- AND MUST NOT attempt email delivery

### Requirement: Rate Limiting

The contact endpoint MUST enforce a rate limit per client to prevent abuse, keyed by `ip_hash` — an HMAC-SHA256 of the client IP, keyed by the server-side secret `VISITOR_HASH_SECRET`. The concrete limit is 3 requests / 10 min, per the `security` capability (single source of truth for concrete limits). `ip_hash` is also persisted alongside each contact message for abuse investigation purposes (see Data Retention).

#### Scenario: Rate limit exceeded

- GIVEN a client has exceeded the allowed submission rate
- WHEN another request arrives from that client
- THEN the system MUST return HTTP 429
- AND MUST NOT persist or email that submission

### Requirement: Spam Mitigation

The contact form MUST include a honeypot field; submissions with the honeypot field populated MUST be silently rejected.

#### Scenario: Honeypot triggered

- GIVEN a bot fills the hidden honeypot field
- WHEN the form is submitted
- THEN the system MUST reject the submission without persisting or emailing
- AND MUST return a response byte-identical to the success response (HTTP 200, body `{status: "sent"}`) to avoid signaling detection to bots

### Requirement: No PII Leakage in Responses

API responses MUST NOT echo back stored message IDs, database errors, or other internal/PII details beyond generic success/failure status.

### Requirement: Data Retention

`contact_messages.ip_hash` is retained alongside the message record indefinitely, for abuse investigation purposes. Contact messages MAY be purged manually; there is no automated purge job in v1 — this is a documented decision, not an omission. `rate_limits` rows are purgeable after their window elapses (cleanup is opportunistic, not required to run on a schedule).

### Requirement: Privacy Disclosure

The site MUST include a privacy disclosure, accessible via a footer note linking to a short `/{locale}/privacy` page, covering contact message storage (name, email, message, `ip_hash`) and hashed-visitor engagement dedupe (`visitor_hash`). The privacy page MUST state a contact email address visitors can use to request data deletion. Deletion requests affecting engagement data are honored by recomputing the requester's `visitor_hash` (from the identifying IP/UA they provide) and deleting the matching `article_views`/`article_reactions` rows.

#### Scenario: Privacy page accessible from footer

- GIVEN a visitor is on any page
- WHEN they look at the footer
- THEN a link to `/{locale}/privacy` MUST be present
- AND the privacy page MUST describe contact message storage and hashed-visitor engagement dedupe

#### Scenario: Privacy page states a deletion contact

- GIVEN a visitor opens the `/{locale}/privacy` page
- WHEN they read it
- THEN it MUST display a contact email address for data-deletion requests
