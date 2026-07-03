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

Every endpoint that writes data (contact, engagement) or executes a database query on user input (search) MUST enforce rate limiting per client.

#### Scenario: Rate limit enforced

- GIVEN a client exceeds the configured request threshold for an endpoint
- WHEN they issue another request within the window
- THEN the system MUST return HTTP 429 and MUST NOT execute the underlying operation

### Requirement: No PII or Internal Detail Leakage

API error responses MUST NOT include stack traces, raw database errors, or personally identifiable information beyond what the requester already submitted.

#### Scenario: Internal error sanitized

- GIVEN an unexpected server error occurs while processing a request
- WHEN the error response is returned
- THEN the body MUST contain a generic error message only

### Requirement: Security Headers

The application MUST set security headers (at minimum: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options or equivalent frame-ancestors policy) on all responses.

#### Scenario: Headers present

- GIVEN any page or API response
- WHEN response headers are inspected
- THEN the required security headers MUST be present with restrictive values

### Requirement: No Client-Side Secrets

No API keys, database credentials, or other secrets MUST be exposed to client-side bundles. Secrets MUST only be read from server-side environment variables.

#### Scenario: Client bundle inspected

- GIVEN the production client JavaScript bundle
- WHEN it is inspected for secret values (email API key, DB connection string, GitHub token)
- THEN none MUST be present

### Requirement: Hashed Visitor Keys, No Tracking Cookies

Engagement deduplication MUST use hashed visitor keys and MUST NOT set tracking cookies, per the `engagement` capability.

#### Scenario: No engagement tracking cookie

- GIVEN a visitor interacts with view/reaction endpoints
- WHEN response cookies are inspected
- THEN no tracking cookie MUST be present
