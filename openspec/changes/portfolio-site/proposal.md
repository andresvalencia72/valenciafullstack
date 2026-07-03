# Proposal: Portfolio Site for Andrés Valencia

## Intent

Build a greenfield bilingual (es/en) personal portfolio for Andrés Valencia that doubles as a recruiter-facing proof of engineering quality. The site itself is the product; how it is built (readable architecture, visible test coverage, documented decisions, security) is equally in scope. No portfolio exists today — the repo is empty.

## Scope

### In Scope
- Single-page home scroller: hero, stack strip, about, skills bento, projects (alternating cards), articles list, contact, footer.
- Article detail route `/blog/[slug]` rendered from MDX (two files per article, one per locale).
- Functional category filter pills over the home article list.
- Real contact email delivery via an email service (Resend or similar) behind a Next.js API route, with messages persisted to Postgres.
- Per-article view counter and reactions backed by Postgres, with privacy-respecting deduplication (hashed visitor key, no tracking cookies).
- Postgres + Drizzle ORM + Zod as the persistence/validation stack, accessed through repository interfaces so domain code stays storage-agnostic.
- SEO pack: dynamic Open Graph images per article (next/og), RSS feed, bilingual sitemap with hreflang.
- Article full-text search using native Postgres FTS (tsvector via Drizzle), no external search service.
- GitHub activity feed (contributions/repos) via GitHub API with ISR caching (planned as the last implementation slice).
- Visible quality pipeline: GitHub Actions running tests, Playwright e2e, and Lighthouse CI with performance budget.
- i18n (es/en) from day one via next-intl or equivalent.
- Design system from `design-reference/`: fonts, light+dark tokens, theme toggle (localStorage), scroll progress, reveal/tilt/magnetic motion.
- Security as product scope: input validation, rate limiting on contact, security headers, no client-side secrets.
- Strict TDD: test runner lands in scaffolding before feature code; red-green-refactor throughout.

### Out of Scope (possible future changes)
- Dedicated `/blog` index page; project detail pages.
- CMS, comments, analytics dashboards, newsletter.

## Capabilities

### New Capabilities
- `home-page`: single-page scroller sections and interactions.
- `blog`: MDX-backed bilingual articles at `/blog/[slug]`.
- `article-filter`: functional category filtering on the home list.
- `contact`: validated contact form with email delivery API route and Postgres persistence.
- `engagement`: per-article views and reactions stored in Postgres with privacy-respecting dedupe.
- `persistence`: Postgres + Drizzle schema, migrations, and repository implementations behind domain interfaces.
- `seo`: dynamic OG images, RSS feed, bilingual sitemap with hreflang.
- `search`: article full-text search backed by Postgres FTS.
- `github-activity`: cached GitHub contributions/repos feed (last slice).
- `quality-pipeline`: CI with tests, e2e, and Lighthouse performance budget.
- `i18n`: es/en locale routing and content.
- `design-system`: tokens, themes, typography, motion.
- `security`: validation, rate limiting, headers for endpoints.

### Modified Capabilities
None.

## Approach

Next.js App Router + TypeScript + Tailwind. Screaming architecture at top level (folders by feature: blog, contact, engagement, home sections) with clean layering (domain/application/infrastructure/ui) inside each feature; design patterns named explicitly, ADR-style decisions in design phase. Tokens derived from `design-reference/`.

Hybrid content strategy (ADR): article content stays in MDX (static, versioned, no authoring users); dynamic data lives in Postgres accessed via Drizzle ORM behind repository interfaces — the domain layer never imports Drizzle. Zod validates at every boundary (API routes, env, MDX frontmatter). Contact flow: client form → validated API route → persist message to Postgres → email notification via email service, rate-limited. Engagement flow: view/reaction endpoints with atomic increments and hashed-visitor dedupe.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| repo root | New | Scaffold Next.js + test runner |
| `src/features/*` | New | Feature-sliced clean architecture |
| `app/`, `app/[locale]/blog/[slug]` | New | Routes + layouts |
| `app/api/contact` | New | Validated, rate-limited endpoint: persist + email |
| `app/api/engagement/*` | New | View counter and reaction endpoints |
| `src/features/*/infrastructure` | New | Drizzle repositories, schema, migrations |
| `content/blog/*` | New | Bilingual MDX articles |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing content (copy, images, YouTube IDs, CV) | High | Ship placeholders; content does not block implementation |
| Email service abuse | Med | Rate limiting, validation, honeypot |
| Slice exceeds ~400 lines | Med | ask-on-risk: flag and split into chained PRs |
| Design fidelity vs. accessibility | Med | Derive tokens carefully; verify contrast |

## Rollback Plan

Greenfield: no production to break. Each capability lands behind its own PR/slice; revert the offending PR. If email service misbehaves, disable the API route (form degrades gracefully) without touching the rest of the site.

## Dependencies

- Email service account + API key (env only).
- Postgres database (local via Docker for dev; hosted instance — e.g. Neon/Supabase — for production). Connection string in env only.
- User-provided content (non-blocking; placeholders until delivered).

## Success Criteria
- [ ] Home + `/blog/[slug]` render in es and en with working theme toggle.
- [ ] Contact form delivers real email; endpoint validated, rate-limited, header-hardened.
- [ ] Category filter pills actually filter the article list.
- [ ] Views and reactions persist and dedupe correctly; contact messages stored in Postgres.
- [ ] Article search returns relevant results via Postgres FTS.
- [ ] Every article ships a dynamic OG image; RSS and bilingual sitemap validate.
- [ ] GitHub activity renders from cached API data without blocking page load.
- [ ] CI pipeline green: unit tests, e2e, Lighthouse budget — visible via README badges.
- [ ] Test runner in place; feature code built red-green-refactor with coverage ≥ 80%.
- [ ] Recruiter-showcase: architecture is readable and feature-sliced, tests visible, decisions documented (ADR-style).
