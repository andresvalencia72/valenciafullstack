# Production deployment — valenciafullstack.com

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

3. Start everything **without TLS first** — `default.conf` (the bootstrap
   nginx config already in the repo) serves plain HTTP, which is required
   because no certificate exists yet:

   ```bash
   cd /opt/valenciafullstack
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   docker compose -f docker-compose.prod.yml run --rm app npm run db:migrate
   docker compose -f docker-compose.prod.yml run --rm app npm run db:sync-search
   ```

4. **Point DNS**: create an A record for `valenciafullstack.com` (and `www`)
   at the server's IP. Wait for propagation (`dig valenciafullstack.com`
   resolves correctly) before the next step — Let's Encrypt's HTTP-01
   challenge will fail otherwise.

5. **TLS bootstrap** (manual, one-time — see [Details](#details) for why
   this can't be automated on first boot):

   ```bash
   docker compose -f docker-compose.prod.yml run --rm certbot certonly \
     --webroot -w /var/www/certbot \
     -d valenciafullstack.com -d www.valenciafullstack.com \
     --email <your-email> --agree-tos --no-eff-email

   mv infra/nginx/conf.d/default.ssl.conf.disabled infra/nginx/conf.d/default.ssl.conf
   rm infra/nginx/conf.d/default.conf
   git add -A && git commit -m "chore(infra): enable TLS nginx config"
   docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
   ```

6. **Verify**: `https://valenciafullstack.com` loads over HTTPS, redirects
   `http://` to `https://`, and the `certbot` service is running (it
   renews automatically from here on — no further manual steps).

Every deploy after this point is automatic: push to `develop` →
`.github/workflows/deploy.yml` builds, pushes to GHCR, and rolls the server
forward.

## Details

| Topic | Decision |
|-------|----------|
| Builds never run on the server | The VPS has 4GB RAM — GH-hosted runners build the image; the server only `docker compose pull`s the finished image. |
| No host ports on `app`/`postgres` | Docker writes its own iptables rules and **bypasses ufw** for anything under `ports:`. Only `nginx` publishes 80/443 (the ports ufw allows); `app`/`postgres` use `expose:` — reachable from `nginx`/each other over the compose network only, never from the internet directly. |
| Why TLS can't be part of first boot | `default.ssl.conf` references certificate files at `/etc/letsencrypt/live/valenciafullstack.com/...` that don't exist until certbot issues them — nginx refuses to start with a `ssl_certificate` pointing at a missing file. `default.conf` (HTTP-only) is the bootstrap default specifically so nginx can start, serve the ACME challenge, and let certbot obtain the first certificate; then the TLS bootstrap step (above) swaps configs and reloads. |
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

```bash
# --- app secrets (see shared/config/env.ts) ---
DATABASE_URL=postgres://portfolio:REPLACE_WITH_A_STRONG_PASSWORD@postgres:5432/portfolio
VISITOR_HASH_SECRET=REPLACE_WITH_OUTPUT_OF__openssl_rand_-hex_32

# --- optional, degrade gracefully when absent (see contact/github-activity specs) ---
RESEND_API_KEY=
EMAIL_DRIVER=resend
CONTACT_EMAIL_TO=
CONTACT_EMAIL_FROM=Portfolio Contact <onboarding@resend.dev>
GITHUB_TOKEN=

# --- build-safe public env (shared/config/env.public.ts) ---
NEXT_PUBLIC_SITE_URL=https://valenciafullstack.com

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
- [ ] `/opt/valenciafullstack` cloned, `develop` checked out, `.env` created from the template above
- [ ] `docker compose -f docker-compose.prod.yml up -d` running with `default.conf` (HTTP-only bootstrap)
- [ ] DNS A records for `valenciafullstack.com` and `www` point at the server, propagated
- [ ] TLS bootstrap complete: `default.ssl.conf` active, `default.conf` removed, nginx reloaded
- [ ] `https://valenciafullstack.com` loads, HTTP redirects to HTTPS
- [ ] `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` repo secrets created
- [ ] A push to `develop` triggers `.github/workflows/deploy.yml` and rolls the server forward automatically

## Next step

Push to `develop` to trigger the first automated deploy, then merge the
reviewed PR chain into `main` at the maintainer's own pace — `main` stays
the reviewed history; `develop` stays the deploy source (see
[design.md](../openspec/changes/portfolio-site/design.md#deployment)).
