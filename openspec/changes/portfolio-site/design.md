# Design: Portfolio Site for Andrés Valencia

## Technical Approach

Greenfield Next.js (latest, App Router) + TypeScript + Tailwind, organized as **screaming architecture**: top-level folders name business features, not framework artifacts. Each feature carries clean-architecture layers (`domain / application / infrastructure / ui`). `app/` routes are thin adapters that compose feature `ui` and invoke feature `application` use-cases. Dynamic data lives in Postgres via Drizzle behind repository interfaces; article bodies stay in versioned MDX. Zod validates every boundary (env, HTTP, frontmatter). Strict TDD: the test runner lands in scaffolding before any feature code.

This realizes the proposal's hybrid content strategy and layered, recruiter-facing quality goals.

## Folder Tree

```
portfolio/
├─ app/                              # App Router — thin adapters only
│  ├─ [locale]/
│  │  ├─ layout.tsx                  # locale provider + theme + fonts
│  │  ├─ page.tsx                    # home scroller (composes home ui)
│  │  └─ blog/[slug]/page.tsx        # article detail (composes blog ui)
│  ├─ api/
│  │  ├─ contact/route.ts
│  │  └─ engagement/{views,reactions}/route.ts
│  ├─ og/[slug]/route.tsx            # next/og image
│  ├─ rss.xml/route.ts
│  ├─ sitemap.ts
│  └─ robots.ts
├─ src/
│  ├─ features/
│  │  ├─ home/{domain,application,ui}
│  │  ├─ blog/{domain,application,infrastructure,ui}
│  │  ├─ search/{domain,application,infrastructure,ui}
│  │  ├─ contact/{domain,application,infrastructure,ui}
│  │  ├─ engagement/{domain,application,infrastructure,ui}
│  │  └─ github-activity/{domain,application,infrastructure,ui}
│  └─ shared/
│     ├─ db/            # Drizzle client, schema, migrations
│     ├─ config/        # env.ts (Zod-validated)
│     ├─ i18n/          # next-intl config, messages
│     ├─ ui/            # design-system primitives, tokens, theme
│     └─ content/       # MDX loader, frontmatter Zod schema
├─ content/blog/{slug}/{es,en}.mdx
├─ docs/adr/            # ADR-0001..N
└─ drizzle/             # generated SQL migrations
```

### Boundary Rules (enforced by ESLint `no-restricted-imports` + boundaries plugin)

| Layer | May import |
|-------|-----------|
| `domain` | nothing (pure types, interfaces, entities, Zod domain schemas) |
| `application` | own `domain` only (use-cases depend on repo interfaces) |
| `infrastructure` | own `domain` + `shared/db` (Drizzle impls of domain interfaces) |
| `ui` | own `domain`/`application` types + `shared/ui`; never `infrastructure` |
| `app/*` | feature `ui` + `application`; wires infrastructure via composition root |
| cross-feature | only through `shared/*`; features never import each other |

### Patterns

| Pattern | Where | Rationale (1-line) |
|---------|-------|--------------------|
| Repository | `domain/*-repository.ts` iface, `infrastructure/drizzle-*.ts` impl | Keeps domain storage-agnostic; enables pglite tests |
| Adapter | `app/` routes, `content` MDX loader | Framework/format details isolated from use-cases |
| Use-case (interactor) | `application/*` | One class/function per business action, testable in isolation |
| Composition root | `shared/db` + route wiring | Single place that binds interfaces to Drizzle impls |
| Factory | `shared/db/client` | Lazy singleton Postgres pool per runtime |
| Value object | hashed visitor key, Locale | Encapsulates invariants (privacy dedupe, allowed locales) |

## Persistence

**Schema (Drizzle, `shared/db/schema.ts`):**

| Table | Key columns |
|-------|-------------|
| `contact_messages` | id, name, email, message, locale, created_at, ip_hash |
| `article_views` | id, slug, visitor_hash, created_at — UNIQUE(slug, visitor_hash) |
| `article_reactions` | id, slug, visitor_hash, kind, created_at — UNIQUE(slug, visitor_hash, kind); `kind` is a Postgres enum: `thumbs_up`, `heart`, `fire` |
| `article_search` | slug, locale, title, summary, body_text, `search_vector tsvector` (GIN index), PK(slug, locale) |

Dedupe = UNIQUE constraint + `onConflictDoNothing`; views/reactions increment atomically. Repository interfaces live in each feature `domain`; Drizzle implementations in `infrastructure`. **Migration workflow**: `drizzle-kit generate` → SQL in `drizzle/` → `drizzle-kit migrate` in CI/deploy. Local dev via `docker-compose` Postgres; prod on Neon/Supabase-class (connection string in env). **Env validation**: `shared/config/env.ts` parses `process.env` with Zod at boot; fail-fast on missing `DATABASE_URL`, `RESEND_API_KEY`, `GITHUB_TOKEN`.

## Content & Search Sync

MDX stored as `content/blog/{slug}/{locale}.mdx` (folder-per-article groups locales, keeps assets colocated). Frontmatter (title, summary, tags, publishedAt, cover) validated by a shared Zod schema at load. **Sync decision: build-time script** (`scripts/sync-search.ts`) parses MDX, strips markup to `body_text`, upserts `article_search` and refreshes `search_vector` — deterministic, no runtime write path, runs in CI before deploy. Search query uses `to_tsquery` + `ts_rank` via Drizzle `sql`.

