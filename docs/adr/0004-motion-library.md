# ADR-0004: Motion library

**Status**: Draft (stub — full rationale lands in PR11, task 11.5)

## Decision

Use CSS + Framer Motion for reveal/tilt/magnetic motion interactions — SSR-safe, no
`window`-at-import issues, respects App Router streaming; `prefers-reduced-motion` honored.

## Rejected alternatives

- GSAP/ScrollTrigger: heavier, DOM-imperative, more friction under RSC/streaming.

See `design.md` (Design System) for the full write-up.
