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
│  │  ├─ privacy/page.tsx            # privacy disclosure page (contact spec)
│  │  ├─ blog/[slug]/
│  │  │  ├─ page.tsx                 # article detail (composes blog ui)
│  │  │  └─ opengraph-image.tsx      # per-article, per-locale OG image (next/og)
│  │  └─ rss.xml/route.ts            # per-locale RSS feed
│  ├─ api/
│  │  ├─ contact/route.ts
│  │  ├─ engagement/{views,reactions}/route.ts
│  │  ├─ engagement/[slug]/route.ts  # GET aggregate summary {views, reactions}, cached 60s
│  │  └─ search/route.ts
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
| `app/*` | feature `ui` + `application`; MAY import feature `infrastructure` solely to instantiate repositories and inject them into `application` (composition root) |
| cross-feature | only through `shared/*`; features never import each other |

### Patterns

| Pattern | Where | Rationale (1-line) |
|---------|-------|--------------------|
| Repository | `domain/*-repository.ts` iface, `infrastructure/drizzle-*.ts` impl | Keeps domain storage-agnostic; enables pglite tests |
| Adapter | `app/` routes, `content` MDX loader | Framework/format details isolated from use-cases |
| Use-case (interactor) | `application/*` | One class/function per business action, testable in isolation |
| Composition root | `app/*` route wiring | Single place (per route) that binds interfaces to Drizzle impls; `shared/db` only exports the Drizzle client and never imports features |
| Factory | `shared/db/client` | Lazy singleton Postgres pool per runtime |
| Value object | hashed visitor key, Locale | Encapsulates invariants (privacy dedupe, allowed locales) |

## Persistence

**Schema (Drizzle, `shared/db/schema.ts`):**

| Table | Key columns |
|-------|-------------|
| `contact_messages` | id, name, email, message, locale, created_at, ip_hash |
| `article_views` | id, slug, visitor_hash, created_at — UNIQUE(slug, visitor_hash) |
| `article_reactions` | id, slug, visitor_hash, kind, created_at — UNIQUE(slug, visitor_hash, kind); `kind` is a Postgres enum: `thumbs_up`, `heart`, `fire` |
| `article_search` | slug, locale, title, description, category, body_text, `search_vector tsvector` (GIN index, per-locale regconfig; weighted `title`=A, `body_text`=B, `description`=C), PK(slug, locale) |
| `rate_limits` | endpoint (text), key (text), window_start (timestamptz), count (int) — PRIMARY KEY(endpoint, key, window_start); `key` = `ip_hash` |

Dedupe = UNIQUE constraint + `onConflictDoNothing` (insert-if-absent, permanent — no dedupe window); view/reaction counts are aggregates over the rows present, not an incremented counter column. Rate-limit increments MUST be a single atomic upsert scoped per endpoint (`INSERT ... ON CONFLICT (endpoint, key, window_start) DO UPDATE SET count = count + 1 RETURNING count`); each endpoint tracks its own independent limit window (see `security` capability for concrete per-endpoint limits). `visitor_hash` and `ip_hash` are HMAC-SHA256 of their respective inputs keyed by the server-side secret `VISITOR_HASH_SECRET` (see `security` capability). Rotating `VISITOR_HASH_SECRET` resets dedupe and rate-limit identity continuity — all visitors are treated as new (view/reaction dedupe restarts, rate-limit windows reset for every client). This is an accepted operational tradeoff, not a bug. Repository interfaces live in each feature `domain`; Drizzle implementations in `infrastructure`. **Migration workflow**: `drizzle-kit generate` → SQL in `drizzle/` → `drizzle-kit migrate` in CI/deploy. Local dev via `docker-compose` Postgres; prod on Neon/Supabase-class (connection string in env). **Env validation**: `shared/config/env.ts` parses `process.env` with Zod lazily on first import, at server runtime boot — not at `next build` time; `next build` MUST NOT require `DATABASE_URL` to be set, and build-time code (e.g. `next.config`, static generation helpers) MUST NOT import `env.ts` at module scope, only from within runtime request/handler code paths. Fail-fast only on missing `DATABASE_URL` and `VISITOR_HASH_SECRET`. `RESEND_API_KEY` and `GITHUB_TOKEN` are optional in the Zod schema — each feature checks their presence at runtime and degrades gracefully (`contact` persists the message and returns 202 "received, delivery delayed" when `RESEND_API_KEY` is absent or email fails; 503 is reserved for persistence failure only; `github-activity` renders its fallback state when `GITHUB_TOKEN` is absent).

