# Verification Report — TERMINAL (PR1–PR12, full scope, post resolve-blockers)

**Change**: portfolio-site
**Date**: 2026-07-07
**Scope**: Full terminal re-verification after the CRITICAL-1 resolve-blockers fix (commit `b721b69`) and the user-approved PR12 tech-logos scope addition (commits `e672ba2`, `d50bb5b`). Supersedes both prior reports in this file's history: the interim PR1–PR5b report and the terminal PR1–PR11 report (verdict FAIL, CRITICAL-1). This is the last gate before `sdd-archive`.
**Branch verified**: `feat/pr12-tech-logos` (new tip of the feature-branch-chain; base = `feat/pr11-hardening`). Nothing merged to `main`.
**Mode**: Strict TDD

> **This report supersedes all prior versions.** All findings below are independent, this-session evidence — re-derived from source inspection and real command execution.

## Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 62 (11 planned phases) + 2 documented apply-findings sections (resolve-blockers, PR12 scope addition — not numbered tasks, tracked in `tasks.md`) |
| Tasks checked complete | 62/62 |
| Tasks unchecked | 0 |

## Build & Tests Execution

**Lint**: PASSED (`npm run lint` — 0 errors, 0 warnings)

**Typecheck**: PASSED (`npm run typecheck` — `tsc --noEmit`, 0 errors)

**Tests**: PASSED — 457 passed / 0 failed / 0 skipped (102 test files)
```text
npm run test:coverage
Test Files  102 passed (102)
     Tests  457 passed (457)
```
Matches PR12's apply-findings claim exactly (up from 441 post-resolve-blockers, up from 440 pre-fix).

**Coverage**: 97.51% stmts / 93.48% branch / 96.32% funcs / 97.46% lines — threshold 80% → PASSED on all four metrics. Matches PR12's claimed numbers exactly.

**Build**: PASSED (`npm run build` — Next.js 16.2.10 Turbopack, 22 routes, unchanged count from PR11)

**E2E (Playwright)**: PASSED — **48/48**, run with `CI=1` (forces a genuinely fresh server, avoiding the documented stale-`next-server` false-positive trap) against the real production build, real local Docker Postgres (`portfolio-postgres-1`, healthy), after `npm run db:migrate` + `npm run db:sync-search`.
```text
Running 48 tests using 1 worker
  ✓ e2e/home-sections.spec.ts:45 › mobile viewport (375px): sections stack with no horizontal overflow (146ms)
  ✓ e2e/home-sections.spec.ts:62 › mobile viewport (375px): projects, articles, and filter pills stack with no horizontal overflow (133ms)
  48 passed (11.5s)
```
**CRITICAL-1 fix confirmed for real, exercising the real-data path**: independently verified via a live production server on an alternate port (avoiding any stale-process ambiguity) — `curl`'d the rendered `/es` HTML and confirmed the `#github-activity` section renders genuine GitHub API data (`7 repos públicos`, `1 seguidores`, `75 eventos recientes`, real repo cards linking to `github.com/andresvalencia72/valenciafullstack`), not the `{kind:"unavailable"}` fallback — meaning `GITHUB_TOKEN` is genuinely configured in this environment and the two mobile-viewport e2e scenarios are exercising the actual bug's original reproduction path, not a trivial always-passing fallback state. Confirmed `min-w-0` is present on both the grid `<li>` and its flex-container `<a>` in the live rendered HTML.

**`npm run verify:no-client-secrets`**: PASSED — 0 leaked secrets found against the real production `.next/static` build.

