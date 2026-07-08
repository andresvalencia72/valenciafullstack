# Portfolio — Andrés Valencia

<!-- Badges: live GitHub Actions job status, wired up in PR11 (task 11.3) once the
     coverage and Lighthouse gates became real and enforced. Each badge targets a
     specific job within .github/workflows/ci.yml via shields.io's `job` query
     parameter, so a failure in any one gate shows red independently of the others
     — badges only turn green once that job passes on `main`. -->

[![Unit tests + coverage](https://img.shields.io/github/actions/workflow/status/andresvalencia72/valenciafullstack/ci.yml?branch=main&job=Lint%2C%20typecheck%2C%20unit%20tests%2C%20coverage&label=unit%20tests%20%2B%20coverage)](https://github.com/andresvalencia72/valenciafullstack/actions/workflows/ci.yml)
[![E2E](https://img.shields.io/github/actions/workflow/status/andresvalencia72/valenciafullstack/ci.yml?branch=main&job=Playwright%20e2e&label=e2e)](https://github.com/andresvalencia72/valenciafullstack/actions/workflows/ci.yml)
[![Lighthouse](https://img.shields.io/github/actions/workflow/status/andresvalencia72/valenciafullstack/ci.yml?branch=main&job=Lighthouse%20CI&label=lighthouse)](https://github.com/andresvalencia72/valenciafullstack/actions/workflows/ci.yml)

Personal, bilingual (es/en) portfolio and blog for Andrés Valencia. Beyond its primary
purpose — presenting projects and articles to recruiters — the codebase itself is a
deliberate showcase of engineering practice: screaming/clean architecture, explicit
design patterns, strict TDD, and a visible CI quality pipeline.

## Stack

- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Content**: MDX articles (`content/blog/{slug}/{es,en}.mdx`)
- **Persistence**: Postgres + Drizzle ORM, behind repository interfaces (contact
  messages, article views/reactions, full-text search, rate limiting)
- **Validation**: Zod at every boundary (env, HTTP, MDX frontmatter)
- **Testing**: Vitest + Testing Library (unit/integration), Playwright (e2e),
  80% line+branch coverage gate over `src/**` and `scripts/**`
- **i18n**: next-intl (`es` default, `en` secondary)

## Architecture

The codebase follows **screaming architecture**: top-level `src/features/*` folders
name business capabilities (home, blog, search, contact, engagement, github-activity),
not framework artifacts. Each feature carries clean-architecture layers
(`domain / application / infrastructure / ui`). `app/*` routes are thin adapters that
compose feature `ui` and invoke feature `application` use-cases. See
[`openspec/changes/portfolio-site/design.md`](openspec/changes/portfolio-site/design.md)
for the full folder tree, boundary rules, and pattern rationale, and
[`docs/adr/`](docs/adr/) for individual architecture decision records.

## Getting started

> **Note**: this repository intentionally ships no `.env.example` (the project's
> automated tooling cannot write `.env*` paths), so the canonical env template
> lives in this section — copy the block from step 3.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local Postgres (user, password, and database are all `portfolio` —
   see [`compose.yaml`](compose.yaml)):

   ```bash
   docker compose up -d
   ```

3. Create a `.env` file at the repo root. These two variables are required, and
   `DATABASE_URL` must carry the credentials from `compose.yaml` — without them
   the Postgres client falls back to your OS username and fails with
   `password authentication failed`:

   ```bash
   # .env — minimum working local configuration
   DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio
   # any long random string, e.g. the output of: openssl rand -hex 32
   VISITOR_HASH_SECRET=replace-with-a-long-random-string
   ```

   Optional variables (features degrade gracefully when absent — see
   [Environment variables](#environment-variables)):

   ```bash
   #RESEND_API_KEY=            # contact email delivery (absent = HTTP 202, message still persisted)
   #EMAIL_DRIVER=resend        # resend | fake (CI/e2e uses fake)
   #CONTACT_EMAIL_TO=          # contact email destination address
   #CONTACT_EMAIL_FROM=Portfolio Contact <onboarding@resend.dev>
   #GITHUB_TOKEN=              # home GitHub activity section (absent = fallback message)
   #                           # generate a fine-grained read-only PAT (no extra permissions
   #                           # needed, public read access is enough):
   #                           # https://github.com/settings/personal-access-tokens/new
   #NEXT_PUBLIC_SITE_URL=http://localhost:3000   # absolute origin for sitemap/RSS/canonical/OG URLs
   ```

4. Apply the database migrations (creates `contact_messages`, `article_views`,
   `article_reactions`, `article_search`, and `rate_limits`):

   ```bash
   npm run db:migrate
   ```

5. Populate the full-text search index from the MDX content:

   ```bash
   npm run db:sync-search
   ```

6. Start the dev server and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint (includes architecture boundary rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit/integration suite |
| `npm run test:coverage` | Vitest with the coverage gate (80% lines+branches) |
| `npm run test:e2e` | Playwright e2e suite against a production build |
| `npm run db:generate` | Generate a Drizzle migration from the schema |
| `npm run db:migrate` | Apply pending Drizzle migrations |
| `npm run db:sync-search` | Full-reconcile the `article_search` full-text index from `content/blog/` |
| `npm run verify:no-client-secrets` | Scan the built `.next/static` client bundle for leaked secret env var values (security: No Client-Side Secrets) — run after `npm run build` |
| `npm run lighthouse` | Run the Lighthouse CI budget (mobile preset — Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95) against a production build |

## Environment variables

See [Getting started](#getting-started) (step 3) for the copy-paste env template.
`DATABASE_URL` and `VISITOR_HASH_SECRET` are
required at runtime (server fails fast if missing); `RESEND_API_KEY`, `GITHUB_TOKEN`,
and `CONTACT_EMAIL_TO` are optional — the affected features degrade gracefully when
absent (the contact form still persists messages and returns HTTP 202 without a
configured email destination). `EMAIL_DRIVER` (`resend` | `fake`, default `resend`)
selects the contact email sender; CI sets it to `fake` for a deterministic e2e happy
path with no real Resend calls. `CONTACT_EMAIL_FROM` defaults to Resend's sandbox
sender (`Portfolio Contact <onboarding@resend.dev>`), which works without a verified
domain — override it once a custom domain is verified in Resend.

## CI

GitHub Actions runs three independent, blocking jobs on every pull request and on every
push to `main`: lint + typecheck + unit/integration tests with an 80% line+branch
coverage gate over `src/**` and `scripts/**`; a Playwright e2e suite (against a real
Postgres service container) covering locale switch, theme, filter, search, contact,
article view, engagement, and GitHub activity; and a Lighthouse CI budget (mobile
preset — Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95)
against the home page (`/es`, `/en`) and an article page. The e2e job also runs
`npm run verify:no-client-secrets` against the built client bundle before starting the
Playwright suite. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Credits

The skills section's brand icons are vendored from
[devicon](https://github.com/devicons/devicon) (MIT). See
[`docs/third-party-assets.md`](docs/third-party-assets.md) for exact file
provenance and licensing.