## Content & Search Sync

MDX stored as `content/blog/{slug}/{locale}.mdx` (folder-per-article groups locales, keeps assets colocated). Frontmatter (`title` string, `description` string, `date` ISO date, `category` single string — drives filter pills, `tags` string array optional — article page pills, `cover` optional) validated by a shared Zod schema at load. **Sync decision: build-time script** (`scripts/sync-search.ts`) parses MDX, strips markup to `body_text`, and performs a full reconcile against `content/`: upserts `article_search` (incl. the `category` column) + refreshes `search_vector` (using the locale's regconfig, `'spanish'`/`'english'`, weighted: `title` A, `body_text` B, `description` C) for every current (slug, locale), and prunes rows whose (slug, locale) no longer exists — deterministic, no runtime write path, runs in CI before deploy. Search query uses `websearch_to_tsquery` (never raw `to_tsquery`, to avoid syntax errors on arbitrary input) + `ts_rank` via Drizzle `sql`, filtered by the requested locale.

## i18n

**next-intl** (chosen): first-class App Router + RSC support, message catalogs, locale-aware routing/metadata. Routing under `app/[locale]/`, pinned `localePrefix: "always"` — every route, including the default (`es`), is served under an explicit locale prefix; `/` and unprefixed paths (e.g. `/blog/*`) 308-redirect to their `es`-prefixed equivalent. `/rss.xml` is explicitly included in this redirect map (308 to `/es/rss.xml`), since feed readers commonly probe the unprefixed path. Excluded from the redirect entirely (served directly, no locale prefixing): `/api/*`, `/sitemap.xml`, `/robots.txt`, and static asset files — precisely defined as `/_next/*`, `/favicon.ico`, and files served from `public/`. Accept-Language negotiation is disabled — the redirect target is always deterministic (`es`).

## Design System

Tokens as CSS variables in `shared/ui/tokens.css`, mapped into Tailwind theme.

| Token | Light | Dark |
|-------|-------|------|
| bg | #D9D7D1 | #161310 |
| card | #F5F4F0 | #231F19 |
| ink | #16130F | #EFEBE3 |
| coral | #FF5A2C | #FF6A3D |
| salmon | #F3C7B8 | rgba(255,120,80,.24) |

**Spacing scale tokens**: `space-xs`, `space-sm`, `space-md`, `space-lg`, `space-xl`, `space-2xl` (relative scale; exact values derived from `design-reference/`, not pixel-pinned here). **Typography scale tokens**: `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-h4`, `text-body`, `text-small`, `text-caption` (font-size/line-height pairs), plus `font-weight-regular` / `font-weight-medium` / `font-weight-bold`.

Fonts Clash Display (display) + General Sans (body), self-hosted via `next/font/local` using font files downloaded from Fontshare (no remote `@font-face`/CDN fetch), `display: swap`. **Theme toggle**: localStorage + inline blocking `<script>` in `<head>` sets `data-theme` before paint (no-flash). **Motion decision: CSS + Framer Motion** for reveal/tilt/magnetic — SSR-safe, no `window`-at-import issues, respects App Router streaming; GSAP/ScrollTrigger rejected (heavier, DOM-imperative, harder in RSC). `prefers-reduced-motion` honored.

## API Surface

**Decision: Route Handlers** (`app/api/*`) for contact/views/reactions/engagement-summary/search — explicit HTTP contracts, easier Zod validation, header/rate-limit control, testable independent of forms; server actions rejected for public mutation endpoints needing rate limiting and OG/webhook parity. Each handler: Zod-parse body → use-case → typed JSON. **Rate limiting: Postgres fixed-window counter, scoped per endpoint** in the `rate_limits` table (endpoint, key = `ip_hash`, `window_start`, `count`; PRIMARY KEY(endpoint, key, window_start)), incremented via a single atomic upsert (`INSERT ... ON CONFLICT (endpoint, key, window_start) DO UPDATE SET count = count + 1 RETURNING count`) — single DB already present, serverless-safe, no extra infra; Redis/Upstash rejected to avoid a second datastore. Concrete per-endpoint limits are the `security` capability's responsibility (single source of truth). **Client IP resolution is platform-conditional, not an unconditional "first XFF entry" rule**: in production, behind a platform-managed proxy that sanitizes headers (e.g. Vercel), `ip_hash` is derived from the platform-provided `x-forwarded-for` header's first entry. On append-style proxies in general, the first `x-forwarded-for` entry is client-controlled and MUST NOT be trusted; the platform-managed case is the exception because the platform itself sanitizes/overwrites that header before the request reaches the app. When the header is absent (local dev, CI e2e running against `next start`), the socket/connection remote address is used instead, as the trusted off-platform source. Orchestration logic (e.g. contact's rate-limit → honeypot → validation check order) MUST live in the feature's `application` use-case, not the thin `app/api/*` handler, keeping it inside the coverage-gated `src/**` tree. **Security headers** via `next.config` + middleware: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors none. **CSP strategy (ADR-0007)**: `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`, plus `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'` — this full policy ships from PR1 (task 1.8); no hash/nonce allowlist and no further tightening is planned (see Resolved Decisions). Contact adds honeypot field. **Cache/rate-limit interaction**: the engagement summary `GET /api/engagement/[slug]` endpoint sets `Cache-Control: public, s-maxage=60` on 200 responses only (never on 4xx/5xx); rate limiting is evaluated at the origin, so a CDN/edge cache hit never reaches the origin and does not consume that client's rate-limit budget — an accepted tradeoff (see `engagement` capability).

## SEO

`app/[locale]/blog/[slug]/opengraph-image.tsx` renders per-article, per-locale OG via `next/og` (ImageResponse) — locale-aware Next.js convention route, not a bespoke `[slug]` handler; a fallback URL (locale missing a translation) serves the OG image of the content locale. `app/[locale]/rss.xml/route.ts` builds one feed per locale from that locale's MDX index only (no fallback entries), channel language set per feed. `app/sitemap.ts` emits bilingual entries with `alternates.languages` (hreflang, incl. `x-default` pointing to `es` when both locales exist, or to the sole content-bearing locale's URL when only one locale exists — see `seo` capability); `generateMetadata` per route sets canonical + hreflang.

## GitHub Activity (last slice)

`github-activity` feature: `infrastructure` client hits GitHub REST/GraphQL with `GITHUB_TOKEN` (optional env var); page uses ISR (`revalidate: 3600`). **Graceful degradation**: on API error/timeout, or when `GITHUB_TOKEN` is absent, the use-case returns a cached/empty result and `ui` renders a fallback panel — never blocks page render.

## Testing Strategy (strict TDD, coverage ≥ 80%)

**Stack: Vitest + Testing Library + Playwright** — Vitest aligns with Vite/ESM speed and TS, Playwright for real browser e2e.

| Layer | What | Approach |
|-------|------|----------|
| Unit | use-cases, Zod schemas, value objects, dedupe/hash, rate-limit logic | Pure functions, in-memory repo fakes |
| Integration | Drizzle repositories, search queries, migrations | **pglite** (in-process Postgres) — fast, no Docker in CI; testcontainers rejected as heavier for this scale. This "no Docker in CI" rationale is scoped to unit/integration tests only — e2e uses a real Postgres service container instead (see E2E environment strategy) |
| E2E | home scroller, locale switch, theme toggle, contact submit, filter pills | Playwright against `next build` |

**pglite escape hatch**: during PR5b, verify that pglite supports the `spanish`/`english` regconfig and `websearch_to_tsquery` with parity to real Postgres; if parity fails, fall back to testcontainers for the search integration tests only (documented trigger, not a default).

CI (GitHub Actions) runs unit+integration, Playwright, Lighthouse budget; coverage gate 80%.

**E2E environment strategy**: Playwright runs against `next build` with an env-switched fake email sender in CI (no real Resend calls) and a per-run Postgres reset/seed (fresh schema + fixture rows) so engagement dedupe assertions (permanent, insert-if-absent) are deterministic across runs. Unlike unit/integration tests, e2e jobs run against a real GitHub Actions Postgres **service container** (not pglite) — `DATABASE_URL` points at the service container; migrations and `sync-search` both run in the seed step before Playwright starts.

## Deployment

**Target: Vercel-class.** Env matrix:

| Var | dev | prod | secret |
|-----|-----|------|--------|
| DATABASE_URL | docker pg | Neon/Supabase | yes (required, fail-fast) |
| VISITOR_HASH_SECRET | random dev value | generated secret | yes (required, fail-fast) |
| RESEND_API_KEY | test key | live | yes (optional — degrades gracefully if unset) |
| GITHUB_TOKEN | PAT | PAT | yes (optional — degrades gracefully if unset) |
| NEXT_PUBLIC_SITE_URL | localhost | domain | no |

Pipeline order: migrate → sync-search → deploy promote (migrations and the `sync-search` script both run in the deploy step, before promote).

## ADRs (docs/adr/)

| ADR | Decision | Rejected |
|-----|----------|----------|
| 0001 Hybrid MDX+Postgres | Content in MDX, dynamic data in PG | All-DB CMS; all-static |
| 0002 Drizzle over Prisma | Lightweight, SQL-first, typed, edge-friendly | Prisma (engine weight, migration model) |
| 0003 Rate limiting | Postgres fixed-window by ip_hash | Redis/Upstash (extra infra) |
| 0004 Motion library | Framer Motion + CSS | GSAP/ScrollTrigger (SSR/RSC friction) |
| 0005 i18n library | next-intl | next-i18next, custom (RSC support) |
| 0006 Repo tests | pglite (fallback to testcontainers if FTS regconfig parity fails, see Testing Strategy) | testcontainers, mocks-only |
| 0007 CSP script-src strategy | `'unsafe-inline'` for `script-src` and `style-src`, no hash/nonce | sha256 hash allowlist (unimplementable on App Router — dynamic inline RSC scripts can't be pre-hashed); nonce-based CSP (forces dynamic rendering per request, breaks static/ISR) |

## Migration / Rollout

No data migration (greenfield). Each capability ships as its own slice/PR; scaffolding + test runner first (strict TDD gate). Revert offending PR to roll back; contact route can be disabled independently (form degrades gracefully).

## Open Questions

- [ ] Email provider final choice (Resend assumed) — confirm account availability.

## Resolved Decisions

- **Reaction taxonomy**: confirmed fixed enum of exactly three values — `thumbs_up` (👍), `heart` (❤️), `fire` (🔥). No configurable/open set. See `article_reactions.kind` and the `engagement` spec's Reactions with Dedupe / Endpoint Validation requirements.
- **CSP script-src strategy (ADR-0007)**: canonical policy is `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`, plus `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`. Hash-only `script-src` is unimplementable on App Router because the framework emits dynamic inline RSC scripts that cannot be pre-hashed; nonce-based CSP was rejected because it forces dynamic rendering on every request, which would kill the static/ISR rendering strategy. Accepted tradeoff: the site renders no user-generated HTML and all inputs are Zod-validated, so `'unsafe-inline'` script/style risk is bounded rather than eliminated by allowlisting. Compensating controls: the remaining hardened headers (HSTS, X-Content-Type-Options, frame-ancestors none, object-src none, base-uri self) and the absence of any third-party script sources. This full policy ships from PR1 (task 1.8); PR11 (task 11.1) only verifies the header set and Lighthouse — no further CSP tightening is planned.
