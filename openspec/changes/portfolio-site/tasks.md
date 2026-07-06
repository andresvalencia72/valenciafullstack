# Tasks: Portfolio Site for Andrés Valencia

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~4000-6000 total across 13 slices; individual slices ~150-400 each after splitting PR3 and PR5 (PR1 scaffolding is the sole exception, likely exceeding 400 due to generated files/lockfile) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 -> PR2a -> PR2b -> PR3a -> PR4 -> PR3b -> PR5a -> PR5b -> PR6 -> PR7 -> PR8 -> PR9 -> PR10 -> PR11 (see Suggested Work Units; PR2 was split into PR2a/PR2b post-apply, see "PR2 split decision" below) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain (user-selected mid-apply: merges deferred to project end, each PR targets its parent branch) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain (user-selected mid-apply: merges deferred to project end, each PR targets its parent branch)
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold + test runner + CI skeleton | PR1 | Base for all; generated files (lockfile, boilerplate) likely need `size:exception` even after chaining |
| 2a | Design system: tokens, fonts, theme, motion, scroll progress | PR2a | Base = PR1. Split from the original "PR2" work unit post-apply — see "PR2 split decision" below |
| 2b | i18n shell: next-intl routing, `app/[locale]` restructure, locale switcher | PR2b | Base = PR2a. Split from the original "PR2" work unit post-apply — see "PR2 split decision" below |
| 3a | Home sections part 1: hero, stack strip, about, skills bento | PR3a | Base = PR2b (needs the `app/[locale]` shell) |
| 4 | Blog MDX + article route | PR4 | Base = PR2b (needs the `app/[locale]` shell) |
| 3b | Home sections part 2: projects, articles list, article filter | PR3b | Base = PR4 (consumes the real MDX loader/article data shipped in PR4; no longer runs before it) |
| 5a | Persistence schema + migrations + db client wiring | PR5a | Base = PR1 |
| 5b | Persistence repository interfaces + implementations | PR5b | Base = PR5a |
| 6 | Contact API + form | PR6 | Base = PR5b |
| 7 | Engagement (views/reactions) | PR7 | Base = PR5b, PR4 (engagement mounts in the PR4 article page and validates slugs against the PR4 article set); independent of PR6 |
| 8 | Search (sync script + FTS API + UI) | PR8 | Base = PR5b, PR4, PR3b |
| 9 | SEO pack (OG, RSS, sitemap) | PR9 | Base = PR4, PR3b |
| 10 | GitHub activity (last slice) | PR10 | Base = PR3b |
| 11 | Hardening: headers, Lighthouse, coverage gate, ADRs | PR11 | Base = all prior |

**Chain-strategy note**: the Base column above was valid under `stacked-to-main`, the strategy in effect through PR1/PR2a/PR2b. **Starting at PR3a, the user switched the chain strategy to `feature-branch-chain` mid-apply**: no PR merges to `main` until project end; each PR targets its immediate predecessor branch instead (linear order: PR1 -> PR2a -> PR2b -> PR3a -> PR4 -> PR3b -> PR5a -> PR5b -> PR6 -> PR7 -> PR8 -> PR9 -> PR10 -> PR11). PR3a's branch (`feat/pr3a-home-core`) targets `feat/pr2b-i18n-shell` accordingly, opened ready (not draft) — under `feature-branch-chain`, only the final tracker PR aggregates everything to `main`; intermediate child PRs are reviewable and mergeable into their parent branch without waiting for `main`.

## Phase 1: Scaffolding & CI (PR1)

- [x] 1.1 `git init`; scaffold Next.js App Router + TS + Tailwind
- [x] 1.2 Install/configure Vitest, Testing Library, Playwright (vitest.config.ts, playwright.config.ts)
  - DoD: also update `openspec/config.yaml` `apply.test_command`, `verify.test_command`, and `verify.build_command` with the real commands
