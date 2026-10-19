# valenciafullstack

Bilingual (ES/EN) portfolio and blog, built as a recruiter-facing proof of engineering quality.

> **Status: specification complete, implementation not started.**
> This repository currently contains the specification, architecture decisions and design reference. Application code lands phase by phase (see [Roadmap](#roadmap)).

## Why this repository exists

The portfolio is the product, and *how* it is built is part of the product: readable architecture, visible tests, documented decisions and security treated as scope rather than as an afterthought.

To keep those goals honest, the specification was written and reviewed **before** any code. Every capability has acceptance criteria in Given/When/Then form, and the implementation is split into reviewable slices.

## What is in here

| Path | Content |
| --- | --- |
| `openspec/changes/portfolio-site/proposal.md` | Scope, capabilities, approach, risks and rollback plan |
| `openspec/changes/portfolio-site/specs/` | 13 capability specs (home, blog, search, contact, SEO, i18n, security, ...) |
| `openspec/changes/portfolio-site/design.md` | Architecture and ADR-style decisions |
| `openspec/changes/portfolio-site/tasks.md` | 11 phases, one PR slice per phase |
| `design-reference/` | Exported design (layout, light and dark themes) |

## Stack (planned)

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Data:** Postgres + Drizzle ORM, validated with Zod at every boundary
- **Content:** MDX articles, two files per article (one per locale)
- **i18n:** ES/EN routing from day one
- **Testing:** Vitest + Testing Library, Playwright for end-to-end
- **CI:** GitHub Actions (lint, tests, e2e, Lighthouse budget)

## Architecture (planned)

Screaming architecture: top-level folders by feature (`blog`, `contact`, `engagement`, `home`, ...), with clean layering inside each feature (`domain`, `application`, `infrastructure`, `ui`).

The domain layer never imports Drizzle: persistence is accessed through repository interfaces, so storage stays replaceable and testable.

## Roadmap

| Phase | Slice |
| --- | --- |
| 1 | Scaffolding, test runner and CI |
| 2 | Design system and i18n |
| 3 | Home sections |
| 4 | Blog |
| 5 | Persistence, schema and migrations |
| 6 | Contact form |
| 7 | Engagement (views and reactions) |
| 8 | Full-text search |
| 9 | SEO (OG images, RSS, sitemap) |
| 10 | GitHub activity feed |
| 11 | Hardening and verification |

## Current status

| Area | Status |
| --- | --- |
| Specification | Done |
| Design reference | Done |
| Application code | Not started |
| Public demo | Pending implementation |

The specification is the source of truth for scope: see `openspec/changes/portfolio-site/` before proposing changes.
