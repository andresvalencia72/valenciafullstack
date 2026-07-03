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

CI MUST run Playwright e2e tests covering critical user flows (home render, article view, contact submission) on every pull request.

#### Scenario: E2E flow fails

- GIVEN a PR breaks the contact form submission flow
- WHEN the Playwright e2e suite runs in CI
- THEN the pipeline MUST report failure and block merge

### Requirement: Lighthouse Performance Budget

CI MUST run Lighthouse CI against key pages and MUST fail the build if performance scores regress below the configured budget.

#### Scenario: Performance regression

- GIVEN a PR increases page load beyond the configured Lighthouse budget
- WHEN Lighthouse CI runs
- THEN the pipeline MUST report failure

### Requirement: Coverage Threshold

CI MUST measure test coverage and MUST fail the build if coverage falls below 80%.

#### Scenario: Coverage below threshold

- GIVEN a PR drops overall coverage to 75%
- WHEN CI computes coverage
- THEN the pipeline MUST fail the build

### Requirement: Visible Status Badges

The repository README MUST display status badges reflecting the current state of the unit test, e2e, and Lighthouse CI jobs.

#### Scenario: Badge reflects pipeline state

- GIVEN the CI pipeline is passing on the default branch
- WHEN the README is viewed
- THEN badges MUST show passing status for each gate

### Requirement: Test-First Development

Feature code MUST be written following red-green-refactor: a failing test MUST exist before corresponding production code, except for pure scaffolding/configuration changes.
