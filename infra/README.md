# Production deployment — valenciafullstack.tech

This stack runs the portfolio on a single Hetzner VPS: `nginx` terminates
TLS and reverse-proxies to the `app` container, `app` talks to `postgres`
over the Docker-internal network only, and `certbot` keeps the certificate
renewed. GitHub Actions builds the image and deploys on every push to
`develop`. See [`docker-compose.prod.yml`](../docker-compose.prod.yml),
[`Dockerfile`](../Dockerfile), [`nginx/conf.d/`](nginx/conf.d/), and
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

Server hardening (non-root `deploy` user, ufw, fail2ban, Docker Engine
install) is a prerequisite covered by a separate ops runbook — not part of
this change.

## Quick path (first deploy on a fresh, hardened server)

1. As the `deploy` user, clone the repo to `/opt/valenciafullstack` and
   check out `develop`:

   ```bash
   sudo mkdir -p /opt/valenciafullstack && sudo chown deploy:deploy /opt/valenciafullstack
   git clone -b develop git@github.com:andresvalencia72/valenciafullstack.git /opt/valenciafullstack
   ```

2. Create `/opt/valenciafullstack/.env` from the [template below](#env-file-template-server-side-only) — this file is never committed (see `.gitignore`'s `.env*` rule).

3. **Fresh server only — no TLS certificate exists yet.** The repo's
   committed nginx config (`default.ssl.conf`) is the ACTIVE production
   config and requires a real certificate to start nginx at all. For this
   one-time case, temporarily swap in the HTTP-only bootstrap config —
   **locally on the server, without committing**:

   ```bash
   cd /opt/valenciafullstack
   mv infra/nginx/conf.d/default.ssl.conf infra/nginx/conf.d/default.ssl.conf.disabled
   cp infra/nginx/conf.d/default.http-bootstrap.conf.disabled infra/nginx/conf.d/default.conf
   ```

   This is deliberately throwaway, uncommitted state — the very next
   `develop` deploy's `git reset --hard && git clean -fd`
   (`.github/workflows/deploy.yml`) discards it automatically and
   restores `default.ssl.conf` as the sole active config. Do not `git add`
   or `git commit` this swap.

   Now start everything over plain HTTP:

   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   docker compose -f docker-compose.prod.yml run --rm app npm run db:migrate
   docker compose -f docker-compose.prod.yml run --rm app npm run db:sync-search
   ```

4. **Point DNS**: create an A record for `valenciafullstack.tech` (and `www`)
   at the server's IP. Wait for propagation (`dig valenciafullstack.tech`
   resolves correctly) before the next step — Let's Encrypt's HTTP-01
   challenge will fail otherwise.

5. **TLS bootstrap** (manual, one-time — see [Details](#details) for why
   this can't be automated on first boot). The `certbot` service's
   `entrypoint` is a permanent renew loop (`docker-compose.prod.yml`), so
   issuing a certificate requires overriding it with `--entrypoint ""` —
   without that override, `certonly` is silently ignored as an argument to
   the loop script and the command hangs forever instead of issuing
   anything:

   ```bash
   docker compose -f docker-compose.prod.yml run --rm --entrypoint "" certbot \
     certbot certonly --webroot -w /var/www/certbot \
     -d valenciafullstack.tech -d www.valenciafullstack.tech \
     --email <your-email> --agree-tos --no-eff-email
   ```

   The certificate now lives in the `certbot-certs` Docker volume — it
   persists across `git reset`/container recreation independently of the
   nginx *config*, which is what step 6 switches over.

6. **TLS cutover** — discard the local, uncommitted bootstrap swap from
   step 3 and reload nginx with the repo's committed (TLS) config:

   ```bash
   git checkout -- infra/nginx/conf.d/
   rm -f infra/nginx/conf.d/default.conf
   docker compose -f docker-compose.prod.yml exec nginx nginx -t
   docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
   ```

   Or simply skip this step and push anything to `develop` — the next
   automated deploy performs the exact same cutover for you (`git reset
   --hard && git clean -fd` restores `default.ssl.conf`, then the deploy
   script validates and reloads nginx; see `.github/workflows/deploy.yml`).

7. **Verify**: `https://valenciafullstack.tech` loads over HTTPS, redirects
   `http://` to `https://`, and the `certbot` service is running (it
   renews automatically from here on — no further manual steps).

Every deploy after this point is automatic: push to `develop` →
`.github/workflows/deploy.yml` builds, pushes to GHCR, rolls the server
forward, and reloads nginx if the config changed.

## Details

| Topic | Decision |
|-------|----------|
| Builds never run on the server | The VPS has 4GB RAM — GH-hosted runners build the image; the server only `docker compose pull`s the finished image. |
| No host ports on `app`/`postgres` | Docker writes its own iptables rules and **bypasses ufw** for anything under `ports:`. Only `nginx` publishes 80/443 (the ports ufw allows); `app`/`postgres` use `expose:` — reachable from `nginx`/each other over the compose network only, never from the internet directly. |
| Why TLS can't be part of first boot | `default.ssl.conf` (the ACTIVE, committed config) references certificate files that don't exist until certbot issues them — nginx refuses to start with a `ssl_certificate` pointing at a missing file. `default.http-bootstrap.conf.disabled` exists so a fresh server can temporarily, locally, and *without committing* swap in an HTTP-only config, start nginx, serve the ACME challenge, and let certbot obtain the first certificate — see the Quick path above. |
| Why the TLS config swap must never be committed | `.github/workflows/deploy.yml` runs `git reset --hard origin/develop && git clean -fd` before every deploy. A committed local swap would either get silently reverted (if it only touched tracked files) or, worse, coexist with the restored `default.ssl.conf` (if left as an untracked leftover) — two configs both trying to `listen 80`/`443` for the same `server_name`. Keeping the swap uncommitted and letting the next deploy's reset+clean wipe it is what actually guarantees only one nginx config is ever active. |
| Why deploy.yml reloads nginx explicitly | `nginx`'s `conf.d/` is a bind mount (`docker-compose.prod.yml`), not baked into its image. `docker compose up -d` only recreates a container when its image/config-as-Compose-sees-it changes — a bind-mounted file changing underneath an already-running container is invisible to that mechanism. Without an explicit `nginx -t && nginx -s reload` after every `git reset`, a config change delivered via git would silently never take effect until something else happened to restart the container. |
| Why certbot needs `--entrypoint ""` for one-shot commands | `docker-compose.prod.yml` gives the `certbot` service a permanent renew-loop `entrypoint` (`while :; do certbot renew ...; done`) so the long-running service auto-renews. Running `docker compose run certbot certonly ...` without overriding that entrypoint passes `certonly ...` as ignored arguments to the loop script, not to `certbot` itself — the container just sits in the loop forever, never issuing anything (confirmed live: it hung for 20 minutes with no output). `--entrypoint ""` bypasses the loop for that one invocation only; the long-running `certbot` service (started by `up -d`) is unaffected and keeps auto-renewing normally. |
| Image tagging / rollback | Every build is tagged with its short git SHA **and** `latest`. `IMAGE_TAG` in the server's `.env` pins which SHA `docker-compose.prod.yml` actually runs. To roll back: edit `IMAGE_TAG` in `.env` to a previous SHA, then `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d` (no rebuild, no migration re-run needed for a same-schema rollback). |
| Why `IMAGE_TAG`, not just `latest` | `latest` always points at the newest build, which makes rollback (step above) impossible — you'd need a new build to "roll back". A SHA-pinned tag lets `.env` alone decide what's running. |
| Deploy source is `develop`, not `main` | The 18-PR feature-branch chain is reviewed at the maintainer's own pace; `develop` is a separate, always-deployable branch (currently at the same tip) so production isn't blocked on that review. |
| Runner image ships full node_modules (pruned) | `.next/standalone`'s own traced `node_modules` is enough to run `node server.js`, but not enough to run `npm run db:migrate` (`drizzle-kit`) or `db:sync-search` (`tsx`) — both devDependencies. The image instead prunes the full install to production-only, then re-adds just `drizzle-kit`+`tsx` via `npm install` (correct transitive resolution, not manual folder copying) so one image covers both the running app and its one-shot maintenance commands. See `Dockerfile` comments. |
| `content/`, `drizzle/`, `scripts/` shipped as source in the image | MDX articles and the sync-search script are read via `fs` at runtime/script time, not through an `import` graph — Next's output tracing (`.next/standalone`) does not pick these up automatically, so the `Dockerfile` copies them explicitly. |
| Secrets | Read from the server-side `.env` file only (`env_file:` in `docker-compose.prod.yml`), never baked into the image. The build stage needs none of them — see the `Dockerfile`'s builder-stage comment. |
| nginx does not set security headers | The Next.js app already sets the full header set, including CSP, on every response (`shared/config/security-headers.ts`, ADR-0007). nginx only proxies/redirects — duplicating or re-setting headers there risks silently conflicting with the app's policy. |

### Env file template (server-side only, never committed)

Create this at `/opt/valenciafullstack/.env`. `POSTGRES_*` and the matching
`DATABASE_URL` must agree — `DATABASE_URL` points at the compose service
name `postgres`, not `localhost`.

**Leave every optional variable commented out (or absent) unless you have
a real value.** `docker-compose.prod.yml`'s `env_file: .env` sets an
env var to an **empty string** for any uncommented-but-blank line
(`RESEND_API_KEY=` with nothing after `=`) — that is different from the
variable being *absent*. `shared/config/env.ts`'s Zod schema treats
"present but empty" as a validation failure (`.min(1)`/`.email()` both
reject `""`), not as "optional and unset" — confirmed live: `db:sync-search`
failed against exactly this shape until the blank lines were deleted from
the server's `.env`. Only a genuinely *missing* line degrades gracefully.

```bash
# --- app secrets (see shared/config/env.ts) — REQUIRED, fail-fast if missing ---
DATABASE_URL=postgres://portfolio:REPLACE_WITH_A_STRONG_PASSWORD@postgres:5432/portfolio
VISITOR_HASH_SECRET=REPLACE_WITH_OUTPUT_OF__openssl_rand_-hex_32

# --- optional, degrade gracefully when ABSENT (see contact/github-activity
#     specs) — keep these commented out unless you have a real value. An
#     uncommented-but-empty line (e.g. `RESEND_API_KEY=`) is NOT the same
#     as an absent one and WILL fail env validation (see note above).
# RESEND_API_KEY=replace-with-a-real-resend-api-key
EMAIL_DRIVER=resend
# CONTACT_EMAIL_TO=replace-with-a-real-destination-address
CONTACT_EMAIL_FROM=Portfolio Contact <onboarding@resend.dev>
# GITHUB_TOKEN=replace-with-a-real-fine-grained-read-only-PAT

# --- build-safe public env (shared/config/env.public.ts) ---
NEXT_PUBLIC_SITE_URL=https://valenciafullstack.tech

# --- postgres container (must match DATABASE_URL above) ---
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=REPLACE_WITH_A_STRONG_PASSWORD
POSTGRES_DB=portfolio

# --- which image tag docker-compose.prod.yml runs (deploy.yml updates this) ---
IMAGE_TAG=latest
```

### Required GitHub repo secrets

Not created by this change — a maintainer creates these once, using a
dedicated CI-only SSH keypair (never a personal key):

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Server IP or hostname |
| `VPS_USER` | The non-root `deploy` user (never `root`) |
| `VPS_SSH_KEY` | Private half of a CI-only keypair, authorized for `VPS_USER` on the server |

## Checklist

- [ ] Server hardened (ufw 22/80/443, fail2ban, non-root `deploy` user, Docker Engine installed) — separate ops runbook, prerequisite
- [ ] `/opt/valenciafullstack` cloned, `develop` checked out, `.env` created from the template above (optional vars left commented out, not blank)
- [ ] Fresh-server only: local, uncommitted `default.conf` bootstrap swap in place, stack up with `docker compose -f docker-compose.prod.yml up -d`
- [ ] DNS A records for `valenciafullstack.tech` and `www` point at the server, propagated
- [ ] Certificate issued (`certbot ... certonly` with `--entrypoint ""`) into the `certbot-certs` volume
- [ ] TLS cutover complete: local bootstrap swap discarded, `default.ssl.conf` active, nginx reloaded (either manually or via the next `develop` deploy)
- [ ] `https://valenciafullstack.tech` loads, HTTP redirects to HTTPS
- [ ] `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` repo secrets created
- [ ] A push to `develop` triggers `.github/workflows/deploy.yml`, rolls the server forward, and reloads nginx automatically

## Next step

Push to `develop` to trigger the first automated deploy, then merge the
reviewed PR chain into `main` at the maintainer's own pace — `main` stays
the reviewed history; `develop` stays the deploy source (see
[design.md](../openspec/changes/portfolio-site/design.md#deployment)).
