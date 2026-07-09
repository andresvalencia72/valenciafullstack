# syntax=docker/dockerfile:1.7
#
# Production image for the portfolio Next.js app. See infra/README.md for
# the full deployment runbook, the env matrix, and the rationale behind
# every non-obvious decision referenced in the comments below.
#
# Stage flow: deps -> builder -> tools -> runner
#   - deps:    installs the full dependency tree once (prod + dev), used by
#              `builder` to run `next build` (needs devDependencies like
#              typescript/tailwindcss).
#   - builder: runs `next build` with `output: "standalone"` (next.config.ts).
#   - tools:   installs drizzle-kit + tsx + the handful of production
#              packages they need at runtime, in complete isolation from
#              the project's own package-lock.json (see its own comment
#              below for why this stage exists, is isolated rather than
#              derived from `deps`, and carries exactly this package set).
#   - runner:  ships `.next/standalone` as-is (Next's own output tracer
#              already computed the minimal runtime node_modules subset —
#              do NOT copy the full `deps`/production node_modules over it,
#              see the size note below) with `tools`'s packages merged in,
#              so the same image runs both the long-running `app` service
#              and the one-shot `npm run db:migrate` /
#              `npm run db:sync-search` container jobs.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Builder: no secrets are required at build time. `shared/config/env.ts`
# validates DATABASE_URL / VISITOR_HASH_SECRET lazily on first *runtime*
# access only (see that file's own doc comment) — `next build` never imports
# it at module scope. The one env var `next build` does read,
# NEXT_PUBLIC_SITE_URL, has a safe build-time default
# (shared/config/env.public.ts: `http://localhost:3000`); the real production
# value is supplied to the container at runtime via the server's `.env` file
# instead (see infra/README.md env matrix) — no real secret or the real
# domain is ever baked into an image layer.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# -----------------------------------------------------------------------------
# tools: drizzle-kit + tsx, plus every *production* package that
# `scripts/sync-search.ts` and `drizzle.config.ts` actually reach at
# runtime (`drizzle-orm`, `postgres`, `gray-matter`, `next-intl`, `zod`) —
# in an empty tree with no relation to the project's own
# package-lock.json, exact-pinned to the same resolved versions `deps`/CI
# use (verified against package-lock.json's `node_modules/{drizzle-kit,
# tsx,drizzle-orm,postgres,gray-matter,next-intl,zod}` entries: 0.31.10 /
# 4.23.0 / 0.45.2 / 3.4.9 / 4.0.3 / 4.13.1 / 4.4.3).
#
# WHY these specific 5 production packages, not "all of package.json's
# dependencies": traced empirically, not guessed — walked the real import
# graph reachable from `scripts/sync-search.ts` and `drizzle.config.ts`
# (through `@/shared/content/mdx-loader.ts`, `@/shared/db/client.ts`,
# `@/shared/i18n/routing.ts`, `@/features/search/infrastructure/...`) and
# collected every non-relative, non-`@/`, non-`node:` import specifier —
# that closure is exactly this set. `next` itself, `react`/`react-dom`,
# `framer-motion`, `next-mdx-remote`, `rehype-pretty-code`, `shiki`, and
# `resend` are all render/UI-path-only and never enter this closure.
#
# None of these are needed by the running `app` service's own node_modules
# — Turbopack bundles them directly into `.next/standalone`'s server chunk
# files (verified: `grep`ing `.next/server/app/api/contact/route.js.nft.
# json`'s file list for `drizzle-orm`/`postgres` finds nothing, yet the
# built app successfully served a real DB-backed route end-to-end against
# a live Postgres in this stage's own verification). `drizzle-kit`/`tsx`
# run as separate CLI processes, though, invoked directly (not through the
# app's bundled chunks) — outside Turbopack's bundling entirely, they need
# every one of these as real files on disk. Found and fixed empirically
# across three failed `db:migrate`/`db:sync-search` verification runs
# (missing `drizzle-orm`, then missing a DB driver, then missing
# `gray-matter`/`next-intl`/`zod` via `src/`-sourced imports), not assumed
# from documentation.
#
# REJECTED ALTERNATIVE (tried first, empirically measured, do not repeat):
# copying the full `deps` node_modules into `runner` and running
# `npm prune --omit=dev` there. This does NOT remove `next`'s own
# `@next/swc-*` native compiler binaries + the full `next` package
# (~400MB) — npm correctly treats them as production dependencies (they
# ARE, for `next build`/`next dev`), so pruning devDependencies alone
# cannot remove them. `.next/standalone`'s own output tracer, by contrast,
# already determined the actual minimal runtime subset (no compiler
# binaries needed to just run `node server.js`) — copying the full
# production tree on top defeats the entire purpose of `output:
# "standalone"`. Measured: full-tree-then-prune produced a ~650MB
# node_modules; this isolated-tools approach produces a runner image of
# ~760MB total (verified with `docker images`), all of it either Next's
# own already-minimal standalone subset or this stage's 7 explicit packages.
#
# `--omit=peer` is required: `next-intl` declares `next` as a peer
# dependency, and without this flag npm 7+'s default peer-auto-install
# fetches a *fresh, full* copy of `next` (+ all `@next/swc-*` native
# compiler binaries, ~290MB) into this otherwise-tiny isolated tree —
# found empirically (image jumped 636MB -> 1.57GB after adding
# `next-intl` alone). Safe to omit here: `scripts/sync-search.ts` only
# reaches `next-intl/routing`'s `defineRouting()`, a narrow config helper
# with no real runtime call into the `next` package itself.
FROM node:22-alpine AS tools
WORKDIR /tools
RUN npm install --no-save --no-audit --no-fund --omit=peer \
  drizzle-kit@0.31.10 tsx@4.23.0 drizzle-orm@0.45.2 postgres@3.4.9 \
  gray-matter@4.0.3 next-intl@4.13.1 zod@4.4.3

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The Next.js standalone server (server.js + its own minimal traced
# node_modules subset) — see the `tools` stage comment above for why this
# is copied as-is rather than replaced with a pruned full production tree.
#
# SECURITY NOTE (verified empirically, not assumed): `.next/standalone` also
# auto-copies any `.env`/`.env.*` file present in the build context at
# `next build` time, if one exists. `.dockerignore` excludes `.env*` from
# ever reaching the builder stage's `COPY . .`, so this stage never has a
# real `.env` to copy in the first place — but this is *why* that exclusion
# is a hard security requirement here, not just build hygiene: without it,
# a developer's local secrets would be baked into a shipped image layer.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Merge drizzle-kit/tsx (and their own dependency trees) into the
# standalone node_modules, copied AFTER so Docker's directory-merge COPY
# semantics add new subfolders without touching what Next already traced.
COPY --from=tools /tools/node_modules ./node_modules

# Read from disk at request/script time via `fs`, or imported directly as
# raw TS source by `tsx` (unbundled, unlike the app's Turbopack chunks) —
# neither path goes through Next's output file tracing, so each must be
# copied explicitly. `drizzle/`, `scripts/`, and `src/` are confirmed NOT
# present in `.next/standalone` at all (verified: `content/` happens to
# already be traced automatically in this build because
# `shared/content/mdx-loader.ts`'s `path.join(process.cwd(), "content",
# "blog")` call is statically analyzable, but is kept here explicitly too
# as a guarantee independent of that tracer heuristic):
#   - content/          MDX articles (shared/content/mdx-loader.ts,
#                        scripts/sync-search.ts both read this at runtime)
#   - drizzle/           migration SQL (drizzle-kit migrate)
#   - drizzle.config.ts  drizzle-kit's own config (schema/out/dialect)
#   - scripts/           db:sync-search's own TS source, run via tsx
#   - src/               scripts/sync-search.ts imports `@/shared/...` and
#                        `@/features/...` directly from source (tsx
#                        transpiles on the fly, unbundled) — found and
#                        fixed empirically: without this, tsx fails with
#                        `Cannot find module '@/shared/content/mdx-loader'`
#                        even though tsconfig.json's path alias is present,
#                        because there's no `src/` tree for it to resolve
#                        into.
#   - tsconfig.json       tsx resolves the `@/*` path alias used by
#                          scripts/sync-search.ts from this file
COPY --from=builder /app/content ./content
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# No extra binary (curl/wget) required — Node 22 ships a global `fetch`,
# which follows the home page's locale redirect by default, so a healthy
# container resolves to a final 200 response.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
