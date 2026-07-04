# Quality Pipeline Specification

## Purpose

Visible CI pipeline enforcing unit tests, e2e tests, and a performance budget, with strict TDD applied throughout implementation.

## Requirements

### Requirement: Unit Test Gate

CI MUST run the full unit test suite on every pull request and MUST fail the build on any test failure.

#### Scenario: Unit tests fail

- GIVEN a PR introduces a failing unit test
- WHEN CI runs
- THEN the pipeline MUST report failure and block merge

### Requirement: End-to-End Test Gate

CI MUST run Playwright e2e tests on every pull request, covering the critical user flows implemented to date; the covered flow list MUST grow with each slice and MUST reach the full set (locale switch, theme, filter, search, contact, article view, engagement, github activity) by the final implementation slice.

#### Scenario: E2E flow fails

- GIVEN a PR breaks the contact form submission flow
- WHEN the Playwright e2e suite runs in CI
- THEN the pipeline MUST report failure and block merge

### Requirement: Lighthouse Performance Budget

CI MUST run Lighthouse CI (mobile preset) against key pages and MUST fail the build if any category score falls below its configured minimum: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. The Lighthouse budget gate is wired and enforced starting PR11 (Hardening, task 11.3); prior PRs run Lighthouse CI as a non-blocking stub (task 1.6).

#### Scenario: Performance regression

- GIVEN a PR drops the Performance score below 90 (or any other category below its minimum)
- WHEN Lighthouse CI runs
- THEN the pipeline MUST report failure

### Requirement: Coverage Threshold

CI MUST measure test coverage (lines + branches) globally over `src/**` and `scripts/**` (feature code, shared code, and build/sync scripts), excluding `app/` route adapters, config files, generated code, and the declarative/IO-bootstrap files `shared/db/schema.ts` (Drizzle schema declarations) and `shared/db/client.ts` (DB client bootstrap) — and MUST fail the build if coverage falls below 80%. The gate mechanism is deterministic: it is always configured and enforced, and it automatically passes (skips enforcement) whenever zero coverage-eligible files exist under the configured `src/**`/`scripts/**` scope — which is the case for PR1 (scaffolding), before any eligible files exist. Task 1.6 is the single owner of the coverage gate configuration; no manual flip and no separate PR2 task are needed to activate it.

#### Scenario: Coverage below threshold

- GIVEN a PR drops overall coverage to 75%
- WHEN CI computes coverage
- THEN the pipeline MUST fail the build

### Requirement: Visible Status Badges

The repository README MUST display status badges reflecting the current state of the unit test, e2e, and Lighthouse CI jobs. Badge placeholders are added in PR1 (task 1.7) and are updated to reflect real, enforced gate status once PR11 (task 11.3) wires the coverage/Lighthouse gates.

#### Scenario: Badge reflects pipeline state

- GIVEN the CI pipeline is passing on the default branch
- WHEN the README is viewed
- THEN badges MUST show passing status for each gate

### Requirement: Test-First Development

Feature code MUST be written following red-green-refactor: a failing test MUST exist before corresponding production code, except for pure scaffolding/configuration changes.
