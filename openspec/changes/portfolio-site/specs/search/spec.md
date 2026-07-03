# Search Specification

## Purpose

Article full-text search backed by native Postgres full-text search (tsvector via Drizzle). No external search service.

## Requirements

### Requirement: Full-Text Query

The system MUST support searching articles by free-text query using Postgres `tsvector`/`tsquery`, matching against article title and body content.

#### Scenario: Matching query

- GIVEN articles exist containing the term "hexagonal architecture"
- WHEN a visitor searches for "hexagonal"
- THEN the results MUST include those articles

### Requirement: Relevance Ranking

Search results MUST be ordered by relevance rank (e.g. `ts_rank`), most relevant first.

#### Scenario: Ranked results

- GIVEN multiple articles match a query with differing term frequency
- WHEN results are returned
- THEN the article with higher relevance rank MUST appear before lower-ranked matches

### Requirement: Input Validation and Rate Limiting

The search endpoint MUST validate the query parameter with Zod (non-empty, max length) and MUST enforce rate limiting per client.

#### Scenario: Oversized query rejected

- GIVEN a search query exceeds the configured max length
- WHEN the endpoint processes the request
- THEN the system MUST return HTTP 400 without executing the search

### Requirement: No-Match Handling

WHEN a search query returns no results, the system MUST return an empty result set with a 200 response, not an error.

#### Scenario: No results found

- GIVEN no articles match the query "xyzzyplugh"
- WHEN the search is executed
- THEN the response MUST contain an empty results array
- AND the UI MUST display a locale-appropriate empty-state message
