# GitHub Activity Specification

## Purpose

Cached GitHub contributions/repos feed rendered on the site, fetched via the GitHub API with ISR caching. Implemented as the last slice.

## Requirements

### Requirement: Server-Side GitHub Data Fetch

The system MUST fetch GitHub contributions and repository data server-side via the GitHub API.

#### Scenario: Fetch succeeds

- GIVEN valid GitHub API credentials are configured
- WHEN the feed section is rendered
- THEN contributions and repository data MUST be fetched server-side and rendered

### Requirement: ISR Caching

The GitHub activity data MUST be cached using Incremental Static Regeneration with a defined revalidation interval, to avoid exceeding GitHub API rate limits.

#### Scenario: Cached response reused

- GIVEN the revalidation window has not elapsed
- WHEN the page is requested again
- THEN the system MUST serve the cached data without issuing a new GitHub API call

### Requirement: Non-Blocking Render

The GitHub activity section MUST NOT block or delay the initial render of the rest of the home page.

#### Scenario: GitHub API is slow

- GIVEN the GitHub API response is delayed
- WHEN the home page is requested
- THEN the rest of the page MUST render without waiting on the GitHub activity section
- AND the section MUST display a loading state until data resolves

### Requirement: Graceful Failure Handling

WHEN the GitHub API call fails or credentials are missing, the system MUST render a fallback state instead of crashing the page.

#### Scenario: GitHub API failure

- GIVEN the GitHub API returns an error or times out
- WHEN the activity section attempts to render
- THEN the system MUST show a fallback/error placeholder
- AND MUST NOT throw an unhandled error that breaks the rest of the page
