# Verification Report — TERMINAL (PR1–PR11, full scope)

**Change**: portfolio-site
**Date**: 2026-07-07
**Scope**: Full terminal verification, all 11 phases / 62 tasks (PR1 through PR11), superseding the interim PR1–PR5b report dated 2026-07-07. This is the last gate before `sdd-archive`.
**Branch verified**: `feat/pr11-hardening` (tip of the feature-branch-chain; contains the cumulative implementation of PR1–PR11). Nothing merged to `main` — each PR targets its parent branch per `chain_strategy: feature-branch-chain`.
**Mode**: Strict TDD

> **This report supersedes** `verify-report.md`'s prior interim version (PR1–PR5b + CSP hotfix only). All findings below are independent, this-session evidence — re-derived from source inspection and real command execution, not carried over from the interim report except where explicitly noted as "confirmed unchanged."

## Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 62 |
| Tasks checked complete | 62 |
| Tasks unchecked | 0 |
| Checked tasks with code evidence found | 62/62 (spot-checked by capability; see Correctness section) |
| Checked tasks with missing/contradicted code | 0 |

## Build & Tests Execution

**Lint**: ✅ Passed (`npm run lint` — 0 errors, 0 warnings, repo-wide)

**Typecheck**: ✅ Passed (`npm run typecheck` — `tsc --noEmit`, 0 errors)

**Tests**: ✅ 440 passed / 0 failed / 0 skipped (100 test files)
```text
npm run test:coverage
Test Files  100 passed (100)
     Tests  440 passed (440)
```
Matches the count claimed in `state.yaml`'s PR11 apply note exactly.

**Coverage**: 97.47% stmts / 93.48% branch / 96.18% funcs / 97.42% lines — threshold 80% (lines+branches, `vitest.config.ts`) → ✅ Above on all four metrics. Matches the exact numbers claimed in `state.yaml`.

