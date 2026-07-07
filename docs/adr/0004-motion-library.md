# ADR-0004: Motion library

**Status**: Accepted (finalized in PR11, task 11.5)

## Decision

Use CSS + Framer Motion for reveal/tilt/magnetic motion interactions — SSR-safe, no
`window`-at-import issues, respects App Router streaming; `prefers-reduced-motion` honored.

## Rejected alternatives

- GSAP/ScrollTrigger: heavier, DOM-imperative, more friction under RSC/streaming.

## Consequences

Held through implementation, with one real regression found and fixed during PR11 hardening's
Lighthouse pass: `Reveal` (`whileInView`, initial `opacity: 0` until an IntersectionObserver
fires post-hydration) was originally applied to the hero section (PR3a) — content that is
already in the viewport on page load, with nothing to "scroll into." That made the hero's LCP
text element wait on client JS hydration to become visible at all, measured at ~3.4s of pure
Largest Contentful Paint "Render Delay" (88% of the metric), enough on its own to fail the
Performance >= 90 budget. Fixed by removing `Reveal` from the hero specifically (PR11, task
11.3) — `Tilt`/`Magnetic` (transform-only, never opacity-gated) were unaffected and stayed.
General rule going forward: `Reveal` belongs on content the visitor has to scroll to reach
(about/skills/projects/articles/contact — all correctly use it), never on anything painted in
the initial viewport.

See `design.md` (Design System) for the full write-up.
