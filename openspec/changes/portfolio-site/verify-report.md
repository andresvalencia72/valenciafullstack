# Verification Report — INTERIM (PR1–PR5b + CSP dev fix)

**Change**: portfolio-site
**Date**: 2026-07-07
**Scope**: This is a MID-CHAIN evidence-refresh verify, NOT the terminal verify. It covers only the 35/62 completed tasks (Phases 1, 2a, 2b, 3a, 4, 3b, 5a, 5b, plus the unplanned CSP dev-mode hotfix on `fix/csp-dev-unsafe-eval`). Phases 6–11 (27 unchecked tasks) are out of scope and are NOT evaluated for correctness — see "Out-of-Scope / Pending" below.
**Branch verified**: `fix/csp-dev-unsafe-eval` (current checkout; contains all PR1–PR5b commits + the CSP fix). Nothing merged to `main` (feature-branch-chain).
**Mode**: Strict TDD

## Completeness (in-scope tasks only)
| Metric | Value |
|--------|-------|
| Total tasks in tasks.md | 62 |
| Tasks checked complete | 35 (Phases 1, 2a, 2b, 3a, 4, 3b, 5a, 5b) |
| Tasks unchecked (out of scope, PR6–PR11) | 27 |
| Checked tasks with code evidence found | 35/35 |
| Checked tasks with missing/contradicted code | 0 |

## Build & Tests Execution

**Typecheck**: ✅ Passed (`npm run typecheck` — `tsc --noEmit`, 0 errors)

**Lint**: ✅ Passed (`npm run lint` — 0 errors, 0 warnings)

**Build**: ✅ Passed (`npm run build` — Next.js 16.2.10, 13 routes, static/SSG as expected: `/es`, `/en`, 8 article routes, `/_not-found`, proxy middleware)

**Tests**: ✅ 221 passed / 0 failed / 0 skipped (57 test files)
```text
npm run test:coverage
Test Files  57 passed (57)
     Tests  221 passed (221)
```

**Coverage**: 97.48% stmts / 92.16% branch / 97.95% funcs / 97.44% lines — threshold 80% → ✅ Above (all metrics)

**E2E (Playwright)**: ✅ 27/27 passed against a real `next build` + `next start` production server (per `playwright.config.ts`), no DB required — none of the shipped PR1–PR5b surface consumes the database yet (contact/engagement routes land in PR6/PR7).
```text
npm run test:e2e
27 passed (3.5s)
```
Ran despite the "skip unless cheap" guidance because Chromium was already cached locally (no download needed) and multiple completed tasks (2.7, 3a.3, 3b.4, 4.x) explicitly claim e2e coverage — worth confirming with real runtime evidence rather than trusting the apply-progress report alone.

## Spec Compliance Matrix (in-scope capabilities)

### design-system
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Token Derivation | Token usage | `tokens.css` + component usage (static review, no hardcoded hex found in reviewed files) | ✅ COMPLIANT |
| Theme Toggle | Persists across reload | `use-theme.test.ts`, `e2e/theme-no-flash.spec.ts` (3 tests) | ✅ COMPLIANT |
| Scroll Progress Indicator | Progress updates on scroll | `scroll-progress.test.tsx` | ✅ COMPLIANT |
| Motion Interactions Respect Reduced Motion | Reduced motion honored | `use-reduced-motion.test.ts` | ✅ COMPLIANT |

### i18n
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Locale Routing | Root → 308 to `/es`; unprefixed → 308; `/api/*` excluded | `e2e/locale-routing.spec.ts` (4 tests, all passing) | ✅ COMPLIANT |
| Locale-Matched MDX Resolution | Locale switch on article page | `e2e/blog.spec.ts` ("switching locale on an article page preserves the slug...") | ✅ COMPLIANT |
| Locale Persistence on Navigation | Locale switch preserves context | `locale-switcher.test.tsx` (unit, generic behavior) | ✅ COMPLIANT (unit-level; full "preserve scroll position" is a SHOULD, not verified end-to-end — acceptable per spec wording) |
| SEO Metadata Consistency | Hreflang alternates present / canonical for fallback | `e2e/blog.spec.ts` (hreflang + canonical tests, both passing) | ✅ COMPLIANT |

