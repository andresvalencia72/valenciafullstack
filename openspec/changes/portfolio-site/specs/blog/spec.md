# Blog Specification

## Purpose

Bilingual article detail pages at `/blog/[slug]`, rendered from MDX. No blog index page or CMS.

## Requirements

### Requirement: MDX Article Rendering

The system MUST render an article detail page at `/blog/[slug]` from a locale-matched MDX file. Each article MUST have at most one MDX file per locale; at least one locale MUST exist.

#### Scenario: Article renders in requested locale

- GIVEN an MDX file exists for slug `my-post` in locale `es`
- WHEN a visitor requests `/es/blog/my-post`
- THEN the page MUST render content from the `es` MDX file

### Requirement: Missing-Translation Fallback

The system MUST NOT return a 404 for a locale-specific article URL when the article exists in the other supported locale. Instead, it MUST render the available locale's content and MUST display a visible notice stating the article is only available in that locale.

#### Scenario: Missing translation falls back to available locale

- GIVEN an MDX file exists for slug `my-post` in `es` but not `en`
- WHEN a visitor requests `/en/blog/my-post`
- THEN the system MUST render the `es` content at that URL
- AND MUST display a visible notice (e.g. "This article is only available in Spanish")
- AND MUST NOT return a 404 response

#### Scenario: Article missing in both locales

- GIVEN no MDX file exists for slug `my-post` in either `es` or `en`
- WHEN a visitor requests `/en/blog/my-post` or `/es/blog/my-post`
- THEN the system MUST return a 404 response

### Requirement: Frontmatter Validation

Article frontmatter MUST be validated with a single canonical Zod schema at build/read time: `title` (string, required), `description` (string, required), `date` (ISO date, required), `category` (single string, required — drives the `article-filter` category pills), `tags` (string array, optional — rendered as pills on the article page), `cover` (optional). `category` and `tags` values are stable, slug-like identifiers shared across locales (not translated text); display labels for them MUST be resolved through i18n message catalogs, not stored as locale-specific frontmatter. The content pipeline MUST additionally validate every article's `category` id against the i18n category catalog at build time and MUST fail the build if a `category` id has no corresponding catalog label (per the `article-filter` capability's Category Filtering requirement).

The article's slug (derived from its `content/blog/{slug}` folder name) MUST NOT be `views` or `reactions` — these are reserved because they would shadow the `engagement` API routes (`/api/engagement/views`, `/api/engagement/reactions`).

#### Scenario: Valid frontmatter

- GIVEN an MDX file with all required frontmatter fields
- WHEN the article is loaded
- THEN validation MUST pass and the article MUST render

#### Scenario: Invalid frontmatter

- GIVEN an MDX file missing a required frontmatter field
- WHEN the article is loaded
- THEN the system MUST fail the build (or reject at request time in dev) with a clear validation error
- AND MUST NOT render partial/malformed content

#### Scenario: Reserved slug rejected

- GIVEN a `content/blog/views/` or `content/blog/reactions/` folder exists
- WHEN the content pipeline loads articles
- THEN the system MUST fail the build with a clear validation error identifying the reserved slug

#### Scenario: Category id with no catalog label fails the build

- GIVEN an article's `category` frontmatter value has no corresponding entry in the i18n category catalog
- WHEN the content pipeline runs
- THEN the build MUST fail with a clear validation error identifying the unresolvable category id and slug

### Requirement: Cross-Locale Frontmatter Consistency

Locale siblings of the same slug MUST agree on `category`, `date`, and `tags`. The content pipeline MUST fail the build when locale siblings diverge on any of these fields.

#### Scenario: Divergent category across locales fails the build

- GIVEN `my-post` exists in both `es` and `en` with different `category` values
- WHEN the content pipeline runs
- THEN the build MUST fail with a clear validation error identifying the divergent field and slug

### Requirement: No Blog Index Route

The system MUST NOT expose a `/blog` index page, at any locale prefix. Article discovery happens only via the home page articles list.

#### Scenario: Blog index requested

- GIVEN a visitor requests `/blog` (no locale prefix)
- WHEN the request is resolved
- THEN the middleware MUST respond with an HTTP 308 redirect to `/es/blog`, per the `i18n` capability's Locale Routing requirement (the unprefixed-path rule applies to `/blog` the same as any other route)
- AND both `/es/blog` and `/en/blog` MUST return a 404 response (no index route exists at either locale)
