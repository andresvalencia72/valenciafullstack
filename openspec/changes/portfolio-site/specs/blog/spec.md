# Blog Specification

## Purpose

Bilingual article detail pages at `/blog/[slug]`, rendered from MDX. No blog index page or CMS.

## Requirements

### Requirement: MDX Article Rendering

The system MUST render an article detail page at `/blog/[slug]` from a locale-matched MDX file. Each article MUST have exactly one MDX file per supported locale.

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

Article frontmatter MUST be validated with a Zod schema (title, description, date, category, at minimum) at build/read time.

#### Scenario: Valid frontmatter

- GIVEN an MDX file with all required frontmatter fields
- WHEN the article is loaded
- THEN validation MUST pass and the article MUST render

#### Scenario: Invalid frontmatter

- GIVEN an MDX file missing a required frontmatter field
- WHEN the article is loaded
- THEN the system MUST fail the build (or reject at request time in dev) with a clear validation error
- AND MUST NOT render partial/malformed content

### Requirement: No Blog Index Route

The system MUST NOT expose a `/blog` index page. Article discovery happens only via the home page articles list.

#### Scenario: Blog index requested

- GIVEN a visitor requests `/blog` directly
- WHEN the route is resolved
- THEN the system MUST return a 404 (no index route exists)