**Lighthouse CI** (`npm run lighthouse`, `lhci autorun`, real production server, mobile default, `numberOfRuns: 3`): **FAILED** — see CRITICAL-2 below. `/es` and `/en` Performance now score consistently **88–89** (below the `>= 90` MUST threshold), confirmed via a controlled, immediate A/B comparison against the `feat/pr11-hardening` baseline (which passes cleanly, `/es` 89–90, `/en` 90, median >= 90, matching the prior report's "thin margin but passing" characterization exactly).

## Spec Compliance Matrix (by capability, representative scenarios + e2e/PR12 cross-reference)

| Capability | Requirements verified | Result |
|---|---|---|
| home-page | Responsive Layout (no horizontal overflow at 375px), incl. `github-activity` real-data rendering | ✅ COMPLIANT — `e2e/home-sections.spec.ts` mobile-viewport scenarios pass against real GitHub data (previously FAILING, now fixed and independently re-confirmed) |
| github-activity | Grid/flex overflow guard on real repo-card rendering | ✅ COMPLIANT — `min-w-0` fix verified both in the unit regression test and live rendered HTML |
| design-system (SkillBadge surface) | Decorative icon accessibility, no CSP violation | ✅ COMPLIANT — all 10 `<svg>` icons carry `aria-hidden="true"` + `focusable="false"`; accessible text (category label, title, description) lives in the surrounding card, unchanged from PR3a's original text-only badges; live HTML confirms zero external requests (`devicon`/CDN grep: no matches) and CSP stays `style-src 'self' 'unsafe-inline'`/`script-src 'self' 'unsafe-inline'`, no `img-src` relaxation needed (inline SVG, not `<img>`) |
| quality-pipeline: Lighthouse Performance Budget | CI MUST fail the build if Performance < 90 | ❌ **NON-COMPLIANT on the current branch, but the gate itself is correctly enforcing this spec** — see CRITICAL-2. The gate is doing exactly what its own spec scenario describes ("GIVEN a PR drops Performance below 90 … THEN the pipeline MUST report failure") — it correctly fails locally, and would correctly fail the real `.github/workflows/ci.yml` `lighthouse` job (confirmed no `continue-on-error`) |
| quality-pipeline (all other gates) | Unit/coverage/lint/typecheck/build/e2e/no-client-secrets | ✅ COMPLIANT — all green, see above |
| 11 other PR1–PR11 capabilities (i18n, blog, article-filter, persistence, contact, engagement, search, seo, security) | Unaffected by this session's changes | Not independently re-checked line-by-line this session (no PR12 diff touches these features); prior terminal report's ✅ findings stand, carried forward |

**Compliance summary**: All functional/spec-scenario regressions from the prior report are resolved. One new regression found and confirmed this session (CRITICAL-2, a real Lighthouse Performance budget failure), root-caused to PR12's vendored SVG icon components.

## Correctness (Static Evidence, spot-checked this session)

| Requirement | Status | Notes |
|------------|--------|-------|
| `min-w-0` fix locus | ✅ Implemented | `github-activity-panel.tsx` — `<li className="min-w-0">` and `<a className="flex h-full min-w-0 flex-col …">`, matches the prior report's own suggested fix exactly |
| Regression test for CRITICAL-1 | ✅ Implemented | New `github-activity-panel.test.tsx` case renders a realistic long, unwrapped description and asserts `min-w-0` on both ancestors — directly implements SUGGESTION-3 from the prior report |
| Icon decorative markup | ✅ Implemented | All 10 icon components: `aria-hidden="true"` `focusable="false"` `data-icon="{name}"`, confirmed present exactly once each on the live rendered page |
| Gradient/id collision guard | ✅ Implemented | `nodejs-icon-a/b/c` and `php-icon-a` namespaced away from devicon's shared upstream bare `id="a"`; confirmed unique on the live rendered page (no duplicate `id` values) |
| Next.js icon dark-mode legibility | ✅ Implemented | `fill="currentColor"` (not present upstream) on `nextjs-icon.tsx`'s path, confirmed in live HTML |
| MIT attribution | ✅ Implemented | `docs/third-party-assets.md` documents devicon v2.17.0, MIT license, per-file provenance table |
| No new dependency added | ✅ Confirmed | `package.json`/`package-lock.json` untouched by PR12 (icons hand-vendored, not `npm install`ed) |
| `app/robots.ts` | ❌ Not implemented (unchanged, WARNING-2 carried) | Confirmed via live request: `GET /robots.txt` → 404, `GET /sitemap.xml` → 200 |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| `feature-branch-chain` delivery | ✅ Yes | `feat/pr12-tech-logos` bases on `feat/pr11-hardening`, PR #17 open non-draft, nothing merged to `main` |
| ADR-0007 CSP (`style-src`/`script-src 'self'`) | ✅ Yes | No CDN/external font added for icons; inline SVG only |
| Strict TDD (RED before GREEN) | ✅ Yes | Confirmed via `tasks.md`'s TDD Cycle Evidence tables for both the resolve-blockers fix and PR12; spot-read confirms the described RED states (import-resolution failure, icon-presence assertion failure) are consistent with the diff |

## Issues Found

### CRITICAL

**CRITICAL-2 (NEW): `quality-pipeline`'s Lighthouse Performance Budget MUST-gate now fails deterministically on `/es` and `/en` — a real, reproducible regression, most likely caused by PR12's added client-bundle weight.**

- **Evidence**: `npm run lighthouse` (`lhci autorun`, real production server, mobile preset, `numberOfRuns: 3`) run twice on `feat/pr12-tech-logos`: `/es` Performance = 88, 89, 89 (first run) and 88, 89, 89 (second run); `/en` Performance = 89, 89, 89 (both runs). Both fail the `>= 0.90` `minScore` assertion, exit code 1.
- **Controlled A/B comparison** (to rule out environmental/thermal noise, not just a static claim): immediately switched to the pre-PR12 baseline (`feat/pr11-hardening`), rebuilt, and re-ran Lighthouse — passed cleanly both times (`/es` = 89/90/90 and 89/90/90; `/en` = 90/90/90 and 90/90/90 — matching the prior terminal report's "thin margin but passing" characterization almost exactly). Switched back to `feat/pr12-tech-logos` immediately after and reproduced the failure a second time. The branch-linked pattern held consistently across four total measurement rounds (PR12 → baseline → PR12 → baseline, interleaved to control for time-based system load drift), which is reasonably strong evidence this is a real, code-linked regression rather than pure Lighthouse run-to-run noise (Lighthouse's known noise floor is real but did not explain a scores staying on the wrong side of the threshold consistently for one branch and the right side for the other, at exactly the same historical margin reported for PR11).
- **Root cause (probable, not 100% certain)**: the LCP element itself is unrelated to the new icons (it's the hero's subtitle `<p>`, identical DOM path on both branches, LCP time itself moved from ~3.6s baseline to ~3.8–3.9s on PR12 — a ~200–300ms regression). `SkillsSection` is wrapped in `Reveal`/`Tilt` (`"use client"`, framer-motion), meaning `SkillBadge` and all 10 new icon components (504 lines of hand-written+vendored SVG/JSX, mostly raw path-data strings) are bundled into the home page's client JS. The most plausible explanation is increased client-bundle parse/compile/hydration cost delaying the browser's ability to paint even unrelated above-the-fold content — a known Lighthouse Performance side effect of larger client bundles, not necessarily anything about the icons' own rendering.
- **Spec impact**: `quality-pipeline`'s own Lighthouse Performance Budget requirement is MUST-level and explicitly designed to catch exactly this ("GIVEN a PR drops the Performance score below 90 … THEN the pipeline MUST report failure"). Confirmed the real `.github/workflows/ci.yml` `lighthouse` job runs `npm run lighthouse` with no `continue-on-error` — this would fail real CI on PR #17 as currently written.
- **Suggested fix locus** (not applied — verify phase reports, does not fix): investigate whether `SkillsSection`/`SkillBadge` can avoid full client-bundle inclusion (e.g., render icons as inline SVG from a Server Component and only keep `Reveal`/`Tilt`'s wrapper as client, or lazy-load icons), or accept and re-tune the Lighthouse budget/hero LCP further. Not a CSS/markup bug like CRITICAL-1 — this is a bundle-size/performance-budget regression.
- **Blocks archive**: yes, per the Decision Gates table ("Test command exits non-zero → CRITICAL") — `npm run lighthouse` is a real gate command and it exits non-zero on this branch, reproducibly.

### WARNING

**WARNING-1 (carried forward, superseded by CRITICAL-2 on the current branch but still relevant to the pre-PR12 baseline)**: the underlying Lighthouse Performance margin was already thin pre-PR12 (`/es` dipping to 89 on individual runs, median passing at 90) — PR12 pushed it over the edge. Not a new finding in kind, but PR12 is the first branch where it actually crosses the threshold.

**WARNING-2 (carried forward, unchanged): `app/robots.ts` was never shipped.** Confirmed via live request this session: `GET /robots.txt` → 404, `GET /sitemap.xml` → 200. No owning task, no spec MUST scenario. Not blocking archive.

**WARNING-3 (carried forward, unchanged): i18n's "SHOULD preserve scroll position" on locale switch remains untested at the e2e/behavioral level** — a SHOULD, not a MUST. Not independently re-checked this session (PR12 does not touch i18n).

### SUGGESTION

**SUGGESTION-1 (carried forward, unchanged)**: `src/shared/i18n/request.ts` still shows 0% direct coverage. Pre-existing since PR2b, already justified.

**SUGGESTION-2 (carried forward from the PR1-PR11 report, unaffected)**: late PR11 documentation/tooling commits remain consistent with quality-pipeline/security specs.

**SUGGESTION-3 (RESOLVED this session)**: the prior report's suggestion to add a `GithubActivityPanel` regression test with realistic long-description fixture data at a narrow viewport was implemented as part of the CRITICAL-1 fix (commit `b721b69`).

**SUGGESTION-4 (NEW)**: if CRITICAL-2's root cause is confirmed as client-bundle weight, consider adding a lightweight bundle-size or Lighthouse regression check scoped to PR-diff time (not just absolute-threshold CI), so future above-the-fold-adjacent additions surface a budget delta earlier, before a full terminal verify pass.

## Out-of-Scope / Pending

None new. All 62 tasks remain checked; PR12 is an explicit, user-approved scope addition, not a tasks.md phase, fully documented in `tasks.md`'s "PR11 resolve-blockers + PR12 tech-logos apply findings" section.

## Verdict

**FAIL** — CRITICAL-1 (the prior blocker) is genuinely fixed and independently re-verified against the real-data path. However, this session found and confirmed a new CRITICAL regression (CRITICAL-2): PR12's icon-vendoring work pushes the `quality-pipeline` capability's own MUST-level Lighthouse Performance budget gate from a passing "thin margin" (median >= 90) to a deterministically failing state (median 88–89) on `/es` and `/en`, confirmed via a controlled, interleaved A/B comparison against the pre-PR12 baseline. This is exactly the class of regression the gate's own spec scenario is written to catch, and it would fail the real CI `lighthouse` job as currently configured (no `continue-on-error`). All other gates are genuinely green: lint, typecheck, 457/457 unit tests at 97%+ coverage, a clean production build, zero leaked client-side secrets, and 48/48 e2e (including both previously-failing mobile-overflow scenarios, now independently confirmed against the real-data path). Recommend: investigate and fix the Lighthouse Performance regression (likely client-bundle weight from the new icon components — see suggested fix locus above), then re-run this verify phase before proceeding to `sdd-archive`. WARNING-2 (`robots.txt`) and WARNING-3 (i18n scroll position) remain known, disclosed, non-blocking residuals.