### home-page
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Section Composition (partial, no github-activity yet) | Full page render, sections in order | `e2e/home-sections.spec.ts` ("renders the implemented sections in spec order") | ✅ COMPLIANT (partial set, as scoped — github-activity correctly absent, PR10) |
| In-Page Navigation | Anchor navigation | `e2e/home-sections.spec.ts` (anchor nav test) | ✅ COMPLIANT |
| Embedded Article List (no search yet) | Articles list renders inline / locale exclusion | `articles-section.test.tsx`, `list-published-articles.test.ts` | ✅ COMPLIANT (search-input scenarios correctly deferred to PR8 — no search code present, matches spec's "prior to PR8" carve-out) |
| Responsive Layout (partial) | Mobile/tablet/desktop viewports | `e2e/home-sections.spec.ts` (4 viewport tests, all passing) | ✅ COMPLIANT |

### blog
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| MDX Article Rendering | Article renders in requested locale | `e2e/blog.spec.ts` (es/en render tests) | ✅ COMPLIANT |
| Missing-Translation Fallback | Falls back with notice, no 404 | `e2e/blog.spec.ts` ("falls back to the available locale with a visible notice") | ✅ COMPLIANT |
| Frontmatter Validation | Valid/invalid frontmatter, reserved slugs, category catalog check | `frontmatter-schema.test.ts`, `real-content-tree.test.ts`, `category-catalog.test.ts` | ✅ COMPLIANT |
| Cross-Locale Frontmatter Consistency | Divergent category fails build | `mdx-loader.test.ts` (`validateContentTree`) | ✅ COMPLIANT |
| No Blog Index Route | `/blog` 308s, `/es/blog` and `/en/blog` 404 | `e2e/blog.spec.ts` ("no blog index route exists at either locale") | ✅ COMPLIANT |

### article-filter (task 3b.3 scope)
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Category Filtering | Filter by category, no reload | `e2e/home-sections.spec.ts` ("selecting a category filter pill filters the visible articles") | ✅ COMPLIANT |
| Reset Filter | "All" clears filter | `category-filter-pills.test.tsx` | ✅ COMPLIANT |
| Empty Result Handling | Empty-state on no match | Covered only at unit level per tasks.md note ("full empty-result e2e lands with PR8's search input") | ⚠️ PARTIAL — consistent with the documented deferral, not a gap |

### persistence
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Domain Repository Interfaces | Zero drizzle/db imports in domain | Verified structurally: `rg "^import"` on all 4 domain repo files returns zero results; ESLint `domain: allow: []` enforces this on every lint run | ✅ COMPLIANT |
| Infrastructure Repository Implementations | Drizzle impl satisfies interface | `drizzle-contact-message-repository.test.ts`, `drizzle-article-view-repository.test.ts` (4 cases), `drizzle-article-reaction-repository.test.ts` (3 cases), `drizzle-rate-limit-repository.test.ts` (3 cases) — all pglite integration tests, all passing | ✅ COMPLIANT |
| Versioned Schema and Migrations | Schema change ships with migration | `drizzle/0000_persistence_schema.sql` + `drizzle/meta/*` committed alongside `schema.ts` | ✅ COMPLIANT |
| Boundary Validation | Invalid data rejected before persistence | N/A yet — no API route consumes these repos until PR6/PR7 (correctly out of scope) | ➖ NOT YET APPLICABLE |
| Environment-Only Credentials | Fail-fast on missing `DATABASE_URL` | `env.test.ts` (fail-fast tests for `DATABASE_URL`/`VISITOR_HASH_SECRET`) | ✅ COMPLIANT |

### security
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Security Headers (incl. CSP baseline) | Headers present with restrictive values | `security-headers.test.ts` (18 assertions), `e2e/smoke.spec.ts` ("security headers are present on every response") | ✅ COMPLIANT |
| CSP baseline directives (production) | `script-src`/`style-src` = `'self' 'unsafe-inline'`, `object-src none`, `frame-ancestors none`, `base-uri self` | `security-headers.test.ts` — explicit byte-for-byte equality assertion against the canonical production CSP string, `buildSecurityHeaders(false)` and the no-arg default both verified | ✅ COMPLIANT |
| Dev-only `unsafe-eval` exception (unplanned hotfix) | Dev CSP adds `'unsafe-eval'` to `script-src` only, production untouched | `security-headers.test.ts` (5 new tests: dev-adds-eval, prod-excludes-eval, default-matches-prod, dev-equals-prod-except-script-src, all-other-headers-identical) | ✅ COMPLIANT |
| Input Validation / Rate Limiting / No PII Leakage / No Client-Side Secrets / Hashed Visitor Keys | — | No API routes exist yet (PR6/PR7/PR8) | ➖ OUT OF SCOPE (correctly deferred) |

### quality-pipeline
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Unit Test Gate | CI fails on test failure | `.github/workflows/ci.yml` `quality` job runs `npm run test:coverage` | ✅ COMPLIANT (config verified; CI execution itself not observable from this sandbox) |
| End-to-End Test Gate | CI runs Playwright, flow list grows per slice | `.github/workflows/ci.yml` `e2e` job wired with a real Postgres service container + migration step | ✅ COMPLIANT |
| Lighthouse Performance Budget | Non-blocking stub until PR11 | `.github/workflows/ci.yml` `lighthouse` job, `continue-on-error: true`, explicit "stub" naming | ✅ COMPLIANT |
| Coverage Threshold | 80% gate, correct exclude scope | `vitest.config.ts` — `include: src/**, scripts/**`; excludes `schema.ts`, `client.ts`, `database.ts`, `create-pglite-test-db.ts`, `fonts/index.ts`, test files, `.d.ts` — matches spec's named exclusion list exactly; actual run: 97.44% lines, well above 80% | ✅ COMPLIANT |
| Visible Status Badges | README badges present | `README.md` (3 placeholder badges: CI, Coverage, Lighthouse) | ✅ COMPLIANT (placeholder state correct — real status updates land at PR11 per spec) |
| Test-First Development | Red-green-refactor followed | Apply-progress "TDD Cycle Evidence" table (PR5b) present with RED/GREEN/TRIANGULATE columns; cross-checked against actual test files — all referenced test files exist and pass | ✅ COMPLIANT |

### seo (task 4.5 cross-ref only — full seo capability is PR9)
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Bilingual Sitemap with Hreflang (per-route metadata only, task 4.5) | Hreflang alternates present on blog routes | `e2e/blog.spec.ts` (hreflang + canonical tests) | ✅ COMPLIANT (route-level `generateMetadata`; the dedicated `/sitemap.ts`/RSS/OG routes are PR9, correctly absent) |

**Compliance summary**: 27/28 in-scope scenarios fully COMPLIANT, 1 PARTIAL (documented, expected deferral), 0 UNTESTED, 0 FAILING.

## TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Found in apply-progress (Engram #30) for PR5b; earlier PRs' findings sections in tasks.md describe RED/GREEN/coverage narratively rather than in the strict table format, but are consistent and verifiable |
| All tasks have tests | ✅ | 35/35 checked tasks have corresponding test files or documented, spec-compliant TDD exceptions (domain interfaces — pure types, zero runtime behavior) |
| RED confirmed (tests exist) | ✅ | All test files referenced in PR5b's TDD Cycle Evidence table exist in the codebase |
| GREEN confirmed (tests pass) | ✅ | 221/221 tests pass on execution (this run), matching/exceeding the reported 215/215 at PR5b (+6 from the CSP fix) |
| Triangulation adequate | ✅ | PR5b: 2–4 cases per repository; spot-checked other layers (e.g. `hero-section.test.tsx`, `security-headers.test.ts`) show multiple distinct assertions, not single-case smoke tests |
| Safety Net for modified files | ✅ | `security-headers.ts` (modified by the CSP fix) has 18 total assertions post-fix, including 5 new ones and all 13 pre-existing ones re-verified passing |

**TDD Compliance**: 6/6 checks passed

---

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | ~194 | ~52 | Vitest + Testing Library |
| Integration | 12 | 4 | Vitest + pglite (`@electric-sql/pglite`) |
| E2E | 27 | 5 | Playwright (real `next build` + `next start`) |
| **Total** | **221 unit/integration + 27 e2e = 248** | 57 (+5 e2e) | |

Note: exact unit-vs-integration split above the 4 pglite files is approximate (based on directory naming, not machine-classified per file).

---

### Changed File Coverage (representative — full report in `npm run test:coverage` output above)
| File | Line % | Branch % | Uncovered Lines | Rating |
|------|--------|----------|-----------------|--------|
| `src/shared/config/security-headers.ts` | 100% | 100% | — | ✅ Excellent |
| `src/features/*/domain/*-repository.ts` (4 files) | 100% | 100% | — | ✅ Excellent (declarative interfaces) |
| `src/features/*/infrastructure/drizzle-*-repository.ts` (4 files) | 100% | 75–100% | see below | ✅ Excellent / ⚠️ Acceptable |
| `src/shared/i18n/request.ts` | 0% | 100% | 11-16 | ❌ Below threshold in isolation, but is next-intl RSC bootstrap wiring (its one logic branch, locale fallback, is extracted and fully tested in `resolveRequestLocale`) — pre-existing from PR2b, not a PR5b/CSP regression |

**Average changed file coverage**: 97.44% (aggregate, all files) — above the 80% gate.

---

### Assertion Quality
Manually scanned all test files for tautologies, ghost loops, mock-heavy tests, and smoke-test-only patterns:
- **Tautologies**: 0 found (`expect(true).toBe(true)` pattern search returned zero matches)
- **Ghost loops**: 0 found — the only `for...of`/`forEach` loops in test files (`stack-strip.test.tsx`, `skills-section.test.tsx`) iterate over hardcoded, non-empty local fixture arrays, not over DOM query results that could be empty
- **Mock-heavy tests**: 0 found (no file has mocks > 2× assertions)
- **Smoke-test-only**: 0 found — spot-checked `hero-section.test.tsx` and others with high `toBeInTheDocument()` counts; all assert specific content/attributes (text, hrefs, ids), not bare "renders without crash"

**Assertion quality**: ✅ All assertions verify real behavior

---

### Quality Metrics
**Linter**: ✅ No errors (`npm run lint`, repo-wide)
**Type Checker**: ✅ No errors (`npm run typecheck`, repo-wide)

## Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| ESLint boundaries (`domain: allow: []`) | ✅ Implemented | Structurally enforces zero-import domain layers; verified in `eslint.config.mjs` |
| Repository factory-function pattern | ✅ Implemented | Consistent across `blog` (PR4), `contact`/`engagement`/`rate-limit` (PR5b) |
| `next.config.ts` wires `securityHeaders` | ✅ Implemented | `headers()` async function applies to `/(.*)` — all routes |
| ADR-0007 updated for the CSP dev exception | ✅ Implemented | `docs/adr/0007-csp-script-src-strategy.md` documents the dev-only `'unsafe-eval'` addition with rationale |
| No `app/api/*` routes present yet | ✅ Confirmed | Correctly matches PR6+ scope — no premature API surface |

## Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Screaming architecture (`app/` composition root, `src/features/*` clean layers) | ✅ Yes | Verified folder tree matches design.md |
| `RateLimitRepository` under `shared/rate-limit/` (deviation from literal task wording) | ✅ Yes, documented | Cross-cutting concern, justified in apply findings; `shared -> shared` and `infrastructure -> shared` are allowed boundary edges |
| `search_vector` as plain (non-generated) column | ✅ Yes, documented | `to_tsvector` is `STABLE` not `IMMUTABLE` — Postgres constraint, correctly worked around |
| pglite as integration-test DB (no testcontainers fallback) | ✅ Yes | Verified parity claim is consistent with passing pglite-backed repository tests in this run |
| CSP dev-only `'unsafe-eval'` exception | ✅ Yes, documented | Not in original design.md (unplanned hotfix), but ADR-0007 updated in the same change — acceptable |

## Issues Found

**CRITICAL**: None.

**WARNING**:
1. **CSP dev-mode hotfix not reflected in `tasks.md` or `state.yaml`.** The fix on `fix/csp-dev-unsafe-eval` (commit `d849955`, base = `feat/pr5b-persistence-repos`) shipped real code, tests, and an ADR update, but `tasks.md` has no corresponding task entry or "apply findings" subsection documenting it (findings sections stop at "PR5b apply findings"), and `state.yaml`'s `apply.note` still cites the pre-fix test count (215/215) rather than the current 221/221. This is a documentation-consistency gap, not a functional one — the Engram session summary (#41) does document it. Recommend adding a short "CSP dev fix" note to `tasks.md` and refreshing `state.yaml`'s test count before the terminal verify/archive, so the openspec artifact trail (the team-shareable record) matches what actually shipped.
2. **`i18n` spec's Locale Persistence on Navigation "SHOULD preserve scroll position" is only unit-tested at the generic-behavior level** (locale switch + path preservation), not verified end-to-end for actual scroll-position restoration. This is a SHOULD (not MUST) in the spec, so it is not a compliance failure, but flagging for completeness since it's the one scenario without direct runtime evidence of the specific "preserve scroll position" clause.

**SUGGESTION**:
1. `src/shared/i18n/request.ts` shows 0% coverage in the report (next-intl RSC bootstrap + a dynamic `import()`). This is pre-existing from PR2b and already justified (its one real logic branch is extracted into a separately-tested pure function), but as the codebase grows it may be worth a lightweight integration test directly exercising this file to avoid it becoming a blind spot.
2. Test Layer Distribution is unit-heavy (~194 unit vs 12 integration vs 27 e2e) — appropriate for the current feature mix, but as PR6+ (contact, engagement APIs) land, ensure integration-level coverage keeps pace with the growing number of route handlers rather than relying solely on e2e for API-layer behavior.

## Out-of-Scope / Pending (PR6–PR11, 27 tasks — NOT verified, listed for context only)
- **PR6 (Contact)**: 6.1–6.6 — API validation, persistence+email, rate limiting/honeypot, form UI wiring, e2e, privacy page. Not started; no `app/api/contact` route exists.
- **PR7 (Engagement)**: 7.1–7.5 — visitor-hash, views/reactions API routes, public read endpoint, UI. Not started.
- **PR8 (Search)**: 8.1–8.4 — sync script, search route, ranking, UI search input. Not started; `article_search` repository deliberately deferred here per PR5b findings.
- **PR9 (SEO pack)**: 9.1–9.3 — OG images, RSS feeds, sitemap route. Not started (route-level metadata for blog only, task 4.5, is already in scope and verified above).
- **PR10 (GitHub Activity)**: 10.1–10.4 — last slice, home page section-order test update pending.
- **PR11 (Hardening)**: 11.1–11.5 — full CSP/Lighthouse verification, coverage gate integrity review, full Playwright pass, ADR finalization.

None of these were treated as failures; they are simply not yet built, consistent with their unchecked status in `tasks.md`.

## Verdict
**PASS WITH WARNINGS** — all in-scope (35/62) tasks have verifiable, passing, spec-compliant implementations with strong test/coverage evidence (221/221 unit+integration tests, 27/27 e2e, 97.44% line coverage, clean lint/typecheck/build). Two WARNINGs are documentation-consistency gaps (task/state artifact drift for the CSP hotfix, one SHOULD-clause without dedicated e2e evidence) — neither blocks continued development on PR6, but both should be closed before the terminal verify/archive for full artifact trail integrity.
