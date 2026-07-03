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

### Requirement: RSS Feed

The system MUST expose an RSS feed listing published articles, with entries reflecting locale-specific content.

#### Scenario: RSS feed lists articles

- GIVEN published articles exist in both locales
- WHEN the RSS feed endpoint is requested
- THEN the feed MUST be well-formed XML
- AND MUST include an entry per published article per locale

### Requirement: Bilingual Sitemap with Hreflang

The sitemap MUST include all public routes for both locales and MUST declare `hreflang` alternate links pairing each route's `es` and `en` versions, consistent with the routing defined by the `i18n` capability.

#### Scenario: Sitemap hreflang pairing

- GIVEN an article exists in both `es` and `en`
- WHEN the sitemap is generated
- THEN the `es` entry MUST declare an `hreflang="en"` alternate pointing to the `en` URL
- AND vice versa

#### Scenario: Article missing one locale

- GIVEN an article slug exists only in `es` (the `en` URL renders a fallback per the `blog` capability's Missing-Translation Fallback requirement, not a 404)
- WHEN the sitemap is generated
- THEN the sitemap MUST NOT include a separate `en` entry or hreflang alternate for that slug
- AND the `es` entry's canonical MUST be the sole indexed URL for that slug
