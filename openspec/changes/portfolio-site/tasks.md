# Tasks: Portfolio Site for Andrés Valencia

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~4000-6000 total across 13 slices; individual slices ~150-400 each after splitting PR3 and PR5 (PR1 scaffolding is the sole exception, likely exceeding 400 due to generated files/lockfile) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 -> PR2 -> PR3a -> PR4 -> PR3b -> PR5a -> PR5b -> PR6 -> PR7 -> PR8 -> PR9 -> PR10 -> PR11 (see Suggested Work Units) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (user-selected) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main (user-selected)
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold + test runner + CI skeleton | PR1 | Base for all; generated files (lockfile, boilerplate) likely need `size:exception` even after chaining |
| 2 | Design system tokens + theme + i18n shell | PR2 | Base = PR1 |
| 3a | Home sections part 1: hero, stack strip, about, skills bento | PR3a | Base = PR2 |
| 4 | Blog MDX + article route | PR4 | Base = PR2 |
| 3b | Home sections part 2: projects, articles list, article filter | PR3b | Base = PR4 (consumes the real MDX loader/article data shipped in PR4; no longer runs before it) |
| 5a | Persistence schema + migrations + db client wiring | PR5a | Base = PR1 |
| 5b | Persistence repository interfaces + implementations | PR5b | Base = PR5a |
| 6 | Contact API + form | PR6 | Base = PR5b |
| 7 | Engagement (views/reactions) | PR7 | Base = PR5b, PR4 (engagement mounts in the PR4 article page and validates slugs against the PR4 article set); independent of PR6 |
| 8 | Search (sync script + FTS API + UI) | PR8 | Base = PR5b, PR4, PR3b |
| 9 | SEO pack (OG, RSS, sitemap) | PR9 | Base = PR4, PR3b |
| 10 | GitHub activity (last slice) | PR10 | Base = PR3b |
| 11 | Hardening: headers, Lighthouse, coverage gate, ADRs | PR11 | Base = all prior |

**Chain-strategy note**: the Base column above is valid under `stacked-to-main` (the chosen strategy). Under `feature-branch-chain`, the linear suggested-split order (PR1 -> PR2 -> PR3a -> PR4 -> PR3b -> PR5a -> PR5b -> PR6 -> PR7 -> PR8 -> PR9 -> PR10 -> PR11) is authoritative instead, and each PR bases on its immediate predecessor in that order.

## Phase 1: Scaffolding & CI (PR1)

- [ ] 1.1 `git init`; scaffold Next.js App Router + TS + Tailwind
- [ ] 1.2 Install/configure Vitest, Testing Library, Playwright (vitest.config.ts, playwright.config.ts)
  - DoD: also update `openspec/config.yaml` `apply.test_command`, `verify.test_command`, and `verify.build_command` with the real commands
- [ ] 1.3 ESLint boundaries plugin enforcing domain/application/infra/ui import rules
- [ ] 1.4 `shared/config/env.ts` Zod env schema; fail-fast only on missing `DATABASE_URL` and `VISITOR_HASH_SECRET`; `RESEND_API_KEY`/`GITHUB_TOKEN` optional (persistence: Environment-Only Credentials)
- [ ] 1.5 `shared/db/client.ts` Drizzle client + `docker-compose.yml` Postgres
- [ ] 1.6 GitHub Actions: unit+integration (against pglite), Playwright e2e against a real **GitHub Actions Postgres service container** (`DATABASE_URL` points at it; this task ships the service container plus an empty seed-step skeleton only — seed steps land with their features, see 5a.2/8.1) — e2e flow list scoped to capabilities implemented to date, reaching the full set — home render, article view, contact submission — by the final slice; coverage gate (global 80% lines+branches over `src/**` and `scripts/**`, excluding `app/` route adapters, config files, generated code, and the declarative/IO-bootstrap files `shared/db/schema.ts` and `shared/db/client.ts`; configured deterministically — always enforced, automatically skips (passes) when zero coverage-eligible files exist under the configured scope, e.g. PR1 scaffolding — no manual flip, no separate PR2 task needed), Lighthouse stub (quality-pipeline: End-to-End Test Gate, Coverage Threshold) — task 1.6 is the single owner of the coverage gate config
- [ ] 1.7 README badge placeholders; `docs/adr/0001-0007` stubs from design.md
- [ ] 1.8 TDD: full security headers via `next.config` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS) plus the full CSP — `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'` (see design.md ADR-0007) — unit test on the config or e2e header assertion (security: Security Headers, baseline)

## Phase 2: Design System & i18n (PR2)