- [x] 1.3 ESLint boundaries plugin enforcing domain/application/infra/ui import rules
- [x] 1.4 `shared/config/env.ts` Zod env schema; fail-fast only on missing `DATABASE_URL` and `VISITOR_HASH_SECRET`; `RESEND_API_KEY`/`GITHUB_TOKEN` optional (persistence: Environment-Only Credentials)
- [x] 1.5 `shared/db/client.ts` Drizzle client + `docker-compose.yml` Postgres
- [x] 1.6 GitHub Actions: unit+integration (against pglite), Playwright e2e against a real **GitHub Actions Postgres service container** (`DATABASE_URL` points at it; this task ships the service container plus an empty seed-step skeleton only — seed steps land with their features, see 5a.2/8.1) — e2e flow list scoped to capabilities implemented to date, reaching the full set — home render, article view, contact submission — by the final slice; coverage gate (global 80% lines+branches over `src/**` and `scripts/**`, excluding `app/` route adapters, config files, generated code, and the declarative/IO-bootstrap files `shared/db/schema.ts` and `shared/db/client.ts`; configured deterministically — always enforced, automatically skips (passes) when zero coverage-eligible files exist under the configured scope, e.g. PR1 scaffolding — no manual flip, no separate PR2 task needed), Lighthouse stub (quality-pipeline: End-to-End Test Gate, Coverage Threshold) — task 1.6 is the single owner of the coverage gate config
- [x] 1.7 README badge placeholders; `docs/adr/0001-0007` stubs from design.md
- [x] 1.8 TDD: full security headers via `next.config` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS) plus the full CSP — `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'` (see design.md ADR-0007) — unit test on the config or e2e header assertion (security: Security Headers, baseline)

## Phase 2a: Design System (PR2a)

Base = PR1. See "PR2 split decision" below for why Phase 2 (originally
one PR) now ships as PR2a + PR2b.

- [x] 2.1 `shared/ui/tokens.css` light/dark tokens from `design-reference/`
- [x] 2.2 `next/font/local`: Clash Display + General Sans
- [x] 2.3 TDD: theme toggle + no-flash inline script (design-system: Theme Toggle) — ships with hardcoded English labels; PR2b reconnects it to next-intl once the message catalogs land
- [x] 2.5 TDD: scroll progress indicator (design-system: Scroll Progress)
- [x] 2.6 TDD: reveal/tilt/magnetic motion + reduced-motion (design-system: Motion Interactions)
- [x] 2.7 Playwright: no-flash theme assertion — assert (a) the inline theme script precedes any stylesheet/body content in the served HTML source, and (b) with Playwright `addInitScript`-seeded `localStorage`, `document.documentElement.dataset.theme` equals the stored value at `domcontentloaded` (design-system: Theme Toggle) — run against the interim `app/layout.tsx` shim's root path; PR2b repoints it at `/es`

## Phase 2b: i18n Shell (PR2b)

Base = PR2a.

