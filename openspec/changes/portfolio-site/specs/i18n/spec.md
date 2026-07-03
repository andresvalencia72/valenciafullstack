# i18n Specification

## Purpose

Bilingual (es/en) locale routing and content resolution, with `es` as the default locale, coordinated with `blog` and `seo`.

## Requirements

### Requirement: Locale Routing

The system MUST route all public pages under a locale segment (e.g. `app/[locale]`) supporting `es` and `en`, with `es` as the default locale when none is specified.

#### Scenario: Default locale

- GIVEN a visitor requests `/`
- WHEN the request is resolved
- THEN the system MUST serve content in `es` (default locale)

#### Scenario: Explicit locale

- GIVEN a visitor requests `/en`
- WHEN the request is resolved
- THEN the system MUST serve content in `en`

### Requirement: Locale-Matched MDX Resolution

Content resolution for articles MUST select the MDX file matching the active locale, per the `blog` capability's per-locale file convention.

#### Scenario: Locale switch on article page

- GIVEN a visitor is viewing `/es/blog/my-post`
- WHEN they switch locale to `en`
- THEN the system MUST resolve and render the `en` MDX file for the same slug
- OR, if no `en` MDX file exists for that slug, MUST render the `es` content with a visible missing-translation notice per the `blog` capability's Missing-Translation Fallback requirement (no 404)

### Requirement: Locale Persistence on Navigation

Switching locale MUST preserve the visitor's current page/section rather than redirecting to the home page, whenever an equivalent route exists in the target locale.

#### Scenario: Locale switch preserves context

- GIVEN a visitor is scrolled to the "Projects" section on the home page in `es`
- WHEN they switch to `en`
- THEN the system MUST render the `en` home page
- AND SHOULD preserve scroll position to the equivalent section

### Requirement: SEO Metadata Consistency

Locale routes MUST emit metadata (hreflang alternates, sitemap entries) consistent with the `seo` capability for every route that exists in both locales. For a route where the article exists in only one locale (per the `blog` capability's Missing-Translation Fallback), the canonical and hreflang tags MUST point to the locale that actually has content, and the missing locale MUST NOT be declared as an alternate.

#### Scenario: Hreflang alternates present

- GIVEN a page exists in both `es` and `en`
- WHEN its HTML head is inspected
- THEN it MUST include `hreflang` link tags for both locale variants

#### Scenario: Canonical points to available-content locale when translation is missing

- GIVEN an article exists only in `es` and is served with a fallback notice at `/en/blog/my-post`
- WHEN the HTML head for `/en/blog/my-post` is inspected
- THEN the canonical URL MUST point to `/es/blog/my-post`
- AND no `hreflang="en"` alternate MUST be declared for that slug