- [ ] 2.1 `shared/ui/tokens.css` light/dark tokens from `design-reference/`
- [ ] 2.2 `next/font/local`: Clash Display + General Sans
- [ ] 2.3 TDD: theme toggle + no-flash inline script (design-system: Theme Toggle)
- [ ] 2.4 next-intl setup, `app/[locale]` layout, `localePrefix: "always"`, `es` default, `/` and unprefixed paths 308-redirect to `es` (i18n: Locale Routing)
- [ ] 2.5 TDD: scroll progress indicator (design-system: Scroll Progress)
- [ ] 2.6 TDD: reveal/tilt/magnetic motion + reduced-motion (design-system: Motion Interactions)
- [ ] 2.7 Playwright: no-flash theme assertion — assert (a) the inline theme script precedes any stylesheet/body content in the served HTML source, and (b) with Playwright `addInitScript`-seeded `localStorage`, `document.documentElement.dataset.theme` equals the stored value at `domcontentloaded` (design-system: Theme Toggle)
- [ ] 2.8 TDD: locale switcher component — generic behavior only: locale switch + preserves current page (i18n: Locale Persistence on Navigation)
- [ ] 2.9 TDD: unit tests for `shared/config/env.ts` Zod schema — fail-fast on missing `DATABASE_URL`/`VISITOR_HASH_SECRET`, optional `RESEND_API_KEY`/`GITHUB_TOKEN` (quality-pipeline: Coverage Threshold; this is the first PR with coverage-eligible files under the gate's configured scope, per task 1.6)

## Phase 3a: Home Sections Part 1 (PR3a)

- [ ] 3a.1 TDD: `features/home/ui` hero, stack strip, about, skills bento sections (home-page: Section Composition — partial)
- [ ] 3a.2 TDD: anchor nav smooth scroll (home-page: In-Page Navigation)
- [ ] 3a.3 Playwright: responsive layout for hero/about/skills across breakpoints (home-page: Responsive Layout — partial)

## Phase 3b: Home Sections Part 2 & Article Filter (PR3b)

- [ ] 3b.1 TDD: `features/home/ui` projects (alternating cards), contact, footer sections (home-page: Section Composition — remainder) — note: PR3b ships the static contact section shell only; PR6 (task 6.4) wires the functional form
- [ ] 3b.2 TDD: embedded articles list wired through the `app/` composition root and `shared/content` (never a direct cross-feature import from `home` into `blog`) (home-page: Embedded Article List)
- [ ] 3b.3 TDD: filter pills + "All" + empty-state (article-filter: Category Filtering/Reset/Empty Result)
- [ ] 3b.4 Playwright: home responsive layout for projects/articles/filter across breakpoints (home-page: Responsive Layout — remainder)

## Phase 4: Blog (PR4)

- [ ] 4.1 TDD: `shared/content` MDX loader + canonical Zod frontmatter schema (title, description, date, category, tags?, cover?), covering blog: Frontmatter Validation scenarios (Valid frontmatter, Invalid frontmatter) and Cross-Locale Frontmatter Consistency (build fails on divergent category/date/tags)
- [ ] 4.2 TDD: `app/[locale]/blog/[slug]/page.tsx` renders matched-locale MDX (blog: MDX Article Rendering)
- [ ] 4.3 TDD: missing-translation fallback notice, no 404 (blog: Missing-Translation Fallback)
- [ ] 4.4 TDD: 404 when both locales missing; unprefixed `/blog` 308-redirects to `/es/blog` (i18n middleware rule), and both `/es/blog` and `/en/blog` return 404 (no index route) (blog: No Blog Index Route; i18n: Locale Routing)
- [ ] 4.5 TDD: per-route `generateMetadata` canonical + hreflang for blog routes, incl. `x-default` pointing to `es` (seo: Bilingual Sitemap with Hreflang; i18n: SEO Metadata Consistency) — cross-ref 9.3
- [ ] 4.6 TDD: locale switcher article awareness — same-slug navigation and fallback-notice handling (i18n: Locale-Matched MDX Resolution scenarios)

## Phase 5a: Persistence Schema, Migrations & DB Client (PR5a)

- [ ] 5a.1 `shared/db/schema.ts`: contact_messages, article_views, article_reactions (enum thumbs_up/heart/fire), article_search (description column, category column, per-locale regconfig, `search_vector` weighted title=A/body_text=B/description=C), rate_limits (endpoint, key, window_start, count; PRIMARY KEY(endpoint, key, window_start))
- [ ] 5a.2 `drizzle-kit generate`, commit migration; wire migrations into the e2e seed step (persistence: Versioned Schema)
- [ ] 5a.3 Verify `shared/db/client.ts` wiring against the finalized schema; document the atomic upsert pattern for `rate_limits`, scoped per endpoint (`INSERT ... ON CONFLICT (endpoint, key, window_start) DO UPDATE SET count = count + 1 RETURNING count`)

## Phase 5b: Persistence Repository Interfaces & Implementations (PR5b)

- [ ] 5b.1 TDD: repo interfaces per feature domain, zero drizzle imports (persistence: Domain Repository Interfaces)
- [ ] 5b.2 TDD: Drizzle repo impls per feature infrastructure, pglite tests (persistence: Infrastructure Repository Implementations)

## Phase 6: Contact (PR6)

- [ ] 6.1 TDD: `app/api/contact/route.ts` Zod validation (name ≤100, email ≤254, message ≤5000, locale enum es/en) — 400 on invalid (contact: Server-Side Input Validation)
- [ ] 6.2 TDD: persist + Resend email; HTTP 202 "received, delivery delayed" response on email failure or when `RESEND_API_KEY` is absent (persistence succeeds); HTTP 503 reserved for persistence failure only (contact: Message Persistence Independent of Email Delivery)
- [ ] 6.3 TDD: Postgres fixed-window rate limit (`ip_hash`, atomic upsert on `rate_limits`, scoped per endpoint, 3 requests/10min) + honeypot silent reject; check order rate limit -> honeypot -> validation, honeypot hits consume rate-limit budget (contact: Rate Limiting, Spam Mitigation)
- [ ] 6.4 TDD: contact form ui, generic-only error responses (contact: No PII Leakage) — wires the functional form into the PR3b static shell (see 3b.1)
- [ ] 6.5 Playwright: contact submit flow (quality-pipeline: E2E Test Gate)
- [ ] 6.6 TDD: privacy disclosure page + footer link (es/en) (contact: Privacy Disclosure)

## Phase 7: Engagement (PR7)

- [ ] 7.1 TDD: hashed visitor key value object — `visitor_hash` HMAC-SHA256(IP+UA) keyed by `VISITOR_HASH_SECRET`, no cookies (engagement: Privacy-Respecting Visitor Identity)
- [ ] 7.2 TDD: `app/api/engagement/views/route.ts` insert-if-absent permanent dedupe (UNIQUE(slug, visitor_hash), `onConflictDoNothing`), both first write and repeat view return 204 No Content, slug validated against published article set (404 unknown), rate-limited per `ip_hash` (20 requests/min, security: Rate Limiting on Write/Query Endpoints); on DB unavailability returns HTTP 503 (engagement: View Counting with Permanent Dedupe, Endpoint Validation/Unknown Slug Rejection)
- [ ] 7.3 TDD: `app/api/engagement/reactions/route.ts` Zod enum thumbs_up/heart/fire, per-type insert-if-absent dedupe, both first write and duplicate reaction return 204 No Content idempotent, unknown slug 404, rate-limited per `ip_hash` (20 requests/min, security: Rate Limiting on Write/Query Endpoints) (engagement: Reactions with Permanent Dedupe, Endpoint Validation/Unknown Slug Rejection)
- [ ] 7.4 TDD: public aggregate counts read, no identifiers exposed, `GET /api/engagement/[slug]` returns `{views, reactions: {thumbs_up, heart, fire}}` cached 60s, rate-limited per `ip_hash` (60 requests/min), unknown slug 404, returns HTTP 503 on DB unavailability (engagement: Public Read of Aggregate Counts, Graceful Degradation When Database Unavailable)
- [ ] 7.5 TDD: engagement UI (`features/engagement/ui`): reaction buttons (thumbs_up/heart/fire), counts display, client hook firing exactly one view POST post-hydration, DB-degraded state (hide counts on API error) (engagement: View Counting with Permanent Dedupe — view-once-per-load, Graceful Degradation When Database Unavailable)

## Phase 8: Search (PR8)

- [ ] 8.1 TDD: `scripts/sync-search.ts`: parse MDX, strip to body_text, full reconcile (upsert + prune) `article_search` + `search_vector` per-locale regconfig, covering search: Index Sync Full Reconcile scenarios; wire `sync-search` into the CI/deploy workflow (pipeline order: migrate -> sync-search -> deploy promote) and into the Playwright e2e seed step (migrations already wired in 5a.2) so the e2e DB reset runs sync before tests — task 8.1 is the sole owner of sync-search seed wiring
- [ ] 8.2 TDD: search route, Zod query validation (incl. `locale` enum es/en) + rate limit (`ip_hash`) (search: Input Validation and Rate Limiting)
- [ ] 8.3 TDD: `websearch_to_tsquery`/`ts_rank` ordering with per-locale regconfig, empty-state on no match, DB-degraded rendering (search input hidden/disabled) when Postgres unavailable (search: Full-Text Query, Relevance Ranking, No-Match Handling, Graceful Degradation When Database Unavailable)
- [ ] 8.4 TDD: search input + results rendered in place within the articles list (not a dropdown) + empty state, positioned above the filter pills in the home articles section; typing a query visually deactivates any active category pill (reset to none), clearing the query restores "All" (home-page: Embedded Article List — search input; search: Full-Text Query; article-filter: Empty Result Handling)

## Phase 9: SEO (PR9)

- [ ] 9.1 TDD: `app/[locale]/blog/[slug]/opengraph-image.tsx` OG image per article+locale; missing-translation fallback serves the content locale's image (seo: Dynamic OG Images)
- [ ] 9.2 TDD: `app/[locale]/rss.xml/route.ts` per-locale feed, entries only for articles existing in that locale, channel language per feed (seo: RSS Feed)
- [ ] 9.3 TDD: `app/sitemap.ts` bilingual hreflang pairing incl. `x-default` -> `es`, excludes missing-locale slugs (seo: Bilingual Sitemap with Hreflang; i18n: SEO Metadata Consistency) — cross-ref 4.5

## Phase 10: GitHub Activity (PR10)

- [ ] 10.1 TDD: `features/github-activity/infrastructure` GitHub API client with `GITHUB_TOKEN` (optional; absent token follows the same fallback path as an API failure) (github-activity: Server-Side GitHub Data Fetch, Graceful Failure Handling)
- [ ] 10.2 TDD: ISR section, `revalidate: 3600`, non-blocking render (github-activity: ISR Caching, Non-Blocking Render)
- [ ] 10.3 TDD: fallback panel on API error/timeout/missing token (github-activity: Graceful Failure Handling)
- [ ] 10.4 Update home page section-order e2e test to include the github activity section between articles list and contact (home-page: Section Composition)

## Phase 11: Hardening & Verify (PR11)

- [ ] 11.1 TDD: verify the full header set + CSP shipped in PR1 (per design.md ADR-0007 — no further tightening planned) and run Lighthouse only (security: Security Headers — CSP)
- [ ] 11.2 TDD: verify no secrets in client bundle (security: No Client-Side Secrets)
- [ ] 11.3 Verify coverage gate integrity (task 1.6 config, `src/**` + `scripts/**`) and raise exclusions review; wire Lighthouse CI budget (mobile preset: Performance >=90, Accessibility >=95, Best Practices >=95, SEO >=95), update README badges (quality-pipeline)
- [ ] 11.4 Full Playwright pass: locale switch, theme, filter, search, contact, article view, engagement, github activity (quality-pipeline: E2E Test Gate)
- [ ] 11.5 Finalize `docs/adr/0001-0007` rationale from design.md ADR table

## Implementation Notes (Judgment Day residuals)

- Engagement UI feedback: after a reaction POST (always 204), apply optimistic increment client-side and persist a local "reacted" flag in localStorage; scenarios live at component-test level (task 7.5).
- Add `EMAIL_DRIVER` (values: resend|fake, default resend) to the env schema, env matrix, and task 1.4/6.2 — e2e uses fake; keeps the 200 {status:"sent"} happy path testable in CI.
- Contact e2e: rate limits are env-configurable (or rate_limits truncated between contact tests) so the 3/10min limit does not 429 the suite from a single CI IP.
- Honeypot response mirrors whatever the CURRENT success path would return (200 or 202 in degraded email mode), not a fixed literal.
- Verify next-intl's emitted redirect status against the pinned version; if 307, override in middleware or relax spec assertions to permanent-style redirect (307/308) — decide in PR2 and record.
- Add `NEXT_PUBLIC_SITE_URL` via a build-safe validated env path (separate schema importable at build time) for sitemap/RSS/canonical/OG absolute URLs.
- Pin request body contracts before TDD in PR7: POST /api/engagement/views {slug}; POST /api/engagement/reactions {slug, kind}.
- Application-layer orchestration rule (rate limit → validation flow) applies to engagement and search use-cases too, not only contact — keeps that logic coverage-gated.
- GitHub activity: implement as Suspense-streamed section with fetch-level revalidate (3600), not page-level ISR; loading state applies to cache-miss renders.
- Add app/[locale]/privacy/page.tsx to the design folder tree mentally — required by contact spec (task 6.6); unknown locale segments (e.g. /fr/rss.xml) return 404.
- Search results render without date unless added to the response shape — decide in PR8; each engagement write endpoint has its own independent 20/min budget.
- env.ts is coverage-gated src/** code ("config files" exclusion means build/tool configs only); its tests may land with 2.9 as scaffolding exception.
- Task 3b.3 covers the empty-state component at unit level; the full empty-result e2e lands with PR8's search input.
- Proposal wording "atomic increments" is legacy — counts are row aggregates (insert-if-absent), per engagement spec.
