# ADR-0005: i18n library

**Status**: Accepted (finalized in PR11, task 11.5)

## Decision

Use `next-intl` for locale routing, message catalogs, and locale-aware metadata —
first-class App Router + RSC support.

## Rejected alternatives

- `next-i18next`, custom solutions: weaker or absent RSC support.

## Consequences

Held through implementation with one framework-version gotcha found and worked around
(PR2b): the pinned `next-intl@4.13.1`'s middleware emits an unstyled `307` redirect (Next.js's
own `NextResponse.redirect` default when no status is given), but the `i18n` spec requires a
permanent `308` for the unprefixed-to-`es` redirect — `proxy.ts` wraps next-intl's middleware
output and upgrades any `307` to `308` via a small unit-tested pure function
(`shared/i18n/middleware-rules.ts#upgradeRedirectStatus`) rather than forking or patching the
library. RSC support held up as expected: locale-aware `generateMetadata`, server-side
`useTranslations` in Server Components (no `"use client"` needed for static i18n text), and the
locale switcher's article-slug-preserving navigation (PR4, task 4.6) all worked without
next-intl-specific friction.

See `design.md` (i18n) for the full write-up.