- [x] 2.4 next-intl setup, `app/[locale]` layout, `localePrefix: "always"`, `es` default, `/` and unprefixed paths 308-redirect to `es` (i18n: Locale Routing) — replaces PR2a's temporary `app/layout.tsx`/`app/page.tsx` shim
- [x] 2.8 TDD: locale switcher component — generic behavior only: locale switch + preserves current page (i18n: Locale Persistence on Navigation)
- [x] 2.9 TDD: unit tests for `shared/config/env.ts` Zod schema — fail-fast on missing `DATABASE_URL`/`VISITOR_HASH_SECRET`, optional `RESEND_API_KEY`/`GITHUB_TOKEN` (quality-pipeline: Coverage Threshold; this is the first PR with coverage-eligible files under the gate's configured scope, per task 1.6) — already satisfied by PR1's `env.ts` tests (see "PR1 apply findings"); carried here unchanged, no new code

## Phase 3a: Home Sections Part 1 (PR3a)

- [x] 3a.1 TDD: `features/home/ui` hero, stack strip, about, skills bento sections (home-page: Section Composition — partial)
- [x] 3a.2 TDD: anchor nav smooth scroll (home-page: In-Page Navigation)
- [x] 3a.3 Playwright: responsive layout for hero/about/skills across breakpoints (home-page: Responsive Layout — partial)

## Phase 3b: Home Sections Part 2 & Article Filter (PR3b)

- [x] 3b.1 TDD: `features/home/ui` projects (alternating cards), contact, footer sections (home-page: Section Composition — remainder) — note: PR3b ships the static contact section shell only; PR6 (task 6.4) wires the functional form
- [x] 3b.2 TDD: embedded articles list wired through the `app/` composition root and `shared/content` (never a direct cross-feature import from `home` into `blog`) (home-page: Embedded Article List)
- [x] 3b.3 TDD: filter pills + "All" + empty-state (article-filter: Category Filtering/Reset/Empty Result)
- [x] 3b.4 Playwright: home responsive layout for projects/articles/filter across breakpoints (home-page: Responsive Layout — remainder)

## Phase 4: Blog (PR4)

- [x] 4.1 TDD: `shared/content` MDX loader + canonical Zod frontmatter schema (title, description, date, category, tags?, cover?), covering blog: Frontmatter Validation scenarios (Valid frontmatter, Invalid frontmatter) and Cross-Locale Frontmatter Consistency (build fails on divergent category/date/tags)
- [x] 4.2 TDD: `app/[locale]/blog/[slug]/page.tsx` renders matched-locale MDX (blog: MDX Article Rendering)
- [x] 4.3 TDD: missing-translation fallback notice, no 404 (blog: Missing-Translation Fallback)
- [x] 4.4 TDD: 404 when both locales missing; unprefixed `/blog` 308-redirects to `/es/blog` (i18n middleware rule), and both `/es/blog` and `/en/blog` return 404 (no index route) (blog: No Blog Index Route; i18n: Locale Routing)
- [x] 4.5 TDD: per-route `generateMetadata` canonical + hreflang for blog routes, incl. `x-default` pointing to `es` (seo: Bilingual Sitemap with Hreflang; i18n: SEO Metadata Consistency) — cross-ref 9.3
- [x] 4.6 TDD: locale switcher article awareness — same-slug navigation and fallback-notice handling (i18n: Locale-Matched MDX Resolution scenarios)

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

### PR1 apply findings (2026-07-05)

- **env.ts/env.public.ts tests landed in PR1, not deferred to 2.9.** Vitest's v8 coverage provider (v4.x) has no `all:false`-style opt-out — it always reports every file matched by `coverage.include`, regardless of whether a test touches it. So an untested-but-eligible `env.ts` would have failed the 80% gate immediately in PR1, contradicting the "auto-pass" guarantee. Rather than fight the tool, PR1 ships full unit tests for `env.ts` and `env.public.ts` (fail-fast on missing `DATABASE_URL`/`VISITOR_HASH_SECRET`, `EMAIL_DRIVER` default/enum, build-safe `NEXT_PUBLIC_SITE_URL` default/validation). **Task 2.9 is now redundant** — treat it as "verify/extend existing env.ts tests" rather than "create from scratch" when PR2 lands. The "auto-pass when zero coverage-eligible files exist" behavior itself was verified independently (`vitest run --coverage --coverage.include="<empty-glob>"` exits 0 with an empty 0/0 report), so the gate mechanism in task 1.6 is correct for genuinely-empty scopes — it just doesn't apply once `env.ts` exists.
- **eslint-plugin-boundaries@6.0.2 capture-scoped selector gotcha**: the legacy tuple selector form `["domain", { captured: { feature: "{{from.captured.feature}}" } }]` silently never matches (in either direction) when used inside `allow`/`disallow` — no error, no warning, just a no-op that makes the whole rule permissive-by-default-disallow (i.e., everything gets rejected, or with `default: allow`, nothing gets caught). The working form is the object/`DependencySelector` wrapper: `{ to: { type: "domain", captured: { feature: "{{from.captured.feature}}" } } }`. Verified empirically (see `eslint.config.mjs` inline comment) with a throwaway fixture feature exercising same-feature-allowed / cross-feature-blocked / layer-blocked cases before removing the fixture. Also required `settings["import/resolver"] = { typescript: true, node: {...} }` — without a resolver, boundaries can't resolve `@/*`-aliased or extensionless relative imports and silently treats every dependency as "unknown" (never checked).
- **Folder tree correction applied**: `create-next-app --src-dir` nests `app/` under `src/app`, but design.md's tree places `app/` at the repo root as a sibling to `src/` (screaming architecture: `app/` = composition root only, `src/` = features + shared). PR1 scaffolds with `--src-dir` for the initial `create-next-app` run (so Tailwind/TS/ESLint defaults are generated normally) then moves `src/app` → `app/` immediately after, before writing any feature code. Path alias `@/*` → `./src/*` is unaffected.
- **`.env.example` could not be created** — the execution sandbox denies writes to any `.env*` path, including example/template files with no real secrets. The full recommended content is documented in `README.md` (Environment variables + Getting started) and in `design.md`'s env matrix; a maintainer with local file access should create `.env.example` from that content in a follow-up commit (or relax the sandbox rule for `.env.example` specifically, since `.gitignore` already special-cases it as safe to commit).

### PR2 split decision (2026-07-05)

The original PR2 (Phase 2, tasks 2.1-2.9, ~1960 hand-written insertions/133 deletions) exceeded the 400-line review budget and was split post-apply into two stacked PRs per user decision (`chain_strategy: stacked-to-main`):

- **PR2a — Design System** (`feat/pr2a-design-system`, base = PR1): tokens, self-hosted fonts, theme (toggle + no-flash script + `use-theme`), motion primitives, scroll progress. Tasks 2.1, 2.2, 2.3, 2.5, 2.6, 2.7. Ships a temporary `app/layout.tsx` + `app/page.tsx` shim (PR1's plain structure, wired with fonts/tokens/theme) since `app/[locale]` belongs to PR2b; `ThemeToggle` ships with hardcoded English labels (no next-intl dependency yet).
- **PR2b — i18n Shell** (`feat/pr2b-i18n-shell`, base = PR2a): next-intl routing/navigation/request config, message catalogs, locale switcher, the Proxy (307->308 upgrade), and the `app/[locale]` restructure that replaces PR2a's interim shim. Tasks 2.4, 2.8, 2.9 (2.9 was already satisfied by PR1's `env.ts` tests — carried here unchanged). `ThemeToggle` is reconnected to next-intl's `useTranslations` once the message catalogs exist.

Both branches are independently green (lint, typecheck, coverage >=80%, `next build`, Playwright). The split boundary sits at the atomic-unit line: further splitting (e.g. separating fonts from tokens, or theme from motion) would produce non-functional, non-independently-reviewable slices. Each PR still lands above the 400-line budget (~1600-1700 lines each, see PR bodies for the exact estimate) — disclosed honestly rather than forcing an artificial third split.

### PR2a/PR2b apply findings (2026-07-05)

Supersedes "PR2 apply findings" from the original (now-closed) PR2 draft — same technical content, reorganized across the two branches:

- **307-vs-308 redirect decision (RESOLVED, PR2b)**: verified against the installed `next-intl@4.13.1` middleware source — it calls `NextResponse.redirect(url)` with no explicit status, and Next.js's own `NextResponse.redirect` defaults to **307** when no status is given (confirmed in `node_modules/next/dist/server/web/spec-extension/response.js`). Since the i18n spec requires a **308** (permanent) for the unprefixed-to-`es` redirect, `proxy.ts` wraps next-intl's middleware output and upgrades any 307 to 308 before returning it, preserving all other headers. Locked in by a unit-tested pure function (`shared/i18n/middleware-rules.ts#upgradeRedirectStatus`) plus an e2e test (`e2e/locale-routing.spec.ts`).
- **`middleware.ts` -> `proxy.ts` rename (Next.js 16, PR2b)**: the pinned Next.js version (16.2.10) deprecates the `middleware` file convention in favor of `proxy`. PR2b ships the file as `proxy.ts` from the start.
- **Real hydration bug found and fixed by the Playwright no-flash test (task 2.7, PR2a)**: the original `useTheme()` implementation read `document.documentElement.dataset.theme` (already mutated by the pre-hydration inline script) via a `useState` lazy initializer, producing a genuine React hydration mismatch. Fixed by always starting client state at the SSR-safe default and syncing the real value in a `useEffect` after mount — the same pattern used by `next-themes`.
- **Theme script placement (PR2a)**: `next/script` with `strategy="beforeInteractive"` inside `<body>`, not a raw `<script>` in `<head>` — Next.js's App Router always injects its own resource hints and stylesheet `<link>` at the very top of `<head>`, ahead of any user-authored head content (framework-internal, not configurable). `beforeInteractive` still guarantees the script runs before hydration and before rendered content.
- **Vitest + Node 25 `localStorage` conflict (PR2a)**: Node's built-in global `localStorage` throws `SecurityError` and shadows jsdom's implementation under Vitest. Fixed via `NODE_OPTIONS=--no-webstorage` on the test npm scripts plus a jsdom `environmentOptions.url`.
- **Vitest + `next-intl/navigation` resolution gotcha (PR2b)**: `next-intl`'s react-client build imports the bare specifier `next/navigation`, which Vite's SSR-external resolver can't resolve since `next` ships no package.json "exports" map. Fixed via `ssr.noExternal: ["next-intl"]` + `resolve.alias["next/navigation"]` pointing at the concrete file.
- **Font loader (`next/font/local`) cannot run under Vitest (PR2a)** — excluded `src/shared/ui/fonts/index.ts` from the coverage `include` scope, same basis as the `shared/db` bootstrap-file exclusion category.
- **Fonts (PR2a)**: Clash Display (500/600/700) and General Sans (400/500/600) from Fontshare, committed as `.woff2` with upstream `LICENSE.txt` files.
- **ThemeToggle i18n coupling discovered during the split**: the original single-PR2 `ThemeToggle` imported `useTranslations` from `next-intl` directly, which would have pulled the i18n runtime into PR2a. PR2a ships a decoupled version with hardcoded English labels; PR2b reconnects it to `next-intl` once the message catalogs exist — this is the one place where the original commits could not be cleanly cherry-picked without a small manual adjustment.
- **Coverage**: PR2a 98.29% stmts/94% branches/100% funcs/98.29% lines (62 tests); PR2b (cumulative) 95.36%/92.42%/95.65%/95.33% (84 tests) — matches the original single-PR2 numbers exactly, confirming no test coverage was lost in the split. `shared/i18n/request.ts` is the only 0%-covered file in PR2b (next-intl RSC wiring + a dynamic `import()`; its one piece of real logic, locale fallback, is extracted into the fully-tested `resolveRequestLocale` pure function).

### PR3a apply findings (2026-07-05)

- **Chain strategy switched mid-apply**: the user changed the chain strategy from `stacked-to-main` to `feature-branch-chain` starting at this PR — see the "Chain-strategy note" above. `feat/pr3a-home-core` targets `feat/pr2b-i18n-shell` (not `main`), opened ready (not draft); no PR in the chain merges until project end.
- **ESLint boundaries gap found and fixed**: the `ui` boundary rule (`eslint.config.mjs`) allowed `domain`/`application`/`shared` but had no same-feature-captured entry for `ui` itself, so intra-feature imports (e.g. `hero-section.tsx` importing its own `social-icon.tsx`) were rejected as "ui may not import ui". This is the first real feature folder (`src/features/home/ui`) to exercise the rule beyond PR1's throwaway fixture, and it surfaced immediately. Fixed by adding a same-feature-captured `{ to: { type: "ui", captured: { feature: "{{from.captured.feature}}" } } }` entry to the `ui` allow-list. Re-verified with a temporary cross-feature fixture (not committed): same-feature `ui -> ui` now passes, cross-feature `ui -> ui` still fails.
- **jsdom does not implement anchor same-document hash navigation**: a unit test asserting that clicking a `SectionNav` link updates `window.location.hash` failed even with a correctly-implemented component — confirmed via an isolated jsdom repro that a dispatched `click` on an `<a href="#x">` never updates `window.location.hash`. Real hash/scroll behavior for `home-page: In-Page Navigation` is verified in `e2e/home-sections.spec.ts` (real browser) instead; the unit test for `SectionNav` covers structure/i18n only (correct hrefs, translated labels, order).
- **Design tokens extended for the first time since PR2a**: `tokens.css` only carried `bg`/`band`/`card`/`ink`/`coral`/`salmon` (exercised by the theme-toggle demo). Hero/about/skills need `ink-soft`, `ink-faint`, `line`, `frame`, `shadow`, `coral-ink` — derived verbatim from `design-reference/`'s JS theme map (`Portfolio Andres Valencia.standalone.dc.html`, `themeVars()`), not invented ad hoc.
- **Skill icon fidelity deviation (documented in `skill-badge.tsx`)**: ships monogram badges instead of `devicon`'s colored icon font. Self-hosting devicon would either pull an external CDN stylesheet (blocked by ADR-0007's `style-src 'self'` CSP) or vendor a large multi-hundred-glyph icon font for eight icons; hand-typed brand SVG paths risk visual inaccuracy. The badge component is isolated to one file so real brand SVGs/devicon assets can replace it later without touching the section components.
- **Stale dev server caught before final e2e verification**: an `npm run dev` process from an earlier, unrelated session was still listening on port 3000. Playwright's `reuseExistingServer: !CI` attached to it instead of starting a fresh `next start` production server, which would have silently validated against dev-mode behavior (HMR, eval()-based React debugging, a dev "issues" overlay) instead of the production build. Caught via a stray "1 Issue" overlay button visible in a manual screenshot check; killed the stale process and re-ran the full suite with `CI=1` (forces a fresh `webServer`) to confirm all 12 e2e tests pass against a genuine production build.
- **Coverage**: 96.11% stmts/93.15% branches/96.66% funcs/96.08% lines (99 tests, up from 84) — all new `src/features/home/**` and `src/shared/ui/photo-frame/**` files are at 100%; the files below threshold in the report predate this PR (untouched, carried over from PR2a/PR2b).
- **Review budget**: this PR lands well above the 400-line budget — **997 insertions / 7 deletions (1004 total changed lines)**, `package-lock.json` unchanged (no new dependency). Atomic-unit justification: hero + stack strip + about + skills bento share one message-catalog namespace (`home.*`), one design-token extension, and the same boundaries-config fix required to ship any of them together — splitting further (e.g. hero-only vs. about-only) would fragment a single conceptually atomic "home sections part 1" deliverable without producing an independently reviewable slice. Commits are still organized as one work unit per section (10 commits, see PR body) so a reviewer can review incrementally within the PR.

