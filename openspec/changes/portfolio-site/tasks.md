# Tasks: Portfolio Site for Andrés Valencia

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~4000-6000 total across 11 slices; individual slices ~250-700 (PR1 and PR5 highest risk) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 -> PR2 -> ... -> PR11 (see Suggested Work Units) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (orchestrator to ask user: stacked-to-main vs feature-branch-chain) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold + test runner + CI skeleton | PR1 | Base for all; generated files (lockfile, boilerplate) likely need `size:exception` even after chaining |
| 2 | Design system tokens + theme + i18n shell | PR2 | Base = PR1 |
| 3 | Home sections + article filter | PR3 | Base = PR2; largest UI slice (~600-800 lines), consider splitting hero/about/skills vs projects/articles/contact if it grows |
| 4 | Blog MDX + article route | PR4 | Base = PR2; can run parallel to PR3 |
| 5 | Persistence foundation (schema, migration, repo interfaces+impls) | PR5 | Base = PR1; consider splitting 5a schema/migration vs 5b repo impls if >500 lines |
| 6 | Contact API + form | PR6 | Base = PR5 |
| 7 | Engagement (views/reactions) | PR7 | Base = PR5; independent of PR6 |
| 8 | Search (sync script + FTS API) | PR8 | Base = PR5, PR4 |
| 9 | SEO pack (OG, RSS, sitemap) | PR9 | Base = PR4, PR3 |
| 10 | GitHub activity (last slice) | PR10 | Base = PR3 |
| 11 | Hardening: headers, Lighthouse, coverage gate, ADRs | PR11 | Base = all prior |

## Phase 1: Scaffolding & CI (PR1)

- [ ] 1.1 `git init`; scaffold Next.js App Router + TS + Tailwind
- [ ] 1.2 Install/configure Vitest, Testing Library, Playwright (vitest.config.ts, playwright.config.ts)
- [ ] 1.3 ESLint boundaries plugin enforcing domain/application/infra/ui import rules
- [ ] 1.4 `shared/config/env.ts` Zod env schema, fail-fast on missing vars
- [ ] 1.5 `shared/db/client.ts` Drizzle client + `docker-compose.yml` Postgres
- [ ] 1.6 GitHub Actions: unit+integration, Playwright, coverage 80%, Lighthouse stub
- [ ] 1.7 README badge placeholders; `docs/adr/0001-0006` stubs from design.md

## Phase 2: Design System & i18n (PR2)

- [ ] 2.1 `shared/ui/tokens.css` light/dark tokens from `design-reference/`
- [ ] 2.2 `next/font/local`: Clash Display + General Sans
- [ ] 2.3 TDD: theme toggle + no-flash inline script (design-system: Theme Toggle)
- [ ] 2.4 next-intl setup, `app/[locale]` layout, `es` default (i18n: Locale Routing)
- [ ] 2.5 TDD: scroll progress indicator (design-system: Scroll Progress)
- [ ] 2.6 TDD: reveal/tilt/magnetic motion + reduced-motion (design-system: Motion Interactions)

## Phase 3: Home Page & Article Filter (PR3)

- [ ] 3.1 TDD: `features/home/ui` sections hero..footer (home-page: Section Composition)
- [ ] 3.2 TDD: anchor nav smooth scroll (home-page: In-Page Navigation)
- [ ] 3.3 TDD: embedded articles list wiring to blog feature (home-page: Embedded Article List)
- [ ] 3.4 TDD: filter pills + "All" + empty-state (article-filter: Category Filtering/Reset/Empty Result)
- [ ] 3.5 Playwright: home responsive layout across breakpoints (home-page: Responsive Layout)

## Phase 4: Blog (PR4)

- [ ] 4.1 `shared/content` MDX loader + Zod frontmatter schema (blog: Frontmatter Validation)
- [ ] 4.2 TDD: `app/[locale]/blog/[slug]/page.tsx` renders matched-locale MDX (blog: MDX Article Rendering)
- [ ] 4.3 TDD: missing-translation fallback notice, no 404 (blog: Missing-Translation Fallback)
- [ ] 4.4 TDD: 404 when both locales missing; 404 for `/blog` index (blog: No Blog Index Route)

