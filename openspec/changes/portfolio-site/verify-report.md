# Verification Report — TERMINAL (PR1–PR15, full scope)

**Change**: portfolio-site
**Date**: 2026-07-09
**Scope**: Full terminal re-verification extending the prior PR1–PR14 terminal report (verdict PASS, dated 2026-07-08) to cover **PR15**, the production infrastructure slice (PR #20, branch `feat/pr15-infra`, base `feat/pr14-header-fidelity`, 6 commits: main 674-line infra-stack commit + domain-correction fix + 4-defect TLS-cutover fix, each followed by an SDD apply-findings doc commit). This report **supersedes** the prior terminal report in this file's history in full. This is the gate before `sdd-archive`.
**Branch verified**: `feat/pr15-infra` (current chain tip; feature-branch-chain — PR #20 → base `feat/pr14-header-fidelity` (PR #19) → … → PR1). `develop` (a separate, deploy-source-only branch) is a merge of this tip and was not independently re-verified — its content is identical to `feat/pr15-infra`'s tip by construction (fast-forward merges only, confirmed via `git log`).
**Mode**: Strict TDD (PR1–PR14 code; PR15 is pure infra with no unit-test surface — see TDD Compliance below for the disclosed, project-precedented exception and this session's real-execution verification in its place)

> All findings below are independent, this-session evidence re-derived from source inspection (`git show`/`git diff` against the real commits), real command execution (`npm`, `docker build`, `docker compose config --quiet`, `docker run ... nginx -t` against real `nginx:1.27-alpine` containers), and read-only external checks (`gh run view --log`, `curl`/`openssl s_client` against the live production site) — not from `tasks.md`'s or the prior apply-progress's self-reported claims alone, though every claim was cross-checked and, with one exception (see CRITICAL-1 below), found accurate. Prior PR1–PR14 non-blocking residuals (WARNING-2, WARNING-3, SUGGESTION-1) are carried forward without re-litigation, per the assigned scope, since PR15 did not touch their code paths.

## Completeness

| Metric | Value |
|--------|-------|
| Planned phases (PR1–PR11) | 62/62 tasks checked complete (unchanged since the PR1–PR14 report) |
| Documented apply-findings sections beyond the 11 planned phases | PR11–PR14 resolve-blockers/fidelity additions (all previously verified) + **PR15** (infra slice) + **PR15 domain-correction follow-up** + **PR15 real-server-bootstrap-defects follow-up** — all user-approved scope additions, all disclosed in `tasks.md` |
| Tasks unchecked | 0 |

## Build & Tests Execution (all commands run for real, this session, on `feat/pr15-infra`)

**Lint**: PASSED — `npm run lint` (ESLint), 0 errors, 0 warnings.

**Typecheck**: PASSED — `npm run typecheck` (`tsc --noEmit`), 0 errors.

**Tests**: PASSED — 481/481, 104 test files. Byte-identical to the PR1–PR14 baseline (PR15 added zero test files — no coverage-eligible application code was touched, see below).
```text
 Test Files  104 passed (104)
      Tests  481 passed (481)
```

**Coverage**: 97.55% stmts / 93.66% branch / 96.4% funcs / 97.5% lines — threshold 80% → **PASSED on all four metrics**, byte-identical to the PR1–PR14 baseline (97.55/93.66/96.4/97.5). Confirmed via `git diff --stat feat/pr14-header-fidelity..feat/pr15-infra -- 'src/**' 'scripts/**' 'app/**'`: **empty** — PR15 touched zero files under those trees. The only application-code change in the entire PR15 scope is `next.config.ts`'s `output: "standalone"` line (a build-output-shape config switch, already excluded from the coverage gate per the quality-pipeline spec, confirmed via source read).

**Build**: PASSED — `npm run build` (Next.js 16.2.10, Turbopack), clean compile, TypeScript pass, 22 routes generated (unchanged route list vs. the PR14 baseline), and `.next/standalone` now emitted (confirmed present on disk: `server.js` + traced `node_modules`).

**Docker build**: PASSED — `docker build .` succeeds with **zero build-time secrets set** in this session's shell environment, confirming `shared/config/env.ts`'s lazy runtime-only validation design holds under Docker. Final image size: **758MB** — matches `tasks.md`'s claimed figure exactly.

**`docker compose -f docker-compose.prod.yml config --quiet`**: PASSED (exit 0). Per the assigned instruction, the bare `docker compose config` form (which interpolates real `.env` secrets into its output — the exact mechanism that leaked a live `GITHUB_TOKEN`/`VISITOR_HASH_SECRET` into an earlier session's transcript, per `tasks.md`'s own disclosed finding #6) was never run this session; only `--quiet` was used.

**nginx config validation (real `nginx:1.27-alpine` containers, this session, with a stub `app`-aliased container on a real Docker network so upstream DNS resolution succeeds — a stricter test than a bare `nginx -t` with no upstream, which fails at DNS resolution before ever reaching the SSL cert lines)**:
- `default.http-bootstrap.conf.disabled` (the fresh-server-only HTTP config, confirmed NOT loaded by default — `.disabled` extension, absent from the directory listing under an active name): `nginx: configuration file /etc/nginx/nginx.conf syntax is ok` / `test is successful`. **PASSED.**
- `default.ssl.conf` (the ACTIVE, committed production config, confirmed loaded by default — standard `.conf` extension, present in `infra/nginx/conf.d/` alongside `upstream.conf`): fails **specifically and only** on the locally-missing certificate — `cannot load certificate "/etc/letsencrypt/live/valenciafullstack.tech/fullchain.pem": ... No such file or directory` — not a syntax error. **Matches the claimed/expected failure mode exactly**, confirming the two-stage bootstrap design (`default.http-bootstrap.conf.disabled` for a genuinely fresh, cert-less server; `default.ssl.conf` for every server that already has a cert) is real and correctly structured, and that the file rename disclosed in the apply-progress (`default.ssl.conf.disabled` → `default.ssl.conf`; `default.conf` → `default.http-bootstrap.conf.disabled`) was actually carried out, not just claimed.

## Deploy Workflow — Live GitHub Actions Evidence (read-only, `gh run list`/`gh run view --log`)

| Run | Trigger | Result | Duration | Note |
|---|---|---|---|---|
| `29025652909` | merge PR15 infra → `develop` | ❌ failure | 5m54s | `Deploy to VPS` step: `Error: missing server host` — **expected**, the 3 deploy secrets did not exist yet at this point in the session (disclosed, not a defect) |
| `29027618788` | merge domain-correction fix → `develop` | ❌ failure | 2m52s | Same expected cause — secrets still not created |
| `29033752355` | merge TLS-cutover-fix → `develop` | ✅ **success** | 3m13s | The real, secrets-now-present end-to-end deploy — the one apply-progress claims completed the TLS cutover |

Full log of the successful run (`29033752355`), independently re-pulled this session via `gh run view --log`, confirms every claimed step, in order, with real timestamps:
```text
2026-07-09T16:34:34Z  HEAD is now at 1808dde ... (git reset --hard origin/develop succeeded)
2026-07-09T16:34:34Z  Image nginx:1.27-alpine Pulling / Pulled
2026-07-09T16:34:57Z  Container valenciafullstack-nginx-1 Running
2026-07-09T16:35:08Z  [✓] migrations applied successfully!
2026-07-09T16:35:11Z  sync-search: reconciled 7 article_search row(s).
2026-07-09T16:35:15Z  nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
2026-07-09T16:35:15Z  nginx: configuration file /etc/nginx/nginx.conf test is successful
2026-07-09T16:35:16Z  [notice] 448#448: signal process started
```
This proves: the real TLS certificate at `/etc/letsencrypt/live/valenciafullstack.tech/...` loaded correctly in production (`nginx -t` fails specifically and only on a missing/unreadable cert, independently reproduced by this session's own local sandbox test above against the same config with no cert present), and the reload signal was delivered — the exact defect-2 fix (`nginx -t && nginx -s reload` after `up -d`) working as designed, live. **No SSH was performed by this session** — every claim above is read from workflow log output only, matching the assigned instruction.

## Live Site Verification (read-only, from outside, this session)

| Check | Result |
|---|---|
| `https://valenciafullstack.tech/es` | `200`, valid TLS (`ssl_verify_result: 0`) |
| `https://valenciafullstack.tech/en` | `200` |
| `http://valenciafullstack.tech/` → | `301` → `https://valenciafullstack.tech/` |
| `https://www.valenciafullstack.tech/` → | `308` → `/es` (served directly by the same TLS vhost/cert, not a separate apex redirect — both apex and `www` are in the cert's SAN list) |
| TLS certificate | `CN=valenciafullstack.tech`, issuer Let's Encrypt, SAN = `valenciafullstack.tech, www.valenciafullstack.tech`, `notAfter: Oct 7 2026` — matches the disclosed `2026-10-07` expiry exactly |
| Security headers on `/es` | `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, `strict-transport-security: max-age=63072000; includeSubDomains; preload`, `content-security-policy: ...` (ADR-0007 shape, unchanged) — **each header present exactly once**, confirming nginx does not duplicate or conflict with the app's own header set (nginx's two configs set no security headers of their own, confirmed by source read) |
| `sitemap.xml` | `200` |
| `/es/rss.xml` | `200` |
| `/robots.txt` | `404` — **carried-forward WARNING-2**, unchanged, not touched by PR15 |

## Cross-Check: `tasks.md` Claims vs. Actual Commit Diffs (this session, `git show`/`git diff --stat`)

| Commit | Claimed | Measured | Match |
|---|---|---|---|
| `c2e0218` (main infra stack) | 674 insertions, 9 files, 0 deletions | `674 insertions(+)`, 9 files | ✅ Exact |
| `e596434` (domain fix) | 16 insertions/16 deletions, 4 files | `16 insertions(+), 16 deletions(-)`, 4 files | ✅ Exact |
| `13006a5` (TLS-cutover 4-defect fix) | 136 insertions/47 deletions, 5 files | `136 insertions(+), 47 deletions(-)`, 5 files | ✅ Exact |
| Total commits on `feat/pr15-infra` | 6 (3 code + 3 docs) | 6, confirmed via `git log feat/pr14-header-fidelity..feat/pr15-infra` | ✅ Exact |

**Secret scan** (`git diff` across the full PR15 range, pattern-matched for key/token/password/PEM-header signatures): zero real secrets found. The only match is the compose file's documented placeholder `POSTGRES_PASSWORD=REPLACE_WITH_A_STRONG_PASSWORD` (a template value, not a real credential). `.env`/`.env.*` confirmed gitignored (`!.env.example` is the sole exception) and confirmed excluded from the Docker build context via `.dockerignore`.

**Runbook secrets table vs. `deploy.yml`**: `infra/README.md`'s secrets table lists exactly `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` — matches `deploy.yml`'s `secrets.VPS_HOST`/`secrets.VPS_USER`/`secrets.VPS_SSH_KEY` usage exactly, no extra or missing entries.

**`.env` template optional-var fix (defect 4)**: confirmed present in `infra/README.md` — `# RESEND_API_KEY=...`, `# CONTACT_EMAIL_TO=...`, `# GITHUB_TOKEN=...` are commented out with an explicit inline note distinguishing "commented out" from "present but empty" (the actual root cause of the live `db:sync-search` failure this defect fixed).

## TDD Compliance (Strict TDD Mode)

PR1–PR14 code retains its full, previously-verified TDD Cycle Evidence (unchanged, not re-litigated here). **PR15 is scoped as a disclosed TDD exception**, consistent with this project's own precedent (PR12's vendored-icon-asset handling): the entire PR15 diff touches only `Dockerfile`, `docker-compose.prod.yml`, `.dockerignore`, `infra/nginx/conf.d/*`, `.github/workflows/deploy.yml`, `infra/README.md`, and one config-only line in `next.config.ts` — zero `src/**`/`scripts/**`/`app/**` files, confirmed above via an empty `git diff --stat` against those trees. `tasks.md`'s PR15 entry explicitly discloses this ("TDD: not applicable per the orchestrator's own scoping instruction") and states the substitute verification mechanism (real command execution at every layer) rather than silently omitting test evidence. This session independently re-ran every one of those real-execution checks (docker build, compose config --quiet, both nginx configs against a real container, the live deploy log, the live site) rather than trusting the disclosure — all reproduced with matching results. This is an accepted, disclosed, and now independently re-verified exception, not a TDD-evidence gap.

### Assertion Quality
Not applicable to PR15 (zero test files added or modified). PR1–PR14's assertion quality audit (no trivial/tautological assertions found) stands unchanged.

### Test Layer Distribution
Unchanged from the PR1–PR14 report (PR15 added no tests): Unit/Integration/E2E counts identical, 481 total unit/integration tests + 50 e2e tests.

### Changed File Coverage
Not applicable — PR15 touched zero coverage-eligible files. `next.config.ts` is a build config file, out of the coverage gate's scope per the quality-pipeline spec (confirmed by source read, not merely assumed).

### Quality Metrics
**Linter**: PASSED, 0 errors
**Type Checker**: PASSED, 0 errors

## Spec Compliance Matrix (PR15-relevant capabilities, this session's re-verification)

| Capability | Requirement | Result |
|---|---|---|
| quality-pipeline | lint/typecheck/coverage/build all green | ✅ COMPLIANT |
| persistence: env validation lazy at runtime, not build time | `next build`/`docker build` MUST NOT require `DATABASE_URL` | ✅ COMPLIANT — `docker build .` succeeds with zero secrets set, confirmed this session |
| security: Rate Limiting on Write/Query Endpoints — client IP resolution | "on generic append-style proxies, the first `x-forwarded-for` entry is client-controlled and **MUST NOT be trusted**"; the platform-provided-header exception applies only "behind a platform-managed proxy that sanitizes headers before the request reaches the app (e.g. Vercel)" | ❌ **NOT COMPLIANT — see CRITICAL-1 below** |
| security: headers (ADR-0007 CSP, HSTS, etc.) | App-level headers must reach the client unmodified/unduplicated | ✅ COMPLIANT — confirmed live, single instance of each header |
| seo: sitemap/RSS reachability | Reachable in production | ✅ COMPLIANT — confirmed live, `200` |
| seo: robots.txt | Not in PR15's scope | ❌ Not implemented — carried-forward WARNING-2, unaffected by PR15 |

## Correctness (Static + Live Evidence, this session)

| Requirement | Status | Notes |
|------------|--------|-------|
| `next.config.ts` `output: "standalone"` | ✅ Implemented | Confirmed via `git diff`, `.next/standalone` present on disk post-build |
| Multi-stage `Dockerfile` (deps/builder/tools/runner, non-root, HEALTHCHECK) | ✅ Implemented | `docker build .` succeeds, 758MB final image, matches claim |
| `.dockerignore` excludes `.env*`/`node_modules`/`.next`/`design-reference/`/`openspec/`/`docs/` | ✅ Confirmed | Read directly; `.env`/`.env.*` present with `!.env.example` exception |
| `docker-compose.prod.yml`: only `nginx` publishes host ports | ✅ Confirmed | `config --quiet` validates; source read confirms `app`/`postgres` use `expose:` only |
| nginx TLS cutover: `default.ssl.conf` active, `default.http-bootstrap.conf.disabled` inactive | ✅ Confirmed | Directory listing + real `nginx -t` results above |
| `deploy.yml`: `git reset --hard` + `git clean -fd` + `nginx -t && nginx -s reload` after `up -d` | ✅ Confirmed | Source read + live log evidence above, both present and executed in order |
| certbot one-shot bypasses renew-loop entrypoint (`--entrypoint ""`) | ✅ Confirmed | `infra/README.md` runbook read directly |
| `.env` template comments out optional vars | ✅ Confirmed | `infra/README.md` read directly |
| Domain corrected to `valenciafullstack.tech` across all 4 originally-wrong files | ✅ Confirmed | `git show e596434`, live TLS cert CN/SAN both show `.tech` |
| **Client IP resolution (`resolveClientIp`) trust model** | ❌ **Broken by this PR's infra change, undisclosed** | See CRITICAL-1 |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| `feature-branch-chain` delivery | ✅ Yes | `feat/pr15-infra` → `feat/pr14-header-fidelity` (PR #19) → … confirmed via `git log`; PR15 also merges into the separate `develop` deploy-source branch, a disclosed one-time deviation from the pure chain pattern, justified and accurate |
| `design.md`'s "Target: Vercel-class" / Postgres "Neon/Supabase" | ⚠️ Superseded, disclosed | `design.md` itself is unamended (out of scope, correctly disclosed as a separate concern from apply execution) — self-hosted Docker Compose on Hetzner was a user mid-project decision, recorded separately |
| Review budget (674 lines, above the 400-line default) | ✅ Disclosed, justified | Atomic-infra-unit reasoning (same precedent as PR12's vendored icons) — accepted, not silently exceeded |
| Strict TDD applied where applicable | ✅ Yes, with a disclosed exception | See TDD Compliance above |
| Security header ownership (app sets, nginx passes through) | ✅ Yes | Confirmed live, no duplication |
| **Client-IP trust model carried over unchanged from the Vercel-target assumption into a self-hosted-nginx production target** | ❌ **No — not re-validated, not disclosed** | See CRITICAL-1 |

## Issues Found

### CRITICAL

**CRITICAL-1 (NEW, this session, undisclosed by PR15's apply findings): rate limiting on all 5 write/query endpoints is trivially bypassable via a spoofed `X-Forwarded-For` header in production.**

- `src/shared/security/resolve-client-ip.ts` unconditionally trusts the **first** entry of the `x-forwarded-for` header. Its own doc comment and the `security` spec (`specs/security/spec.md`, "Rate Limiting on Write/Query Endpoints") are explicit that this is safe **only** "behind a platform-managed proxy that sanitizes headers before the request reaches the app (e.g. Vercel)" and that "on generic append-style proxies, the first `x-forwarded-for` entry is client-controlled and **MUST NOT be trusted**."
- PR15 changed the actual production proxy from the assumed Vercel target (`design.md`'s "Target: Vercel-class", still unamended) to a **self-hosted nginx** reverse proxy. Both `infra/nginx/conf.d/default.ssl.conf` and `default.http-bootstrap.conf.disabled` set `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` — nginx's `$proxy_add_x_forwarded_for` is a textbook **append-style** proxy variable: it appends `$remote_addr` to whatever `X-Forwarded-For` value the client already sent, it does **not** overwrite/sanitize it. This is exactly the "generic append-style proxy" case the spec's own MUST NOT clause describes.
- Net effect: any external client can send `X-Forwarded-For: 1.2.3.4` and nginx will forward `X-Forwarded-For: 1.2.3.4, <real-client-ip>` to the app; `resolveClientIp()` takes the first entry (`1.2.3.4`, fully attacker-controlled) as the rate-limiting/dedup key for **all 5** endpoints that call it (`app/api/contact/route.ts`, `app/api/engagement/[slug]/route.ts`, `app/api/engagement/views/route.ts`, `app/api/engagement/reactions/route.ts`, `app/api/search/route.ts`). Rotating that header value on every request defeats the `ip_hash`-keyed rate limit entirely — contact-form spam, engagement view/reaction stat poisoning, and search-endpoint DB-query abuse are all now unthrottled in production.
- Verified by source + config cross-check this session (nginx config `proxy_set_header` directives read directly; `resolveClientIp`'s own trust precondition read directly and compared against the actual proxy's real behavior); not exploited live against production, per the assigned read-only-only instruction.
- This is a genuine regression introduced by PR15's infra decision, not a pre-existing/already-accepted gap: `tasks.md`'s own PR6-era note (line 292) explicitly frames the trust assumption as "correct in production behind Vercel's sanitizing proxy" — a precondition PR15 silently invalidated by switching the actual production proxy without revisiting or disclosing the consequence anywhere in its "Non-obvious findings," "Deviations from design," or the two follow-up defect-fix entries (which found and fixed 4 *other* real defects via live testing, but this one was not among them because it requires no visible symptom under normal traffic to surface — only under active abuse).
- **Fix is out of scope for this report** (verify does not fix issues), but the two standard remedies are: (a) nginx's `ngx_http_realip_module` (`set_real_ip_from <trusted-upstream-cidr>; real_ip_header X-Forwarded-For; real_ip_recursive on;`) — not applicable here since nginx itself is the edge, so instead (b) reset rather than append the header at the edge (`proxy_set_header X-Forwarded-For $remote_addr;`, discarding any client-supplied value outright, since nginx is directly internet-facing with no further trusted proxy in front of it).

### WARNING

**WARNING-2 (carried forward, unchanged, non-blocking): `app/robots.ts` was never shipped.** No owning task, no spec `MUST` scenario. Confirmed via a live `GET /robots.txt` → 404 this session.

**WARNING-3 (carried forward, unchanged, non-blocking): i18n's "SHOULD preserve scroll position" on locale switch remains untested at the e2e/behavioral level.** A SHOULD, not a MUST. Not touched by PR15.

**WARNING-4 (NEW, non-blocking, disclosed by the project itself, re-confirmed this session): the runbook's fresh-server bootstrap path (`default.http-bootstrap.conf.disabled` activated locally on a genuinely certificate-less server) has never been exercised live** — the real server already had a certificate by the time this path would have been tested. Verified only by this session's own local nginx syntax check (PASSED, see above) and code review, not a live fresh-boot run. Carried forward as explicitly disclosed in `apply-progress`, not rediscovered.

### SUGGESTION

**SUGGESTION-1 (carried forward, unchanged): `src/shared/i18n/request.ts` still shows 0% direct coverage.** Pre-existing since PR2b, already justified; unaffected by PR15.

**SUGGESTION-2 (carried forward, unchanged, informational): minor pre-existing design-fidelity residuals disclosed by the PR13 extension** (card category label tracking, non-skills-section eyebrow tracking) remain open, explicitly out of that session's hard scope constraint. Not touched by PR15.

**SUGGESTION-3 (carried forward, unchanged, informational): Lighthouse Performance margin remains genuinely thin and noisy on `/es`/`/en` at the individual-sample level**, pre-existing measurement noise, not introduced by PR13/PR14/PR15.

**SUGGESTION-4 (NEW, non-blocking, informational): the leaked `GITHUB_TOKEN` PAT rotation, disclosed by `tasks.md`'s finding #6, remains an outstanding user action item** — confirmed still open (not something this session's read-only scope could verify remediation of; flagged here only as a pointer, since it's security-adjacent to CRITICAL-1's theme but is a distinct, already-disclosed, already-tracked item, not re-discovered).

## Verdict

**FAIL — one CRITICAL issue (CRITICAL-1) must be resolved before `sdd-archive`.**

Every quality gate re-run for real this session on `feat/pr15-infra` is green: lint (0 errors), typecheck (0 errors), 481/481 unit tests at byte-identical 97.55%/93.66%/96.4%/97.5% coverage, a clean production build (both plain and Docker), a valid `docker compose config --quiet`, both nginx configs behaving exactly as designed against real containers, a live-confirmed successful production deploy (GitHub Actions log evidence, real SSH, real TLS cutover), and a live, externally-reachable production site with valid TLS, correct HTTP→HTTPS redirect, and an unduplicated app-owned security header set. Every `tasks.md` PR15 claim — line counts, file renames, the 4 real-server bootstrap defects and their fixes, the domain correction, the deploy log evidence — was independently cross-checked against actual commits/live evidence this session and found accurate, with **one exception**: CRITICAL-1, a genuine, previously-undisclosed rate-limiting bypass caused by PR15's silent change of the production reverse-proxy from the assumed Vercel (header-sanitizing) model to a self-hosted, non-sanitizing nginx proxy, in direct conflict with the `security` spec's own explicit MUST NOT clause.

CRITICAL-1 does not block the site from being live or functioning correctly for legitimate traffic — it is an abuse-resistance gap, not an availability or correctness defect — but it is a genuine spec violation with real-world exploitability (a single custom request header, no authentication or special access required) affecting all 5 rate-limited endpoints, so per this skill's own decision gate ("Spec scenario has no passing covering test" / a design deviation that breaks a spec = CRITICAL), it is reported as CRITICAL rather than a WARNING.

WARNING-2/WARNING-3 (carried, non-blocking) and the new WARNING-4 (disclosed, non-blocking, informational) do not block archive on their own. SUGGESTION-1/2/3 are carried forward unchanged; SUGGESTION-4 is a pointer to an already-tracked outstanding user action item.

**Recommendation: route back to `sdd-apply` for a small, targeted fix to `infra/nginx/conf.d/default.ssl.conf` and `default.http-bootstrap.conf.disabled`'s `X-Forwarded-For` handling (reset rather than append, since nginx is the internet-facing edge with no further trusted proxy in front of it), then re-run this verification's CRITICAL-1 check specifically before `sdd-archive`.** No other part of the PR1–PR15 scope requires further work.