### PR4 apply findings (2026-07-06)

- **Syntax highlighting decision (unspecified in design.md, resolved here)**: `rehype-pretty-code` + Shiki, single fixed `one-dark-pro` theme applied regardless of the site's light/dark toggle. This matches `design-reference/`'s own article page, whose code blocks are hardcoded dark (`#1a1a1f` background, `atom-one-dark` highlight.js theme) in every screenshot independent of the surrounding theme — so a per-theme dual-token Shiki setup would solve a problem the reference itself doesn't have. MDX compilation: `next-mdx-remote/rsc` (`MDXRemote`), matching the App Router/RSC-first approach design.md already committed to for i18n and motion.
- **`MDXRemote`/async-component RSC testing gap (jsdom limitation, same category as PR3a's anchor-hash finding)**: `<MDXRemote source={...} />` used as JSX is an async Server Component; `react-dom`'s synchronous client renderer (what Vitest/Testing Library actually runs) cannot resolve a *nested* async component and throws `"<MDXRemote> is an async Client Component"`. Worked around by calling `MDXRemote({...})` directly as a function and `await`-ing it inside `ArticleBody` (an async component itself) before returning JSX — the returned tree is then fully resolved by the time React ever sees it, so `render()` works normally. `ArticlePage` applies the same pattern for its own `ArticleBody` call. This is a *unit-test-only* workaround; the real Next.js RSC runtime (verified via `next build` + Playwright) resolves nested async components natively either way.
- **ESLint boundaries gaps found and fixed (extends PR3a's `ui -> ui` fix to `application`/`infrastructure`/`app`)**: same root cause as PR3a — `application` and `infrastructure` had no same-feature-captured allow entry for themselves, so a use-case's co-located `*.test.ts` importing the module it tests (e.g. `get-article.test.ts` importing `get-article.ts`) was rejected as "application may not import application". Fixed with the same `{ to: { type X, captured: { feature: "{{from.captured.feature}}" } } }` pattern already used for `ui`. Separately, `app` had no `domain` entry at all — `app/[locale]/blog/[slug]/page.tsx` (composition root) needs the `ArticleLocale` domain type to correctly type the repository/use-case wiring it performs; added `{ to: { type: "domain" } }` to `app`'s allow-list, since composition roots legitimately need domain types even though they don't import from `domain` for behavior.
- **Domain must not import `shared` — `ArticleLocale` deliberately duplicated**: `features/blog/domain/article-repository.ts` defines its own `type ArticleLocale = "es" | "en"` rather than importing `Locale` from `@/shared/i18n/routing`, per design.md's Boundary Rules (`domain` may import nothing). The two types are structurally identical, so real `Locale` values satisfy `ArticleLocale` with zero conversion at call sites.
- **4th, es-only fixture article (`content/blog/notas-breves/`)**: the "3 real bilingual sample articles" requirement covers the main portfolio content (`clean-architecture-nextjs`, `portfolio-tech-stack`, `design-patterns-daily`, all es+en). blog: Missing-Translation Fallback and its e2e/locale-switcher-awareness scenarios need a real article that only exists in one locale (not achievable with 3 articles that are all required to be bilingual) — `notas-breves` is a short, real, meaningful es-only post (about writing in Spanish first) added specifically to exercise that scenario end-to-end. It also happens to be the newest article by `date`, so it doubles as the "next article" wraparound case (`getNextArticle`'s newest-wraps-to-oldest path).
- **Categories are a fixed 3-id catalog**: `architecture` / `patterns` / `technologies` (`shared/content/categories.ts`), one sample article per category. Display labels live in `blog.categories.*` in both locale message catalogs; a dedicated test (`shared/content/category-catalog.test.ts`) keeps the catalog and the id list in exact 1:1 sync, and `mdx-loader.ts`'s `validateContentTree()` fails the build if any article's `category` isn't in this list (blog: Category id with no catalog label fails the build).
- **Tags are stable identifiers, not translated text (real bug caught by the loader's own cross-locale check)**: initially wrote Spanish-translated tag values in the `es.mdx` siblings (e.g. `"arquitectura"` alongside the `en.mdx` sibling's `"architecture"`). `real-content-tree.test.ts` (which runs `validateContentTree()` against the actual shipped `content/blog/` tree, not just synthetic fixtures) caught this immediately as a cross-locale divergence — tags, like category, MUST be the same stable identifier in every locale sibling. Fixed by using the English stable id in both locale files.
- **"Next article" card scoped as a small self-contained use case, not the full articles list**: `getNextArticle` (application layer) orders resolved articles chronologically (oldest → newest, wraparound after the newest) and returns a minimal teaser — deliberately independent of the full articles-list/filter feature (home-page: Embedded Article List, PR3b), which needs richer listing/pagination concerns this task doesn't require.
- **`Link` from `@/shared/i18n/navigation` accepts an explicit `locale` override**: used by `NextArticleCard` (the next article may only exist in the other locale) and implicitly relied upon for locale switcher article-awareness (task 4.6) — `LocaleSwitcher`'s existing generic `router.replace(pathname, { locale })` already preserves the full literal pathname including the slug segment, so switching locale on an article page naturally lands on the same slug in the target locale with zero new code; the article route's own fallback-aware rendering (task 4.3) then takes over. Verified end-to-end in `e2e/blog.spec.ts`, not by changing `LocaleSwitcher` itself.
- **Coverage**: 96.89% stmts / 91.85% branches / 97.22% funcs / 96.86% lines (176 tests, up from 99). 23/23 e2e passing (12 prior + 11 new in `e2e/blog.spec.ts`).
- **Review budget**: **2850 insertions / 6 deletions (2856 hand-written changed lines)** excluding `package-lock.json` (2321 generated lines from `gray-matter`/`next-mdx-remote`/`rehype-pretty-code`/`shiki`). Well above the 400-line budget — disclosed honestly. Atomic-unit justification: the MDX content pipeline (loader + schema + validation), the `blog` feature's full clean-architecture slice (domain/application/infrastructure/ui), the article route with its SEO metadata, and three real bilingual sample articles are one deliverable — a real MDX article page cannot be reviewed or verified end-to-end with any one of those pieces missing. This is consistent with the precedent set by PR2a/PR2b/PR3a (each also landed above budget with an atomic-unit justification under the pre-agreed `feature-branch-chain` strategy).

### PR3b apply findings (2026-07-06)

- **Home/blog boundary honored via `shared/content` + a dedicated home domain type**: `home` never imports the `blog` feature (tasks.md 3b.2's hard requirement). `src/shared/content/list-published-articles.ts` is a new shared use-case-style function (locale-filtered, latest-first, built directly on the PR4 `MdxLoader`) that the `app/[locale]/page.tsx` composition root calls and maps into `home`'s own zero-import `HomeArticleSummary` domain type (`src/features/home/domain/article-summary.ts`). `ArticlesSection` (home/ui) only ever sees that plain shape — no dependency on `blog`'s `Article` entity, its MDX repository, or its application layer.
- **Category filter labels reuse `blog.categories.*` deliberately, not a duplicate catalog**: category ids are a single stable, cross-feature catalog (`shared/content/categories.ts`); re-reading an existing i18n message key from `home/ui` is a data reference, not a code import, so it does not violate the ESLint boundaries rule (verified: `npm run lint` passes with the existing `ui -> shared` allow-list, no new boundary exceptions needed).
- **Filter pill set derivation**: pills are `ARTICLE_CATEGORY_IDS` filtered down to categories actually present in the current locale's articles (article-filter: Category Filtering — "union of `category` values across published articles ... a category with zero published articles ... has no pill"), in canonical catalog order rather than first-seen order, for deterministic pill ordering across renders/locales.
- **Real bug found and fixed by the mobile responsive e2e test (task 3b.4)**: adding three more `SectionNav` items (projects/articles/contact, six total) broke the existing 375px header layout — the nav no longer fit next to the locale switcher and theme toggle, causing real horizontal page overflow (not just a nav-specific issue; `document.documentElement.scrollWidth > innerWidth` failed for the *entire* page, including the pre-existing PR3a mobile test). Root-caused by writing a small Playwright script that flags every element whose `getBoundingClientRect()` exceeds the viewport — the culprit was the `<nav>` itself, not any section content. Fixed by collapsing the full anchor nav below Tailwind's `lg` breakpoint (`hidden lg:block`) rather than attempting a full mobile burger menu (present in `design-reference/` but out of scope for this task) — anchors remain reachable via scrolling and the footer's nav links on mobile. Documented as a deliberate deviation from the visual reference, not an oversight.
- **Projects section placeholder policy**: `PROJECTS[0]` ("Valencia Fullstack — this portfolio") is a real, verifiable entry — its repo link is this actual repository (`github.com/andresvalencia72/valenciafullstack`); no demo link is set (site not yet deployed). `PROJECTS[1]`/`PROJECTS[2]` are explicit placeholders: marked in code (`isPlaceholder: true` in `projects-data.ts`), in visible UI copy (a "Placeholder — replace with a real project" badge, plus problem/solution text that says so in both locales), and their demo/repo links point at the user's GitHub profile rather than a fabricated project repo — deliberately not reusing `design-reference/`'s fictional "Mercado Norte"/"Aula Viva" names, since presenting invented products as real work on a recruiter-facing portfolio would be dishonest.
- **Contact form field set follows the `contact` spec's validated shape, not `design-reference/`'s markup 1:1**: the reference's contact form includes a fourth "Asunto" (subject) field with no counterpart in the `contact` spec's Zod schema (`name`/`email`/`message`/`locale` only — see specs/contact/spec.md, Server-Side Input Validation). Shipping a subject field now would mean either building UI that PR6 immediately has to remove, or silently growing the validated shape beyond what's specced. Omitted by design; if a subject field is wanted, it should be added to the `contact` spec first.
- **Contact submit is genuinely inert, not fake-wired**: the `<button type="submit" disabled>` cannot fire a submit event at all; a code comment (`TODO(PR6, task 6.4)`) and a visible, translated helper line under the button (`home.contact.submitTodo`) both state the form is not connected yet, satisfying "disable submit or wire it to nothing with a clear TODO" from the PR3b brief.
- **Reused `blog.readingTime` catalog key for the articles list row**: rather than a second, near-duplicate "N min" key under `home.articles`, `ArticleRow` calls `useTranslations("blog")("readingTime", {minutes})` — same rationale as reusing `blog.categories.*` (single source of truth for a piece of copy shared across two features' UI, via i18n data, not a code import).
- **Coverage**: 97.33% stmts / 92.02% branches / 97.76% funcs / 97.29% lines (204 tests, up from 176). All new `src/features/home/ui/**`, `src/features/home/domain/**`, and `src/shared/content/list-published-articles.ts` files are at or near 100%. 27/27 e2e passing (23 prior + 4 new in `e2e/home-sections.spec.ts`: mobile projects/articles overflow, tablet, desktop, category-filter interaction).
- **Review budget**: **1427 insertions / 23 deletions (1450 hand-written changed lines)**, `package-lock.json` unchanged (no new dependency). Above the 400-line budget — disclosed honestly. Atomic-unit justification: the projects section, the articles list, and the functional category filter share one message-catalog namespace (`home.projects`/`home.articles`), one new shared `list-published-articles` use case, and the same `app/[locale]/page.tsx` composition-root rewrite (adding four sections + the article-list data fetch in a single coherent edit) — splitting further (e.g. projects-only vs. articles-only PRs) would fragment one conceptually atomic "home sections part 2" deliverable and require re-touching the same composition root and nav/footer files twice. Consistent with the precedent set by PR2a/PR2b/PR3a/PR4 (each landed above budget with an atomic-unit justification under the pre-agreed `feature-branch-chain` strategy).
