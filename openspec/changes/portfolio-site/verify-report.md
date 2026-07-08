# Verification Report — TERMINAL (PR1–PR14, full scope)

**Change**: portfolio-site
**Date**: 2026-07-08
**Scope**: Full terminal re-verification covering the two user-approved design-fidelity additions that landed after the PR1–PR12 terminal report: **PR13** (skills bento grid-span fix + eyebrow/highlight/circle/bare-icon fidelity gaps, plus a same-branch/PR extension: bare icons everywhere, 18px radius, 0.16em eyebrow tracking) and **PR14** (site-header brand block, animated nav underline, circular theme toggle, ES/EN locale switcher, styled scroll progress). This report **supersedes** the prior terminal report in this file's history (PR1–PR12, verdict PASS). This is the last gate before `sdd-archive`.
**Branch verified**: `feat/pr14-header-fidelity` (chain tip; feature-branch-chain — PR #19 → base `feat/pr13-skills-fidelity` (PR #18) → base `feat/pr12-tech-logos` (PR #17) → base `feat/pr11-hardening` → … → PR1). Nothing merged to `main` — correct per the chain strategy, not a defect.
**Mode**: Strict TDD

> All findings below are independent, this-session evidence re-derived from source inspection (`git show`/`git diff` against the real commits) and real command execution (not from prior claims or `tasks.md`'s self-reported numbers, though every number was cross-checked and found accurate). Only the previously-disclosed non-blocking residuals (WARNING-2, WARNING-3, SUGGESTION-1) are carried forward without re-litigation, per the assigned scope; SUGGESTION-5 from the prior report was already resolved by the PR13 apply session and is closed here.

## Completeness

| Metric | Value |
|--------|-------|
| Planned phases (PR1–PR11) | 62/62 tasks checked complete |
| Documented apply-findings sections beyond the 11 planned phases | PR11 resolve-blockers, PR12 (tech logos), PR12 resolve-blockers (CRITICAL-2 fix), PR13 (skills fidelity), PR13 extension (bare icons/radius/tracking), PR14 (header fidelity) — all user-approved scope additions, all with full TDD evidence and verification sections in `tasks.md` |
| Tasks unchecked | 0 |

## Build & Tests Execution (all commands run for real, this session, on `feat/pr14-header-fidelity`)

**Lint**: PASSED — `npm run lint` (ESLint), 0 errors, 0 warnings.

**Typecheck**: PASSED — `npm run typecheck` (`tsc --noEmit`), 0 errors.

**Tests**: PASSED — 481/481, 104 test files.
```text
 Test Files  104 passed (104)
      Tests  481 passed (481)
```
Matches `tasks.md`'s claimed numbers exactly (up from 460/460 at the PR1–PR12 baseline: +7 PR13 + 2 PR13-extension-adjacent + 4 PR13-extension + 12 PR14 = +21, net 481).

**Coverage**: 97.55% stmts / 93.66% branch / 96.4% funcs / 97.5% lines — threshold 80% → **PASSED on all four metrics**, at/above the PR1–PR12 baseline (97.54/93.57/96.38/97.49) on every metric. Matches `tasks.md`'s claimed numbers exactly. Zero uncovered lines in any PR13/PR14-touched file beyond the pre-existing, already-justified residuals (`request.ts` 0% direct — SUGGESTION-1, carried; `sync-search.ts`/`verify-no-client-secrets.ts` CLI-wiring lines — pre-existing, unrelated to this scope).

**Build**: PASSED — `npm run build` (Next.js 16.2.10, Turbopack), clean compile, TypeScript pass, static generation succeeded for all pages, no new routes (`SiteHeader` is a `home/ui` component, not a route — matches the claim).

**`npm run verify:no-client-secrets`**: PASSED — "no configured secret values found in the client bundle", run against the real production `.next/static` build.

**Lighthouse CI** (`npm run lighthouse`, `lhci autorun`, real production server via `npm run start`, mobile default throttling, `numberOfRuns: 3`): **PASSED, exit code 0, run twice this session for stability** (per this task's explicit instruction — the header is the highest above-the-fold Lighthouse risk this session).

| URL | Run 1 (3 samples → median) | Run 2 (3 samples → median) | Exit code (both runs) |
|---|---|---|---|
| `/es` | 0.94 / 0.90 / 0.96 → **0.94** | 0.96 / 0.91 / 0.88 → **0.91** | 0 |
| `/en` | 0.81 / 0.96 / 0.91 → **0.91** | 0.91 / 0.97 / 0.91 → **0.91** | 0 |
| `/es/blog/clean-architecture-nextjs` | 0.98 / 0.93 / 0.95 → **0.95** | 0.98 / 0.94 / 0.95 → **0.95** | 0 |

All three URLs at or above the `>= 0.90` `minScore` assertion (LHCI's own median-of-3 assertion logic) across both independent full runs. Individual per-sample variance is real and expected — `lighthouserc.js`'s own documentation discloses "a single `/es` run varied between 0.88 and 0.95 across back-to-back executions with zero code changes," and this session observed one `/en` sample as low as 0.81 — but the median-of-3 assertion LHCI actually gates on held at or above 0.90 in every one of the 6 URL-runs across both sessions. This is consistent with the "historically thin margin" the task flagged, not a regression: the PR13/PR14 diffs add only static CSS/markup or reuse the already-shipped `LazyIcon` deferred-loading mechanism (see Regression Guards below), so there is no new above-the-fold payload weight to explain a genuine regression, and none was observed.

**E2E (Playwright)**: PASSED — 50/50, run with `CI=1` against a real production build, real local Docker Postgres (`portfolio-postgres-1`, healthy, 26h uptime), after `npm run db:migrate` (idempotent, already applied) and `npm run db:sync-search` (reconciled 7 rows).
```text
Running 50 tests using 1 worker
  ✓  43 [chromium] › e2e/skills-bento.spec.ts:16:7 › desktop (1280px): main-stack card spans 2x2, learning-now card spans 2x1 (1.1s)
  ✓  44 [chromium] › e2e/skills-bento.spec.ts:66:7 › mobile (375px): skills section stacks 2-up with no horizontal overflow (130ms)
  50 passed (13.7s)
```
**Operational note (this session's own hazard, same recurring class documented since PR3a/PR7/PR8/PR9/PR11)**: the first `test:e2e` invocation failed immediately with `Error: http://localhost:3000 is already used` — a stale `next-server` process (PID confirmed via `ps`, started well before this session's own Lighthouse runs) was still bound to port 3000 from an earlier, unrelated session. Killed the stale process (`kill -9`), confirmed the port was clear, and re-ran — clean 50/50 pass on the first genuinely fresh attempt. Not a code regression; a known environment hazard class, not new to this scope.

## Regression Guards (explicitly re-verified this session, live, in a real browser)

### CRITICAL-2 stays fixed (Lighthouse Performance / deferred icon rendering)
1. **Zero skill-icon SVG markup in the initial SSR HTML.** `curl`'d a live production `/es` response (101,673 bytes): the only `data-icon`/icon-name-adjacent match is the RSC streaming payload's `{"icon":"postgresql","className":"h-6.5 w-6.5"}` prop-reference string — a short string, not SVG path/gradient markup. Zero `<svg data-icon="...">` elements are present in the raw initial HTML. (Separately, the header's new `ThemeToggle` icon marker (`<span data-icon="moon">`) also appears in the raw HTML — this is a static, always-server-rendered CSS marker unrelated to the deferred devicon SVGs, and does not weaken this guard.)
2. **Icon markup remains code-split into its own chunk, unchanged in size.** `.next/static/chunks/3vw3of4aabapo.js` is the only chunk containing the icon path-data substrings (`nodejs-icon`, `php-icon`, `postgresql-icon`), sized **28,307 bytes** — byte-identical to the PR1–PR12 baseline, confirming PR13/PR14 did not add any new icon markup to this chunk or regress the code-splitting.
3. **Icons render correctly post-mount, verified live in a real headless Chromium browser (Playwright, this session).** `document.querySelectorAll('svg[data-icon]').length` → **10**, all with `aria-hidden="true"` and `focusable="false"`. Gradient ids `nodejs-icon-a`, `nodejs-icon-b`, `nodejs-icon-c`, `php-icon-a` each present, no duplicates. Zero requests to any origin other than `localhost:3000` during the full page load (no CDN, no external font/SVG fetch).
4. **CSP unchanged.** Live response header on `/es`: `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'` — identical shape to ADR-0007's baseline.
5. **No new dependency across the entire PR13/PR13-extension/PR14 span.** `git diff --stat 73f4ec9 23576d4 -- package.json package-lock.json` → empty diff.

### Locale-switcher hydration safety (PR7 aria-pressed hydration-mismatch precedent)
- Live browser check: **zero console errors** (including zero React hydration-mismatch warnings) on a fresh `/es` load with `networkidle` + a 500ms settle.
- `useLocale()` resolves identically server- and client-side via `NextIntlClientProvider` — the diff introduces no new `useState`/`useEffect` gating the switcher's initial render, matching the pattern PR14's own disclosure claims. Confirmed by source inspection of the actual diff (`git show 982cedb -- src/shared/i18n/ui/locale-switcher.tsx`): the only new state is the existing `activeLocale`/`handleSelect` logic, byte-identical in behavior to before; only the rendered markup (visible text, `aria-label`) changed.
- Live a11y snapshot: `role="group"`, `aria-label="Cambiar idioma"` (unchanged), two buttons with `aria-pressed="true"/"false"` (unchanged semantics) and `aria-label="Español"`/`"Inglés"` (full names preserved), visible text now the compact `"ES"`/`"EN"` per the design.

### Header accessibility (new in PR14)
- `ThemeToggle`: icon-only button, no visible text, `aria-label="Cambiar a tema oscuro"` (the exact string that used to render as visible text now renders as the accessible name — confirmed live, and confirmed by source diff that the same `t("switchToLight")`/`t("switchToDark")` translation keys are reused, not replaced), `aria-pressed` preserved.
- `LocaleSwitcher`: `role="group"` + `aria-label` present (see above).
- `SectionNav`: rendered inside a real `<nav aria-label="Inicio">` landmark (confirmed live), the new hover underline is a `<span aria-hidden="true">`, so it adds no noise to the accessible name of each link — every existing `getByRole` assertion keyed on link text is unaffected (confirmed by the unchanged e2e anchor-nav test still passing).

## TDD Compliance (Strict TDD Mode) — diff-verified this session, not trusted from `tasks.md` alone

Every `tasks.md` TDD Cycle Evidence claim for PR13, the PR13 extension, and PR14 was cross-checked against the actual commit diffs (`git show 4f6e0c2`, `git show e2db633`, `git show 982cedb`) and found **fully consistent, no discrepancy**:

| Work item | Claimed diff-stat (`tasks.md`) | Independently measured `git diff --stat` (this session) | Match |
|---|---|---|---|
| PR13 base (`4f6e0c2`) | ~232 changed lines, 9 files | 232 insertions(+) / 13 deletions(-), 9 files | ✅ Exact |
| PR13 extension (`e2db633`) | ~87 changed lines, 4 files | 87 insertions(+) / 41 deletions(-), 4 files | ✅ Exact |
| PR14 (`982cedb`) | ~317 changed lines, 11 files | 317 insertions(+) / 40 deletions(-), 11 files | ✅ Exact |

Source-level spot checks performed this session (not just diff-stat counting):
- **`Reveal`/`Tilt` `className` passthrough** (`4f6e0c2`): confirmed both components gained an optional `className?: string` prop, applied to the wrapping element, backward-compatible (unused → `undefined` → no-op). The bento-span classes were confirmed moved from inner `<div>`s onto the `Reveal`/`Tilt` call sites directly — the actual root-cause fix, not a workaround.
- **`SkillBadge` bare-icon rewrite** (`e2db633`): confirmed the component collapsed from a `tone`-branching wrapper `<span>` (36px, bordered/filled) to a single-purpose `<LazyIcon icon={icon} className="h-6.5 w-6.5" />` with no wrapper — the `tone` prop was fully removed, and both call sites that previously passed `tone="inverted"` were updated in the same commit (confirmed via `skills-section.tsx`'s diff in the same commit).
- **`SiteHeader`/`ThemeToggle`/`LocaleSwitcher`/`SectionNav`/`ScrollProgress`** (`982cedb`): confirmed the new `site-header.tsx` file composes the existing `SectionNav`/`LocaleSwitcher`/`ThemeToggle` islands (no duplication), `page.tsx`'s diff shows the old inline `<header>` markup fully replaced by `<SiteHeader />` with the `SectionNav`/`LocaleSwitcher`/`ThemeToggle` imports removed from `page.tsx` (moved, not duplicated), and every accessibility-preservation claim (text-to-`aria-label` moves) verified both in the source diff and live in a browser (see Regression Guards above).

**TDD Compliance**: All work items in this scope have complete, diff-verified TDD evidence per `tasks.md`'s own RED/GREEN/TRIANGULATE/REFACTOR tables. No discrepancy found between claimed and actual diffs.

### Assertion Quality
No trivial/tautological assertions found in the spot-checked test files (`reveal.test.tsx`, `tilt.test.tsx`, `skills-section.test.tsx`, `skill-badge.test.tsx`, `site-header.test.tsx`). The bento-span regression test in particular is well-designed: it asserts span classes live on the grid's own direct `children` (not any inner div) *and* that the other five 1x1 cards do NOT carry span classes — directly engineered to avoid repeating the exact test-design mistake (asserting classes existed anywhere in the tree, regardless of whether the CSS actually applied) that let the original bug ship silently through PR1–PR12.

### Quality Metrics
**Linter**: PASSED, 0 errors
**Type Checker**: PASSED, 0 errors

## Spec Compliance Matrix (by capability, this session's re-verification)

| Capability | Requirements checked | Result |
|---|---|---|
| quality-pipeline (all gates) | lint/typecheck/coverage/build/no-client-secrets/lighthouse/e2e | ✅ COMPLIANT — all green, see Build & Tests Execution above |
| design-system: Theme Toggle | Persists selection, no flash on load | ✅ COMPLIANT — `theme-no-flash.spec.ts` (3/3) unaffected and re-passing; `ThemeToggle`'s persistence logic (`useTheme`) untouched by PR14, only its rendered markup changed |
| design-system: Scroll Progress Indicator | Reflects scroll position | ✅ COMPLIANT — `ScrollProgress`'s existing scroll listener untouched by PR14; only its render output (styling, `scaleX` vs. `width`) changed, unit-tested (3 new cases) |
| design-system: Motion Interactions Respect Reduced Motion | Disabled/reduced under `prefers-reduced-motion` | ✅ COMPLIANT — `ScrollProgress` gained a new reduced-motion hide (`return null`), unit-tested; `Reveal`/`Tilt`'s existing reduced-motion handling untouched by the `className` passthrough |
| home-page: In-Page Navigation | Smooth anchor navigation via nav menu | ✅ COMPLIANT — `SectionNav`'s underlying click-through/anchor behavior untouched by PR14 (only hover-underline styling added); `e2e/home-sections.spec.ts`'s anchor-nav case re-ran and passed unchanged |
| home-page: Responsive Layout | No horizontal overflow at 375/768/1440px | ✅ COMPLIANT — all four viewport e2e scenarios re-ran green, including the new `skills-bento.spec.ts` 375px case |
| home-page: Section Composition | Sections render in spec order | ✅ COMPLIANT — unaffected by header/skills-scoped changes; `e2e/home-sections.spec.ts` order assertion re-ran green |
| i18n: Locale Routing / Locale-Matched MDX Resolution / SEO Metadata Consistency | Routing, resolution, hreflang | ✅ COMPLIANT — unaffected by this session's diffs (no i18n routing/resolution code touched); all locale-routing and seo e2e specs re-ran green |
| i18n: Locale Persistence on Navigation | Preserves current page on locale switch | ✅ COMPLIANT (MUST clause) — `LocaleSwitcher`'s `router.replace(pathname, {locale})` call untouched by PR14, confirmed via source diff. The SHOULD-level "preserve scroll position" sub-clause remains untested (WARNING-3, carried forward, non-blocking — a SHOULD, not a MUST) |
| 11 other spec capabilities (blog, article-filter, persistence, contact, engagement, search, seo, security, github-activity, quality-pipeline sub-gates) | Unaffected by PR13/PR14's diffs | ✅ Not independently re-checked line-by-line this session (PR13/PR14's diffs touch only `home/ui` skills/header components + `shared/ui/motion` + `shared/i18n/ui/locale-switcher` + `shared/ui/theme` + `shared/ui/scroll-progress`); the full gate suite (lint/typecheck/481 tests/build/50 e2e) re-run this session covers these areas' regression risk indirectly and all passed |

**Note**: No spec `MUST` scenario in any of the 13 capabilities mandates specific pixel values for the bento grid spans, brand-block sizing, or theme-toggle diameter — those are `design.md`/design-reference fidelity concerns, not spec compliance gates. The bento-span bug (PR13's root cause) was a genuine implementation defect (dead CSS silently breaking a design intent), not a spec violation, since no spec scenario asserted the grid layout's actual rendered geometry before PR13 introduced `skills-bento.spec.ts`.

## Correctness (Static + Live Evidence, spot-checked this session)

| Requirement | Status | Notes |
|------------|--------|-------|
| Bento span fix locus | ✅ Implemented | `Reveal`/`Tilt` `className` passthrough + span classes moved to the actual grid children — confirmed via `git show 4f6e0c2` and the passing `e2e/skills-bento.spec.ts` bounding-box assertions |
| `SkillBadge` bare-icon simplification | ✅ Implemented | `tone` prop fully removed, both call sites updated in the same commit, `git grep tone= src/features/home` confirms no dangling references |
| `SiteHeader` extraction | ✅ Implemented | New file composes existing islands, `page.tsx` no longer imports `SectionNav`/`LocaleSwitcher`/`ThemeToggle` directly (moved, not duplicated) |
| Theme toggle / locale switcher accessible-name preservation | ✅ Confirmed | Live browser a11y snapshot matches claims exactly (see Regression Guards above) |
| Icon markup absent from initial SSR HTML | ✅ Confirmed | Live `curl` of `/es`, this session |
| Icon markup code-split chunk unchanged (28,307 bytes) | ✅ Confirmed | Byte-identical to the PR1–PR12 baseline |
| `package.json`/`package-lock.json` untouched across PR13/PR13-ext/PR14 | ✅ Confirmed | Empty diff, `73f4ec9`→`23576d4` |
| `app/robots.ts` | ❌ Not implemented (WARNING-2, carried, unchanged) | Confirmed via live request: `GET /robots.txt` → 404 this session; out of PR13/PR14's scope |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| `feature-branch-chain` delivery | ✅ Yes | `feat/pr14-header-fidelity` → `feat/pr13-skills-fidelity` (PR #18) → `feat/pr12-tech-logos` → … chain confirmed via `git log`; nothing merged to `main` — correct, not a defect |
| Skills-section-only scope constraint (PR13 + extension) | ✅ Yes | `git show --stat` for `4f6e0c2` and `e2db633` shows zero files touched outside `skills-section.tsx`/`skill-badge.tsx`/`reveal.tsx`/`tilt.tsx`/i18n messages/the new e2e spec — no projects-section or other-section files touched |
| Header-only scope constraint (PR14) | ✅ Yes | `git show --stat 982cedb` shows only `page.tsx` (header wiring only), `site-header.tsx` (new), `section-nav.tsx`, `locale-switcher.tsx`, `theme-toggle.tsx`, `scroll-progress.tsx`, and their test files — no other home section touched |
| ADR-0007 CSP (`style-src`/`script-src 'self'`) | ✅ Yes | Unaffected by PR13/PR14; re-confirmed live this session |
| Strict TDD (RED before GREEN) | ✅ Yes | Confirmed via diff-stat and source spot-checks against `tasks.md`'s TDD Cycle Evidence tables for PR13/PR13-extension/PR14 — no discrepancy |
| Disclosed deviations kept honest (heading highlight static; header sticky+blur kept; scroll-aware header swap not implemented; mobile burger deferred; salmon highlight static) | ✅ Yes | All disclosed in `tasks.md` and reflected accurately in the actual diffs — no silent shortcuts found |

## User-Accepted Deviations (confirmed present, not flagged as findings, per this session's assigned scope)

- Projects section intentionally differs from design-reference (user decision, Engram obs #62) — confirmed untouched by PR13/PR14's diffs.
- Header keeps sticky+backdrop-blur instead of the design's plain fixed; scroll-aware transparent→solid border not implemented (Lighthouse-budget protection, disclosed in `tasks.md` and in `site-header.tsx`'s own doc comment).
- Salmon heading highlight is static (no `scaleX` reveal animation), consistent with `article-header.tsx`'s existing pattern.
- Mobile burger menu deferred (documented since PR3b, re-confirmed unchanged this session).

## Issues Found

### CRITICAL
None.

### WARNING

**WARNING-2 (carried forward, unchanged, non-blocking): `app/robots.ts` was never shipped.** No owning task, no spec `MUST` scenario. Confirmed via a live `GET /robots.txt` → 404 this session.

**WARNING-3 (carried forward, unchanged, non-blocking): i18n's "SHOULD preserve scroll position" on locale switch remains untested at the e2e/behavioral level.** A SHOULD, not a MUST. Not touched by PR13/PR14.

### SUGGESTION

**SUGGESTION-1 (carried forward, unchanged): `src/shared/i18n/request.ts` still shows 0% direct coverage.** Pre-existing since PR2b, already justified; unaffected by this session's scope.

**SUGGESTION-2 (NEW, non-blocking, informational): a small residual fidelity gap disclosed by the PR13 extension itself was independently confirmed still open.** Card category labels (e.g. "Lenguaje", "Backend") keep `tracking-wide` (0.025em) rather than the design's `.12em`/`.14em`, and the section-eyebrow's `0.16em` tracking is applied to the skills section only (other sections' eyebrows still use `tracking-widest`). Both are explicitly disclosed in `tasks.md` as out-of-scope for this session (hard scope constraint: skills section only) — not a defect, flagged here only so a future full-page design-fidelity pass has a single consolidated pointer.

**SUGGESTION-3 (NEW, non-blocking, informational): Lighthouse Performance margin remains genuinely thin and noisy on `/es`/`/en` at the individual-sample level** (one `/en` sample this session measured 0.81, a single `/es` sample measured 0.88), though the median-of-3 gate LHCI actually asserts on held ≥ 0.90 in all 6 URL-runs across two full sessions. This is disclosed, pre-existing measurement noise (documented in `lighthouserc.js`'s own comments, not introduced by PR13/PR14 — both PRs add only static CSS/markup or reuse the already-shipped `LazyIcon` deferred-loading mechanism, with zero new above-the-fold payload). No action required before archive; flagged so a future session is not surprised by an occasional low single-run sample that is not indicative of the actual (median-gated) CI outcome.

**SUGGESTION-5 from the prior report is now closed.** The prior report's SUGGESTION-5 (a documentation-accuracy nit in `tasks.md`'s PR12-resolve-blockers changed-line estimate) was explicitly corrected by the PR13 entry in `tasks.md` (see its closing note); re-confirmed resolved this session.

## Verdict

**PASS — ready for `sdd-archive`.**

All gates re-run for real this session on `feat/pr14-header-fidelity` are green: lint (0 errors), typecheck (0 errors), 481/481 unit tests at 97.55%/93.66%/96.4%/97.5% coverage (at/above the PR1–PR12 baseline on every metric, all four ≥ 80% gate), a clean production build, zero leaked client-side secrets, Lighthouse CI passing with exit code 0 across two independent full runs on `/es`, `/en`, and the article page (all medians ≥ 0.90), and 50/50 e2e including the new `skills-bento.spec.ts` real-browser bounding-box assertions.

Every claim in `tasks.md`'s PR13/PR13-extension/PR14 sections was independently cross-checked against the actual commit diffs this session and found accurate — diff-stat line counts match exactly, the bento-span root-cause fix and its regression-test design were verified by source inspection, and every disclosed accessible-name-preservation claim for `ThemeToggle`/`LocaleSwitcher` was independently re-verified live in a real headless browser, not just trusted from the unit tests. The CRITICAL-2 regression guard (icon SVG deferred-rendering mechanism) was re-verified live and found byte-identical/unregressed. No hydration-mismatch console errors were observed on a fresh page load, addressing the specific PR7 hydration-mismatch precedent this scope was asked to re-check.

Zero CRITICAL issues found in this scope or carried from the prior report (CRITICAL-1 and CRITICAL-2 both remain fixed and unregressed). WARNING-2 (`robots.txt`) and WARNING-3 (i18n scroll position) remain known, disclosed, non-blocking residuals, carried forward unchanged. SUGGESTION-1 is carried forward unchanged; SUGGESTION-2 and SUGGESTION-3 are new, informational, non-blocking observations with no effect on archive readiness; the prior report's SUGGESTION-5 is now closed.

**No CRITICAL issues remain. This change is ready for `sdd-archive`.**