**Build**: ✅ Passed (`npm run build` — Next.js 16.2.10 Turbopack, 22 routes, matches PR11's claimed route count: `/[locale]` dynamic, `/[locale]/blog/[slug]` + `/opengraph-image` SSG, `/[locale]/privacy`, `/[locale]/rss.xml`, 5 `/api/*` route handlers, `/sitemap.xml` static — no `app/robots.ts`, see Issues)

**E2E (Playwright)**: ❌ **46/48 passed, 2 FAILED** (deterministic across 3 attempts each, `CI=1`, real production `next build` + `next start`, real local Docker Postgres, `npm run db:migrate` + `npm run db:sync-search` already applied)
```text
[chromium] e2e/home-sections.spec.ts:45 › mobile viewport (375px): sections stack with no horizontal overflow — FAILED (all 3 attempts)
[chromium] e2e/home-sections.spec.ts:62 › mobile viewport (375px): projects, articles, and filter pills stack with no horizontal overflow — FAILED (all 3 attempts)
46 passed, 2 failed
```
This directly contradicts `state.yaml`'s PR11 apply note ("48/48 e2e"). The discrepancy is real and explained, not a flake — see CRITICAL-1 below. All other e2e files (`blog`, `contact`, `engagement`, `locale-routing`, `privacy`, `search`, `seo`, `smoke`, `theme-no-flash`) passed in full, matching PR11's claims.

**Lighthouse CI** (`npm run lighthouse`, `lhci autorun`, real production server, mobile default, `numberOfRuns: 3`): ✅ Gate passes, exit 0, all 3 URLs (`/es`, `/en`, `/es/blog/clean-architecture-nextjs`) clear all 4 thresholds on the median-of-3 assertion. Fresh evidence (2 independent 3-run sets, 6 samples/URL, this session): `/es` Performance 0.89–0.90 (individual runs dipped to 0.89, below the 0.90 threshold, twice out of 6 samples), Accessibility 0.96, Best Practices 0.96, SEO 1.00; `/en` Performance 0.90 (stable, 6/6 runs), Accessibility 0.96, Best Practices 0.96, SEO 1.00; article page Performance 0.95–0.96, Accessibility 0.96, Best Practices 1.00, SEO 1.00. Confirms the residual flagged in the apply brief ("Lighthouse Performance margin thin, 0.90–0.92 locally") is real, not overstated — see WARNING-1.

**`npm run verify:no-client-secrets`**: ✅ 0 leaked secrets found against the real production `.next/static` build (exit 0).

## Spec Compliance Matrix (by capability, representative scenarios + full e2e cross-reference)

| Capability | Requirements verified | Result |
|---|---|---|
| design-system | Token derivation, theme toggle no-flash, scroll progress, reduced-motion | ✅ COMPLIANT — `e2e/theme-no-flash.spec.ts` (3/3), unit suites (`use-theme`, `scroll-progress`, `use-reduced-motion`) |
| i18n | Locale routing (308, `localePrefix: always`), locale-matched MDX resolution, SEO metadata consistency | ✅ COMPLIANT — `e2e/locale-routing.spec.ts` (4/4), `e2e/blog.spec.ts` hreflang/canonical cases; ⚠️ PARTIAL — "SHOULD preserve scroll position" on locale switch remains unit-tested (generic behavior) only, no dedicated e2e (carried from interim report, still accurate) |
| home-page | Section composition (9 sections incl. github-activity), in-page nav, embedded article list + search integration | ❌ **NON-COMPLIANT on Responsive Layout** — `e2e/home-sections.spec.ts` mobile-viewport scenarios FAIL deterministically when the github-activity section renders real data (see CRITICAL-1). Section composition/order and desktop/tablet layout scenarios remain ✅ COMPLIANT |
| blog | MDX rendering, missing-translation fallback, frontmatter validation, cross-locale consistency, no blog index | ✅ COMPLIANT — `e2e/blog.spec.ts` (11/11) |
| article-filter | Category filtering, reset, empty-result handling, search interaction | ✅ COMPLIANT — `e2e/home-sections.spec.ts` filter-pill case, `e2e/search.spec.ts` (4/4) |
| persistence | Domain repo interfaces (zero drizzle imports), infra impls, versioned migrations, env fail-fast | ✅ COMPLIANT — verified structurally (`domain: allow: []` eslint rule + spot-read of 4 domain repo files, zero imports), pglite integration suites all passing |
| contact | Server-side validation, persistence-independent-of-email, rate limit + honeypot check order, no PII leakage, privacy disclosure | ✅ COMPLIANT — spot-read `submit-contact-message.ts` confirms exact check order (rate-limit → honeypot → validation → persist → email, 503 reserved for persistence only, 202 for email degradation); `e2e/contact.spec.ts` (3/3), `e2e/privacy.spec.ts` (2/2) |
| engagement | View/reaction permanent dedupe, visitor-hash privacy, endpoint validation, public aggregate read, graceful degradation | ✅ COMPLIANT — spot-read confirms `onConflictDoNothing` insert-if-absent pattern in both `drizzle-article-view-repository.ts` and `drizzle-article-reaction-repository.ts`; `e2e/engagement.spec.ts` (3/3, newly added in PR11) |
| search | Full-text query (per-locale regconfig, `websearch_to_tsquery`), relevance ranking, input validation/rate limit, no-match handling, index sync full reconcile, graceful degradation | ✅ COMPLIANT — `e2e/search.spec.ts` (4/4), pglite integration tests for ranking/special-chars/prune |
| seo | Dynamic OG images, per-locale RSS, bilingual sitemap+hreflang | ✅ COMPLIANT — `e2e/seo.spec.ts` (8/8) |
| github-activity | Server-side fetch, ISR/fetch-level caching, non-blocking Suspense render, graceful failure handling | ✅ COMPLIANT on data-fetch/fallback behavior (unit-tested exhaustively: token-absent, client-reject, non-OK status, timeout all collapse to the same fallback); ❌ **its "available" (success) rendering state breaks the home-page Responsive Layout requirement on mobile** — see CRITICAL-1. This capability's own spec has no responsive-layout scenario of its own (that requirement lives in `home-page`), but the bug lives inside `github-activity`'s UI component |
| security | Input validation, per-endpoint rate limiting, no PII/internal leakage, security headers/CSP, no client-side secrets, hashed visitor keys | ✅ COMPLIANT — `e2e/smoke.spec.ts` (3/3, incl. the PR11-added API-response header assertion), `npm run verify:no-client-secrets` (0 leaks), spot-read of `security-headers.ts` wiring into `next.config.ts` |
| quality-pipeline | Unit/e2e/Lighthouse gates, coverage threshold (80%, `src/**`+`scripts/**`), visible badges, test-first development | ⚠️ PARTIAL — coverage/lint/typecheck/build gates all genuinely green; Lighthouse gate passes but with a confirmed-thin margin (WARNING-1); the e2e gate itself is currently RED in this session's real configuration (CRITICAL-1), which is exactly what quality-pipeline's own "End-to-End Test Gate" requirement exists to catch — the gate is doing its job, the code under test has a real defect |

**Compliance summary**: 12/13 capabilities fully compliant on direct inspection; 1 capability (`home-page`, cross-cutting into `github-activity`) has a confirmed, reproducible CRITICAL violation of its Responsive Layout requirement. 0 UNTESTED scenarios found beyond the two already-carried, low-severity SHOULD-level items from the interim report.

## TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Every PR (PR1 through PR11) has a "TDD Cycle Evidence" table in `tasks.md` with RED/GREEN/TRIANGULATE/REFACTOR columns |
| All tasks have tests | ✅ | 62/62 checked tasks have corresponding test files or documented, spec-compliant TDD exceptions (domain interfaces, thin `app/` adapters, pure config changes) |
| RED confirmed (tests exist) | ✅ | Spot-checked test files referenced across PR6/PR7/PR8/PR11's evidence tables all exist in the codebase |
| GREEN confirmed (tests pass) | ✅ | 440/440 unit+integration tests pass on this run |
| Triangulation adequate | ✅ | Consistently 2–12 cases per behavior across all PRs' evidence tables; single-case entries are explicitly annotated with a documented reason (structural interfaces, single-literal config) |
| Safety Net for modified files | ✅ | Every PR's evidence table shows pre-existing test counts re-run as a safety net before/after modification (e.g. PR11's hero-section 4/4 pre-existing re-run after the `Reveal` removal) |

