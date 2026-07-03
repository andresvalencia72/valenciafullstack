# Contact Specification

## Purpose

Validated contact form delivering real email notifications via an API route, with messages persisted to Postgres.

## Requirements

### Requirement: Server-Side Input Validation

The contact API route MUST validate all input (name, email, message) with a Zod schema and MUST reject invalid requests with a 400 response before any persistence or email attempt.

#### Scenario: Valid submission

- GIVEN a visitor submits name, valid email, and a non-empty message
- WHEN the API route processes the request
- THEN validation MUST pass
- AND the message MUST be persisted to Postgres
- AND an email notification MUST be sent via the configured email service

#### Scenario: Invalid email format

- GIVEN a visitor submits an invalid email address
- WHEN the API route processes the request
- THEN the system MUST return HTTP 400 with a validation error
- AND MUST NOT persist the message or send an email

### Requirement: Message Persistence Independent of Email Delivery

The system MUST persist a valid contact message to Postgres even if the email delivery step subsequently fails.

#### Scenario: Email service failure

- GIVEN a validated contact submission
- WHEN the email service is unavailable
- THEN the message MUST still be persisted to Postgres
- AND the API MUST return a response indicating degraded delivery without exposing internal error details

### Requirement: Rate Limiting

The contact endpoint MUST enforce a rate limit per client to prevent abuse.

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
- AND SHOULD return a success-like response to avoid signaling detection to bots

### Requirement: No PII Leakage in Responses

API responses MUST NOT echo back stored message IDs, database errors, or other internal/PII details beyond generic success/failure status.