## i18n

**next-intl** (chosen): first-class App Router + RSC support, message catalogs, locale-aware routing/metadata. Routing under `app/[locale]/`, `es` default, middleware handles locale negotiation and prefix.

## Design System

Tokens as CSS variables in `shared/ui/tokens.css`, mapped into Tailwind theme.

| Token | Light | Dark |
|-------|-------|------|
| bg | #D9D7D1 | #161310 |
| card | #F5F4F0 | #231F19 |
| ink | #16130F | #EFEBE3 |
| coral | #FF5A2C | #FF6A3D |
| salmon | #F3C7B8 | (shared) |

Fonts Clash Display (display) + General Sans (body) via Fontshare `@font-face`, `next/font/local`, `display: swap`. **Theme toggle**: localStorage + inline blocking `<script>` in `<head>` sets `data-theme` before paint (no-flash). **Motion decision: CSS + Framer Motion** for reveal/tilt/magnetic — SSR-safe, no `window`-at-import issues, respects App Router streaming; GSAP/ScrollTrigger rejected (heavier, DOM-imperative, harder in RSC). `prefers-reduced-motion` honored.

## API Surface

**Decision: Route Handlers** (`app/api/*`) for contact/views/reactions/search — explicit HTTP contracts, easier Zod validation, header/rate-limit control, testable independent of forms; server actions rejected for public mutation endpoints needing rate limiting and OG/webhook parity. Each handler: Zod-parse body → use-case → typed JSON. **Rate limiting: Postgres fixed-window counter** keyed by `ip_hash` (single DB already present, serverless-safe, no extra infra); Redis/Upstash rejected to avoid a second datastore. **Security headers** via `next.config` + middleware: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors none. Contact adds honeypot field.

## SEO

`app/og/[slug]/route.tsx` renders per-article OG via `next/og` (ImageResponse). `app/rss.xml/route.ts` builds feed from MDX index. `app/sitemap.ts` emits bilingual entries with `alternates.languages` (hreflang); `generateMetadata` per route sets canonical + hreflang.

## GitHub Activity (last slice)

`github-activity` feature: `infrastructure` client hits GitHub REST/GraphQL with `GITHUB_TOKEN`; page uses ISR (`revalidate: 3600`). **Graceful degradation**: on API error/timeout the use-case returns a cached/empty result and `ui` renders a fallback panel — never blocks page render.

## Testing Strategy (strict TDD, coverage ≥ 80%)

**Stack: Vitest + Testing Library + Playwright** — Vitest aligns with Vite/ESM speed and TS, Playwright for real browser e2e.

| Layer | What | Approach |
|-------|------|----------|
| Unit | use-cases, Zod schemas, value objects, dedupe/hash, rate-limit logic | Pure functions, in-memory repo fakes |
| Integration | Drizzle repositories, search queries, migrations | **pglite** (in-process Postgres) — fast, no Docker in CI; testcontainers rejected as heavier for this scale |
| E2E | home scroller, locale switch, theme toggle, contact submit, filter pills | Playwright against `next build` |

CI (GitHub Actions) runs unit+integration, Playwright, Lighthouse budget; coverage gate 80%.

## Deployment

**Target: Vercel-class.** Env matrix:

| Var | dev | prod | secret |
|-----|-----|------|--------|
| DATABASE_URL | docker pg | Neon/Supabase | yes |
| RESEND_API_KEY | test key | live | yes |
| GITHUB_TOKEN | PAT | PAT | yes |
| NEXT_PUBLIC_SITE_URL | localhost | domain | no |

Migrations run in deploy step before promote.

## ADRs (docs/adr/)

| ADR | Decision | Rejected |
|-----|----------|----------|
| 0001 Hybrid MDX+Postgres | Content in MDX, dynamic data in PG | All-DB CMS; all-static |
| 0002 Drizzle over Prisma | Lightweight, SQL-first, typed, edge-friendly | Prisma (engine weight, migration model) |
| 0003 Rate limiting | Postgres fixed-window by ip_hash | Redis/Upstash (extra infra) |
| 0004 Motion library | Framer Motion + CSS | GSAP/ScrollTrigger (SSR/RSC friction) |
| 0005 i18n library | next-intl | next-i18next, custom (RSC support) |
| 0006 Repo tests | pglite | testcontainers, mocks-only |

## Migration / Rollout

No data migration (greenfield). Each capability ships as its own slice/PR; scaffolding + test runner first (strict TDD gate). Revert offending PR to roll back; contact route can be disabled independently (form degrades gracefully).

## Open Questions

- [ ] Email provider final choice (Resend assumed) — confirm account availability.

## Resolved Decisions

- **Reaction taxonomy**: confirmed fixed enum of exactly three values — `thumbs_up` (👍), `heart` (❤️), `fire` (🔥). No configurable/open set. See `article_reactions.kind` and the `engagement` spec's Reactions with Dedupe / Endpoint Validation requirements.