**TDD Compliance**: 6/6 checks passed. Note: TDD process compliance does not by itself guarantee spec-level correctness — CRITICAL-1 below is a real gap in test **environment coverage** (the success-path mobile layout was never exercised with a live token), not a TDD-process failure; the component's own unit tests pass because they never render real (long) GitHub data at a constrained viewport.

---

### Assertion Quality
No new trivial-assertion patterns found on spot-check of PR11's new test files (`find-leaked-secrets.test.ts`, `verify-no-client-secrets.test.ts`, `hero-section.test.tsx`'s new case, `engagement.spec.ts`). Consistent with the interim report's prior clean finding for PR1–PR5b.

**Assertion quality**: ✅ No new issues found in this pass.

---

## Correctness (Static Evidence, spot-checked this session)
| Requirement | Status | Notes |
|------------|--------|-------|
| Contact check-order (rate-limit → honeypot → validation → persist → email) | ✅ Implemented | Read `submit-contact-message.ts` directly — matches the spec's literal ordering and status-code mapping exactly |
| Engagement insert-if-absent dedupe | ✅ Implemented | `onConflictDoNothing()` confirmed in both `drizzle-article-view-repository.ts` and `drizzle-article-reaction-repository.ts` |
| i18n 307→308 redirect upgrade | ✅ Implemented | `upgradeRedirectStatus()` in `middleware-rules.ts`, documented and unit-tested |
| Coverage gate config (`src/**`+`scripts/**`, 80% lines+branches) | ✅ Implemented | `vitest.config.ts` `coverage.thresholds` + `include`/`exclude` match the quality-pipeline spec's named exclusion list exactly |
| Security headers/CSP wiring | ✅ Implemented | `next.config.ts` imports `securityHeaders` from `shared/config/security-headers.ts`, applies via `headers()` to `/(.*)` |
| `app/robots.ts` | ❌ **Not implemented** | Confirmed via live request: `GET /robots.txt` → **404**. No route file exists. See WARNING-1... *(renumbered below, see WARNING-2)* |

## Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Screaming architecture, clean layers, `app/` composition root | ✅ Yes | Consistent across all 11 PRs' apply findings and this session's spot-reads |
| `feature-branch-chain` delivery, no merges until project end | ✅ Yes | `git log` confirms linear commit chain on `feat/pr11-hardening`, nothing merged to `main` |
| ADR-0001–0007 finalized (PR11, task 11.5) | ✅ Yes | All seven ADRs flipped to `Accepted` with Consequences sections per PR11's findings (not re-read line-by-line this session, but file existence + status confirmed via prior interim report and PR11's own detailed findings) |
| design.md folder tree — `app/robots.ts` | ❌ **Diverged, undelivered** | design.md's folder tree lists it as a sibling of `app/sitemap.ts`; no task in any of the 11 phases owns it; no capability spec has a MUST scenario requiring it. See WARNING-2 |

## Issues Found

### CRITICAL

**CRITICAL-1: `home-page` Responsive Layout requirement is violated on mobile when `github-activity` renders real data — reproducible, not a flake.**