## Phase 5: Persistence Foundation (PR5)

- [ ] 5.1 `shared/db/schema.ts`: contact_messages, article_views, article_reactions (enum thumbs_up/heart/fire), article_search
- [ ] 5.2 `drizzle-kit generate`, commit migration (persistence: Versioned Schema)
- [ ] 5.3 TDD: repo interfaces per feature domain, zero drizzle imports (persistence: Domain Repository Interfaces)
- [ ] 5.4 TDD: Drizzle repo impls per feature infrastructure, pglite tests (persistence: Infrastructure Repository Implementations)

## Phase 6: Contact (PR6)

- [ ] 6.1 TDD: `app/api/contact/route.ts` Zod validation, 400 on invalid (contact: Server-Side Input Validation)
- [ ] 6.2 TDD: persist + Resend email; degraded-delivery response on email failure (contact: Message Persistence Independent of Email Delivery)
- [ ] 6.3 TDD: Postgres fixed-window rate limit (ip_hash) + honeypot silent reject (contact: Rate Limiting, Spam Mitigation)
- [ ] 6.4 TDD: contact form ui, generic-only error responses (contact: No PII Leakage)
- [ ] 6.5 Playwright: contact submit flow (quality-pipeline: E2E Test Gate)

## Phase 7: Engagement (PR7)

- [ ] 7.1 TDD: hashed visitor key value object, IP+UA, no cookies (engagement: Privacy-Respecting Visitor Identity)
- [ ] 7.2 TDD: `app/api/engagement/views/route.ts` atomic increment + dedupe window (engagement: View Counting with Dedupe)
- [ ] 7.3 TDD: `app/api/engagement/reactions/route.ts` Zod enum thumbs_up/heart/fire, per-type dedupe (engagement: Reactions with Dedupe, Endpoint Validation)
- [ ] 7.4 TDD: public aggregate counts read, no identifiers exposed (engagement: Public Read of Aggregate Counts)

## Phase 8: Search (PR8)

- [ ] 8.1 `scripts/sync-search.ts`: parse MDX, strip to body_text, upsert article_search + search_vector
- [ ] 8.2 TDD: search route, Zod query validation + rate limit (search: Input Validation and Rate Limiting)
- [ ] 8.3 TDD: `to_tsquery`/`ts_rank` ordering, empty-state on no match (search: Full-Text Query, Relevance Ranking, No-Match Handling)

## Phase 9: SEO (PR9)

- [ ] 9.1 TDD: `app/og/[slug]/route.tsx` OG image per article+locale (seo: Dynamic OG Images) — note: add locale param, design's route lacks one
- [ ] 9.2 TDD: `app/rss.xml/route.ts` entry per article per locale (seo: RSS Feed)
- [ ] 9.3 TDD: `app/sitemap.ts` bilingual hreflang pairing, excludes missing-locale slugs (seo: Bilingual Sitemap; i18n: SEO Metadata Consistency)

## Phase 10: GitHub Activity (PR10)

- [ ] 10.1 `features/github-activity/infrastructure` GitHub API client with GITHUB_TOKEN
- [ ] 10.2 TDD: ISR section, `revalidate: 3600`, non-blocking render (github-activity: ISR Caching, Non-Blocking Render)
- [ ] 10.3 TDD: fallback panel on API error/timeout (github-activity: Graceful Failure Handling)

## Phase 11: Hardening & Verify (PR11)

- [ ] 11.1 Security headers via middleware/next.config: CSP, HSTS, X-Content-Type-Options, frame-ancestors (security: Security Headers)
- [ ] 11.2 TDD: verify no secrets in client bundle (security: No Client-Side Secrets)
- [ ] 11.3 Wire Lighthouse CI budget + coverage gate 80%, update README badges (quality-pipeline)
- [ ] 11.4 Full Playwright pass: locale switch, theme, filter, contact, article view (quality-pipeline: E2E Test Gate)
- [ ] 11.5 Finalize `docs/adr/0001-0006` rationale from design.md ADR table
