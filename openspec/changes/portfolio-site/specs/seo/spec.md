# SEO Specification

## Purpose

Dynamic Open Graph images per article, RSS feed, and a bilingual sitemap with hreflang, coordinated with the `i18n` capability.

## Requirements

### Requirement: Dynamic OG Images

Every published article MUST have a dynamically generated Open Graph image produced via `next/og`, reflecting the article's title and locale.

#### Scenario: OG image for article

- GIVEN an article exists for slug `my-post` in locale `en`
- WHEN `/en/blog/my-post/opengraph-image` (or equivalent route) is requested
- THEN an image MUST be generated containing the article title

#### Scenario: OG image for missing-translation fallback

- GIVEN an article exists only in `es` and is served with a fallback notice at `/en/blog/my-post` (per the `blog` capability's Missing-Translation Fallback requirement)
- WHEN the OG image route for `/en/blog/my-post` is requested
- THEN the system MUST serve the OG image generated for the `es` (content) locale

### Requirement: RSS Feed

The system MUST expose a separate RSS feed per locale at `/{locale}/rss.xml`. Each locale's feed MUST contain only articles that have an MDX file in that locale — it MUST NOT include fallback entries for articles missing a translation. Each feed's channel language MUST be set to match its locale.

#### Scenario: RSS feed lists articles

- GIVEN published articles exist in both locales
- WHEN `/es/rss.xml` is requested
- THEN the feed MUST be well-formed XML
- AND MUST include an entry for every article that has an `es` MDX file, and no others

#### Scenario: Article missing a locale is excluded from that locale's feed

- GIVEN an article slug exists only in `es`
- WHEN `/en/rss.xml` is requested
- THEN the feed MUST NOT include an entry for that slug

### Requirement: Bilingual Sitemap with Hreflang

The sitemap MUST include all public routes for both locales and MUST declare `hreflang` alternate links pairing each route's `es` and `en` versions, plus an `x-default` alternate. For routes with content in both locales, `x-default` MUST point to the `es` (default locale) URL. For a route where content exists in only one locale, `x-default` MUST instead point to that content-bearing locale's URL — never to a locale with no content — consistent with the routing defined by the `i18n` capability.

#### Scenario: Sitemap hreflang pairing

- GIVEN an article exists in both `es` and `en`
- WHEN the sitemap is generated
- THEN the `es` entry MUST declare an `hreflang="en"` alternate pointing to the `en` URL
- AND vice versa

#### Scenario: x-default hreflang present for a bilingual route

- GIVEN a route with content in both `es` and `en`
- WHEN the sitemap or page head is inspected
- THEN an `hreflang="x-default"` alternate MUST be present pointing to the `es` URL

#### Scenario: Article missing the en locale (es-only)

- GIVEN an article slug exists only in `es` (the `en` URL renders a fallback per the `blog` capability's Missing-Translation Fallback requirement, not a 404)
- WHEN the sitemap is generated
- THEN the sitemap MUST NOT include a separate `en` entry or hreflang alternate for that slug
- AND the `es` entry's canonical MUST be the sole indexed URL for that slug
- AND the `es` entry MUST still declare a self-referencing `hreflang="es"` alternate and an `hreflang="x-default"` alternate, both pointing to itself, and no alternate is emitted for the missing `en` locale

#### Scenario: Article missing the es locale (en-only)

- GIVEN an article slug exists only in `en` (no `es` MDX file exists for that slug)
- WHEN the sitemap is generated
- THEN the sitemap MUST NOT include a separate `es` entry or hreflang alternate for that slug
- AND the `en` entry's canonical MUST be the sole indexed URL for that slug
- AND the `en` entry MUST declare a self-referencing `hreflang="en"` alternate and an `hreflang="x-default"` alternate, both pointing to itself — x-default points to the content-bearing locale (`en`), not `es` — and no alternate is emitted for the missing `es` locale