- **Evidence**: `npm run test:e2e` (real production build, real Docker Postgres, `CI=1`) fails deterministically on `e2e/home-sections.spec.ts`'s two mobile-viewport (375px) scenarios, across 3 consecutive attempts each (initial + 2 retries), identical failure both times this session's full suite was run.
- **Root cause** (confirmed via direct DOM inspection at 375px): this session's `.env` has a working `GITHUB_TOKEN` — unlike every prior PR1–PR11 apply session, which explicitly recorded "no `GITHUB_TOKEN` configured" and therefore only ever exercised the fallback (`kind: "unavailable"`) rendering path. With a live token, `GithubActivityPanel` (`src/features/github-activity/ui/github-activity-panel.tsx`) renders real repository cards inside a `<ul className="grid ... md:grid-cols-2 lg:grid-cols-3">`. At the base (mobile) breakpoint the grid has no explicit column count, so its single implicit column is sized by the browser's default automatic minimum sizing for grid items — which is content-based (`min-width: auto` ≈ `min-content`), not `0`. The repo card's `<p className="truncate text-sm text-ink-soft">{repo.description}</p>` (line 78) uses Tailwind's `truncate` (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`), which visually clips but does **not** reduce the element's *min-content* width — that stays the full, un-wrapped description text width. Because neither the `<p>` itself nor any ancestor in its flex/grid chain (`<a class="flex h-full flex-col ...">` → `<li>` → `<ul class="grid ...">`) sets `min-w-0`, that full-text min-content width propagates all the way up and forces the grid track — and with it, the whole `#github-activity` section and the page body — to a computed width of **~552px on a 375px viewport** (confirmed: `getComputedStyle(ul).gridTemplateColumns === "551.828px"`, `document.documentElement.scrollWidth === 584` vs `window.innerWidth === 375`, a 209px overflow). This is the textbook CSS Grid/Flexbox `min-width: auto` overflow gotcha, and it is a real, deterministic bug in shipped PR10 code — not touched by PR11.
- **Why this was never caught before**: `home-page: Responsive Layout` ("Every section MUST render correctly across mobile, tablet, and desktop breakpoints without horizontal overflow") is a MUST-level scenario, and `e2e/home-sections.spec.ts` genuinely does assert it at 375px — but every prior CI run and every documented local apply/verify session (including the interim PR1–PR5b verify and all of PR10/PR11's own apply sessions) ran with no `GITHUB_TOKEN`, so the section only ever rendered its trivial, single-`<p>` fallback state, which cannot overflow. This terminal verify session is the first with a live token (most likely a direct, if unintended, consequence of PR11's own late README fix, commit `070787d`, which added a link to GitHub's fine-grained PAT generation page for `GITHUB_TOKEN` — plausibly prompting a real token to be configured locally for the first time). The "success" rendering path of a shipped, spec-covered feature has therefore never had real mobile-viewport verification until now.
- **Spec impact**: this is a genuine violation of `home-page`'s Responsive Layout MUST requirement, which will manifest in production for any real visitor on a narrow viewport once `GITHUB_TOKEN` is configured in the deployment environment — which is the intended, documented production configuration per design.md's env matrix (`GITHUB_TOKEN`: optional in dev, present in prod as a PAT). This is not a hypothetical edge case; it is the feature's primary intended state.
- **Suggested fix locus** (not applied — verify phase reports, does not fix): add `min-w-0` to the grid item chain in `github-activity-panel.tsx` (the `<li>` and/or the `<a>` flex container), which is the standard, well-established fix for this class of CSS Grid/Flexbox overflow.
- **Blocks archive**: yes, per the Decision Gates (a test command exited with real, reproducible failures against a MUST-level spec scenario).

### WARNING

**WARNING-1 (carried forward, confirmed with fresh evidence): Lighthouse Performance margin is genuinely thin.** Fresh measurement this session (2 independent 3-run sets, 6 samples per URL): `/es` Performance scored 0.89 on 2 of 6 samples — below the 0.90 threshold — with the gate still passing overall only because `numberOfRuns: 3` + median-based assertion smooths over single noisy runs. `/en` was more stable (0.90 on 6/6). This confirms the residual flagged in the apply brief is accurate, not overstated. The gate's own design (median-of-3) is a reasonable mitigation, but a genuinely bad CI run (2 of 3 samples below threshold) could still tip the median under 0.90 and fail the build. Not blocking archive — the gate is correctly designed and currently passing — but worth tracking as ongoing technical debt (e.g., further hero-section LCP tuning, or `numberOfRuns: 5`).

**WARNING-2: `app/robots.ts` was never shipped — a design.md deliverable gap, not a spec violation.** Confirmed via live request: `GET /robots.txt` → 404 (verified this session against a real production server), while `GET /sitemap.xml` → 200. `design.md`'s folder tree lists `app/robots.ts` as a sibling of `app/sitemap.ts`, and `middleware-rules.ts` explicitly excludes `/robots.txt` from locale-prefixing (implying something is expected to serve it), but no task across all 11 phases owns creating it, and none of the 13 capability specs (`seo`, `i18n`, or otherwise) has a MUST scenario requiring its existence. This was correctly self-flagged in PR9's apply findings and carried as an open residual through PR10/PR11 without being picked up. **Classification**: WARNING, not CRITICAL — it is a design.md/deliverable-completeness gap with mild real-world SEO impact (no `Sitemap:` directive discoverable via the conventional `/robots.txt` location; search engines still default-allow crawling absent the file), not a violation of any written, testable spec requirement. Recommend either adding a small dedicated task before a real production launch, or explicitly moving it to proposal-level Out of Scope if it's intentionally deferred.

**WARNING-3 (carried forward from interim report, unchanged): i18n's "SHOULD preserve scroll position" on locale switch remains untested at the e2e/behavioral level** — only the generic locale-switch-preserves-path behavior is unit-tested. This is a SHOULD, not a MUST, in the spec, so it is not a compliance failure, but it's the one i18n scenario without direct runtime evidence of the specific scroll-position clause.

### SUGGESTION

**SUGGESTION-1 (carried forward, unchanged)**: `src/shared/i18n/request.ts` still shows 0% direct coverage (next-intl RSC bootstrap + a dynamic `import()`); its one real logic branch (locale fallback) is extracted and separately tested. Pre-existing since PR2b, already justified — as the codebase grows, a lightweight integration test directly exercising this file would close a minor blind spot.

**SUGGESTION-2**: The late PR11 documentation/tooling commits (`6b06a4d` README setup rewrite, `070787d` PAT link, `e3cbfe3` `db:sync-search` `.env` loading fix) are all consistent with the `quality-pipeline` and `security` specs — no PII/secret exposure, no CI behavior change (CI still supplies env vars via job env, not a `.env` file; `--env-file-if-exists` is a no-op when no `.env` is present). Worth noting as a nice catch: `070787d`'s PAT-link addition is very plausibly what caused this verify session to be the first with a real `GITHUB_TOKEN` configured — which is exactly what surfaced CRITICAL-1. This is a good example of documentation improvements indirectly improving test coverage quality; recommend keeping a `GITHUB_TOKEN`-present CI/e2e lane (even if only run periodically, not on every PR) going forward so the success-path UI doesn't silently regress again.

**SUGGESTION-3**: Consider adding a dedicated component-level (Testing Library) or e2e test for `GithubActivityPanel`'s "available" (real-data) rendering state at a narrow viewport, using fixture data with a realistically long repo description — this is the actual regression-prevention fix for CRITICAL-1's root cause (in addition to the CSS fix itself), since the current unit tests for this component never exercise a long, unwrapped description string.

## Out-of-Scope / Pending
None. All 11 phases (PR1–PR11) are implemented, all 62 tasks are checked, and this is confirmed to be the final planned implementation slice per `tasks.md`'s PR table and PR11's own apply findings ("no further PRs are planned").

## Verdict
**FAIL** — one CRITICAL finding (CRITICAL-1: a real, deterministic, reproducible violation of the `home-page` capability's Responsive Layout MUST requirement, surfaced for the first time by this session's live `GITHUB_TOKEN`) blocks archive readiness. All quality gates that don't depend on this specific bug are genuinely green: lint, typecheck, 440/440 unit+integration tests at 97%+ coverage on every metric, a clean production build, zero leaked client-side secrets, and a passing (if thin-margin) Lighthouse budget. 46/48 e2e scenarios pass; the 2 failures are a real, well-diagnosed regression, not flakes or environment noise (reproduced identically across 3 attempts, and independently confirmed via direct DOM/CSS inspection). Recommend: fix the `min-w-0` CSS gap in `github-activity-panel.tsx`, add a regression test with realistic (longer) fixture data at a mobile viewport, decide on `app/robots.ts` (WARNING-2), then re-run this verify phase before proceeding to `sdd-archive`.
