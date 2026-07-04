# Search Specification

## Purpose

Article full-text search backed by native Postgres full-text search (tsvector via Drizzle). No external search service.

## Requirements

### Requirement: Full-Text Query

The search endpoint MUST accept a validated `locale` param (enum `es`/`en`) and MUST support searching articles by free-text query using Postgres full-text search; matching covers title, description, and body, filtered to the requested locale. The `tsvector` column and the search query MUST use the locale's PostgreSQL regconfig (`'spanish'` for `es`, `'english'` for `en`), with `title` weighted `A`, `body_text` weighted `B`, and `description` weighted `C`. The query MUST be parsed with `websearch_to_tsquery` (never raw `to_tsquery`), so arbitrary user input cannot raise a syntax error. Each result item in the response MUST include `{slug, title, description, category, locale, url}`.

#### Scenario: Matching query

- GIVEN articles exist containing the term "hexagonal architecture" in `es`
- WHEN a visitor searches `locale=es` for "hexagonal"
- THEN the results MUST include those `es` articles

#### Scenario: Locale filters results

- GIVEN an article slug has content in both `es` and `en`
- WHEN a visitor searches with `locale=en` for a term that only matches the `es` text
- THEN the `en` search MUST NOT return that article

#### Scenario: Query with special characters does not error

- GIVEN a search query contains characters with special meaning to `to_tsquery` (e.g. `&`, `|`, `:`)
- WHEN the query is parsed with `websearch_to_tsquery`
- THEN the system MUST NOT return a syntax error and MUST return a valid (possibly empty) result set

### Requirement: Relevance Ranking

Search results MUST be ordered by relevance rank (e.g. `ts_rank`), most relevant first.

#### Scenario: Ranked results

- GIVEN multiple articles match a query with differing term frequency
- WHEN results are returned
- THEN the article with higher relevance rank MUST appear before lower-ranked matches

### Requirement: Input Validation and Rate Limiting

The search endpoint MUST validate the query parameter with Zod (non-empty, max 200 characters) and the `locale` parameter (enum `es`/`en`), and MUST enforce rate limiting per client (`ip_hash`), per the concrete limit defined in the `security` capability (30 requests/min). The client-side search input MUST debounce user keystrokes by at least 300ms before issuing a request, to avoid triggering the rate limit under normal typing.

#### Scenario: Oversized query rejected

- GIVEN a search query exceeds the configured max length
- WHEN the endpoint processes the request
- THEN the system MUST return HTTP 400 without executing the search

#### Scenario: Invalid locale rejected

- GIVEN a request omits `locale` or supplies a value outside `es`/`en`
- WHEN the endpoint processes it
- THEN the system MUST return HTTP 400 without executing the search

### Requirement: No-Match Handling

WHEN a search query returns no results, the system MUST return an empty result set with a 200 response, not an error.

#### Scenario: No results found

- GIVEN no articles match the query "xyzzyplugh"
- WHEN the search is executed
- THEN the response MUST contain an empty results array
- AND the UI MUST display a locale-appropriate empty-state message

### Requirement: Index Sync Full Reconcile

The build-time sync script MUST perform a full reconcile against `content/`: it MUST upsert rows for all current (slug, locale) MDX files AND prune `article_search` rows whose (slug, locale) no longer exists in `content/`. An upsert-only sync that never prunes does not satisfy this requirement.

#### Scenario: Removed article is pruned from the index

- GIVEN `article_search` contains a row for a (slug, locale) whose MDX file has been deleted from `content/`
- WHEN the sync script runs
- THEN that row MUST be deleted from `article_search`

### Requirement: Graceful Degradation When Database Unavailable

WHEN Postgres is unavailable, the search API endpoint MUST return HTTP 503. The home page's search input MUST render normally as static HTML on initial load — the server-rendered page MUST NOT probe database health to decide whether to render the input. The client MUST detect the 503 response and disable the search input or show an empty/error state only in reaction to a failed API call.

#### Scenario: Database unavailable during search

- GIVEN Postgres is unreachable
- WHEN a visitor submits a search query
- THEN the search API MUST return HTTP 503
- AND the client MUST disable the search input or show an empty-state message in response to the failed call
- AND the rest of the page MUST continue to render and function normally
