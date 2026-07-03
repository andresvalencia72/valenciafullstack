# Design System Specification

## Purpose

Visual tokens, theming, typography, and motion interactions derived from `design-reference/`, shared across all pages.

## Requirements

### Requirement: Token Derivation

Design tokens (colors, spacing, typography) for light and dark themes MUST be derived from `design-reference/` and MUST NOT be redefined ad hoc per component.

#### Scenario: Token usage

- GIVEN a component needs a primary color
- WHEN it is implemented
- THEN it MUST reference the shared design token, not a hardcoded hex value

### Requirement: Theme Toggle

The system MUST provide a light/dark theme toggle, persist the visitor's selection in `localStorage`, and apply the stored theme on load without a visible flash of incorrect theme.

#### Scenario: Theme persists across reload

- GIVEN a visitor selects dark theme
- WHEN they reload the page
- THEN the page MUST render in dark theme immediately, without a flash of light theme

### Requirement: Scroll Progress Indicator

The system MUST display a scroll progress indicator reflecting the visitor's scroll position on the home page.

#### Scenario: Progress updates on scroll

- GIVEN a visitor scrolls to 50% of the page height
- WHEN the indicator is inspected
- THEN it MUST reflect approximately 50% progress

### Requirement: Motion Interactions Respect Reduced Motion

Reveal, tilt, and magnetic motion interactions MUST be implemented, and MUST be disabled or reduced when the visitor's OS/browser signals `prefers-reduced-motion: reduce`.

#### Scenario: Reduced motion preference honored

- GIVEN a visitor's browser reports `prefers-reduced-motion: reduce`
- WHEN the page renders
- THEN tilt/magnetic/reveal animations MUST be disabled or replaced with a non-animated equivalent
