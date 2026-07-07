# Portfolio — Andrés Valencia

<!-- Badges: placeholders until CI workflow runs on `main` and the coverage/Lighthouse
     gates are fully wired (PR11, task 11.3). The workflow file already exists at
     .github/workflows/ci.yml. -->

![CI](https://img.shields.io/badge/CI-pending-lightgrey)
![Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)
![Lighthouse](https://img.shields.io/badge/lighthouse-pending-lightgrey)

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

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL / VISITOR_HASH_SECRET
docker compose up -d   # local Postgres
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Environment variables

See `.env.example` for the full list. `DATABASE_URL` and `VISITOR_HASH_SECRET` are
required at runtime (server fails fast if missing); `RESEND_API_KEY`, `GITHUB_TOKEN`,
and `CONTACT_EMAIL_TO` are optional — the affected features degrade gracefully when
absent (the contact form still persists messages and returns HTTP 202 without a
configured email destination). `EMAIL_DRIVER` (`resend` | `fake`, default `resend`)
selects the contact email sender; CI sets it to `fake` for a deterministic e2e happy
path with no real Resend calls. `CONTACT_EMAIL_FROM` defaults to Resend's sandbox
sender (`Portfolio Contact <onboarding@resend.dev>`), which works without a verified
domain — override it once a custom domain is verified in Resend.

## CI

GitHub Actions runs lint, typecheck, unit/integration tests with coverage, Playwright
e2e (against a real Postgres service container), and a Lighthouse budget check on every
pull request. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
