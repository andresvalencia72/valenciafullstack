# Engagement Specification

## Purpose

Per-article view counters and reactions backed by Postgres, with privacy-respecting deduplication.

## Requirements

### Requirement: View Counting with Dedupe

The system MUST increment an article's view count atomically, at most once per unique hashed visitor key within a defined dedupe window.

#### Scenario: First view

- GIVEN a visitor with no prior recorded view of article `my-post`
- WHEN they view the article
- THEN the view count MUST increment by exactly one

#### Scenario: Repeat view within window

- GIVEN the same visitor's hashed key already recorded a view of `my-post` within the dedupe window
- WHEN they view the article again
- THEN the view count MUST NOT increment again

### Requirement: Reactions with Dedupe

The system MUST allow visitors to react to an article using exactly one of a fixed enum of three reaction types: `thumbs_up` (👍), `heart` (❤️), `fire` (🔥). No other reaction type MUST be accepted. The system MUST apply the same hashed-visitor dedupe rule as view counting per reaction type.

#### Scenario: Add reaction

- GIVEN a visitor has not reacted to article `my-post` with type `thumbs_up`
- WHEN they submit a `thumbs_up` reaction
- THEN the reaction count for `thumbs_up` MUST increment by one

#### Scenario: Duplicate reaction

- GIVEN a visitor already reacted with `thumbs_up` on `my-post`
- WHEN they submit the same reaction again
- THEN the count MUST NOT increment again

#### Scenario: Visitor reacts with a different type on the same article

- GIVEN a visitor already reacted with `thumbs_up` on `my-post`
- WHEN they submit a `heart` reaction on the same article
- THEN the reaction count for `heart` MUST increment by one independently of `thumbs_up`

### Requirement: Privacy-Respecting Visitor Identity

The system MUST derive the dedupe key by hashing visitor-identifying signals (e.g. IP + user agent) and MUST NOT use tracking cookies or persist raw identifying data.

#### Scenario: No tracking cookie set

- GIVEN a visitor views or reacts to an article
- WHEN the response is inspected
- THEN no tracking cookie MUST be set for engagement purposes

### Requirement: Endpoint Validation and Rate Limiting

Engagement endpoints MUST validate input (article slug, reaction type) with a Zod enum restricted to `thumbs_up`, `heart`, `fire` and MUST enforce rate limiting per hashed visitor key.

#### Scenario: Invalid reaction type

- GIVEN a request submits a reaction type outside `thumbs_up`, `heart`, `fire` (e.g. "like")
- WHEN the endpoint processes it
- THEN the system MUST return HTTP 400 and MUST NOT record the reaction

### Requirement: Public Read of Aggregate Counts

View and reaction counts MUST be publicly readable per article without exposing any visitor identifiers, hashed or otherwise.
