# OPERATIONS runbook — self-hosted VPS (lane L4)

> Audience: a senior mobile engineer new to servers. Follow top to bottom the
> first time; afterwards use sections 8–12 as a reference.
> All infra lives in `platform/infra/`:
> `docker-compose.prod.yml` (non-Coolify reference) · `caddy/` (HTTPS proxy) ·
> `monitoring/` (uptime/metrics/logs) · `backup/` (nightly encrypted dumps) ·
> `server/harden.sh` (firewall + hardening).

What runs where (one Contabo Cloud VPS 10: 4 vCPU shared, 8 GB RAM, 75 GB
NVMe, Ubuntu 24.04):

```
Visitors -> Cloudflare (DNS proxy, free) -> Caddy :80/:443 (TLS, rate limits)
  -> web (Next.js :3000, internal) -> api (NestJS :3001, internal)
  -> postgres 17 (internal Docker network ONLY, no published port)
Sidecars: Uptime Kuma :3002, Beszel :8090, Dozzle :8080 (all 127.0.0.1 only)
Nightly: pg_dump -> gzip -> age-encrypt -> S3-compatible storage (02:30 Africa/Cairo)
```

Memory budget (8 GB): OS ~0.5 + api ~1 + web ~0.5 + Postgres shared 1 GB +
Caddy ~0.1 + monitoring capped at ~0.6 (enforced via
`deploy.resources.limits` in the monitoring compose). Rest is page cache and
headroom. If RAM > 85% persistently, the fix is a bigger VPS, not tuning.

---

## 1. Buy the VPS and log in the first time

1. Buy Contabo Cloud VPS 10 (EU region is fine), Ubuntu 24.04, 8 GB RAM plan.
   Save the root password Contabo emails you — you will stop using it in step 2.
2. From your laptop, generate a key if you lack one, then log in:
   `ssh-keygen -t ed25519` (once ever)
   `ssh root@<server-ip>` (accept the fingerprint, paste the Contabo password)
3. Copy this repo onto the server (pick one):
   `git clone <your-repo-url> /opt/invitation-platform` (recommended), or
   `scp -r platform root@<server-ip>:/opt/invitation-platform/` for a test.

## 2. Harden the server (do this BEFORE anything else listens on the network)

1. `cd /opt/invitation-platform`
2. `NEW_USER=owner SSH_PUBKEY="$(cat ~/.ssh/id_ed25519.pub)" sudo -E bash platform/infra/server/harden.sh`
   - Creates `owner` (sudo), installs your key, switches sshd to key-only +
     no-root-login, enables ufw (SSH + 80/443 open), fail2ban for sshd,
     automatic security updates, 2 GB swap, Docker log rotation
     (10 MB x 3 files/container), timezone Africa/Cairo + time sync.
   - The script is idempotent: re-run it any time; it prints every action.
   - It REFUSES to disable password login unless your key is installed — if it
     aborts, you passed no key. That refusal is what keeps you from lockout.
3. KEEP the current root terminal open. In a SECOND terminal verify:
   `ssh owner@<server-ip>`
   Only then continue using `owner` (root login is now disabled).
4. Optional hardening later (re-run the same script with these env vars):
   - Custom SSH port: `SSH_PORT=2222` (port 22 stays open until you confirm the
     new port, then `sudo ufw delete allow 22/tcp`).
   - Restrict SSH to your IP: `ADMIN_IP=<your-home-or-office-ip>` (use a CIDR
     if your ISP rotates addresses, or you will lock yourself out).
   - Cloudflare-only web traffic: only after section 6 works (step 6.5).

## 3. Install Coolify (the recommended path)

1. `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`
   (Official installer per Coolify docs; takes ~5 minutes.)
2. Open `http://<server-ip>:8000`, create the admin account, turn on 2FA
   immediately (Settings -> Security). Coolify is now your deploy panel.
3. In Coolify, create one Project (e.g. `invitations`) with three resources:
   Postgres 17 + the api + the web (steps 4–5).

## 4. Postgres: Coolify way (recommended) OR compose way (reference)

**4A. Coolify (recommended).** In your project: New Resource -> Database ->
PostgreSQL 17. Set a 32+ char password (`openssl rand -base64 32`), do NOT
enable any public port / public access — Coolify keeps it on its internal
network, which is exactly what we want. Note the internal hostname Coolify
assigns (it looks like `postgres-xyz`); your `DATABASE_URL` becomes:
`postgresql://postgres:<password>@<coolify-hostname>:5432/postgres`

**4B. Without Coolify (reference stack).** Uses
`platform/infra/docker-compose.prod.yml` (postgres has no published port and
lives on an `internal: true` network with the api only):
1. `cp platform/infra/.env.prod.example platform/infra/.env.prod && nano platform/infra/.env.prod`
   Fill in POSTGRES_PASSWORD, DOMAIN, API_DOMAIN, ACME_EMAIL + the app keys
   (the file points at `apps/api/.env.example` and `apps/web/.env.example`).
2. `docker compose -f platform/infra/docker-compose.prod.yml --env-file platform/infra/.env.prod up -d --build`
3. `docker compose -f platform/infra/docker-compose.prod.yml logs postgres`
   and wait for `database system is ready to accept connections`.

## 5. Apply the database migrations (provided by lane W0)

Lane W0 provides `platform/supabase/migrations/0000_selfhost_bootstrap.sql`
(roles `anon`/`authenticated`/`service_role`, login role `app_api`, the
`auth` schema shim) plus `scripts/db-apply.sh`, which runs every migration in
order against `DATABASE_URL`. You only run it — do not edit it:

1. `export DATABASE_URL='postgresql://app:<password>@<internal-host>:5432/app'`
   (Coolify: copy the connection string from the Postgres resource page.
   Compose path: it is already in `platform/infra/.env.prod`.)
2. `bash platform/scripts/db-apply.sh` (exact name/path per lane W0; if it
   differs after integration, the W0 README in that folder wins).
3. Sanity: `psql "$DATABASE_URL" -c '\dt'` shows the app tables
   (`profiles`, `orders`, `invitations`, ...).

## 6. Deploy api + web, then Cloudflare

**Coolify path.**
1. api: New -> Application -> this Git repo -> `platform/apps/api` as base,
   build from `platform/apps/api/Dockerfile` (build context = `platform/`).
   Port 3001, internal only. Paste ALL api env vars from
   `platform/apps/api/.env.example` (PORT, NODE_ENV=production, WEB_ORIGINS,
   DATABASE_URL from step 5, THROTTLE_*, PAYMENTS_*, secrets, ...).
2. web: same repo, framework preset Nixpacks/Node, port 3000. Env from
   `platform/apps/web/.env.example` + `API_BASE_URL=http(s)://<api-internal>`.
3. Domains: attach `example.com` to web and `api.example.com` to api inside
   Coolify (it provisions TLS). Health: `https://api.example.com/v1/health`.

**Compose path.** The same `.env.prod` from 4B already wires everything; Caddy
terminates TLS and proxies `{$DOMAIN}` -> web:3000, `{$API_DOMAIN}` -> api:3001
with per-IP limits (100/min general, 10/min on `/v1/auth/*`, 60/min on
`/v1/public/*`). After `up -d`, validate any Caddyfile edit with:
`docker compose -f platform/infra/docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile`

**Cloudflare (both paths, strongly recommended).**
1. Add the domain to Cloudflare free; point A records for `@` and `api` at
   `<server-ip>` with proxy ON (orange cloud).
2. SSL/TLS -> **Full (strict)**. Enable Bot Fight Mode. Add two free WAF/rate
   rules: block requests with bad reputation to `/v1/auth/*`, and challenge
   > 20 requests/10s to `/v1/public/*` (names/values per current dashboard).
3. Wait for the site to load over HTTPS through Cloudflare, then lock the
   origin: `CLOUDFLARE_ONLY=1 sudo -E bash platform/infra/server/harden.sh`
   (firewall now allows 80/443 only from Cloudflare ranges). Re-run is safe.
   Compose path: install the Origin Certificate (6.4) BEFORE this step.

### 6.4 Cloudflare Origin Certificate (compose path — do this BEFORE the lock step)

Skip this on the Coolify path (Coolify provisions public TLS itself). On the
compose path it is REQUIRED as soon as step 3 above locks the firewall: ACME
HTTP-01 challenges come over plain HTTP from non-Cloudflare IPs, so Caddy can
no longer renew public certificates — the Origin CA cert (which Cloudflare
trusts) replaces ACME instead.

SAFE ORDER (never lock yourself out of HTTPS):
`auto` TLS works -> install origin cert -> switch to `cloudflare-origin` ->
verify HTTPS still works -> ONLY THEN run harden.sh with CLOUDFLARE_ONLY=1.

1. Cloudflare dashboard -> SSL/TLS -> Origin Server -> Create Certificate:
   - Generate private key and CSR with Cloudflare; key type RSA or ECDSA
     (either works with Caddy); validity **15 years** (maximum, fewer renewals).
   - Hostnames: `example.com` **and** `*.example.com` (covers `api.example.com`
     and any future subdomain; replace with your real domain).
2. Copy the two PEM blocks into files on the SERVER (never into git):
   `platform/infra/caddy/certs/origin.pem` (certificate) and
   `platform/infra/caddy/certs/origin-key.pem` (private key), then
   `chmod 600 platform/infra/caddy/certs/*.pem`.
   (`*.pem`/`*.key` are git-ignored; `git status` must never show them.)
3. In `platform/infra/.env.prod` set `CADDY_TLS_MODE=cloudflare-origin`
   (keep `CADDY_ORIGIN_CERTS_DIR=./caddy/certs` unless you moved the dir).
4. Recreate Caddy so the entrypoint renders the origin-`tls` config:
   `docker compose -f platform/infra/docker-compose.prod.yml --env-file platform/infra/.env.prod up -d caddy`
5. Verify (still BEFORE locking the firewall): `curl -v https://example.com`
   and `curl https://api.example.com/v1/health` load fine, and
   `docker compose ... logs caddy` shows no TLS errors.
   To double-check the rendered config:
   `docker compose -f platform/infra/docker-compose.prod.yml exec caddy caddy validate --config /tmp/Caddyfile`
   (in origin mode the live config is the rendered `/tmp/Caddyfile`; in
   `auto` mode validate `/etc/caddy/Caddyfile` as usual).
6. Update the API's real-IP setting: with the Cloudflare proxy ON, Caddy now
   sees Cloudflare edge IPs, so set `TRUST_PROXY=cloudflare` in `.env.prod`
   and restart the api
   (`docker compose ... up -d api`). With the proxy OFF (direct to Caddy),
   keep `TRUST_PROXY=1`. Never `true`.
7. NOW lock the origin (step 3 above): confirm Full (strict) is on in Cloudflare,
   then `CLOUDFLARE_ONLY=1 sudo -E bash platform/infra/server/harden.sh`.
   Re-verify both URLs afterwards — if anything fails, the firewall (not the
   cert) is the first suspect; re-running harden.sh without CLOUDFLARE_ONLY
   re-opens 80/443 while you debug.

Renewal: the origin cert lasts up to 15 years — put a calendar reminder for
year 14. If you ever switch back to `auto`, Caddy resumes ACME on its own
(only possible while the firewall still admits HTTP-01).

## 7. Monitoring: start it, then create these 6 alerts

1. Start: `docker compose -f platform/infra/monitoring/docker-compose.monitoring.yml --env-file platform/infra/.env.prod up -d`
2. Open tunnels from your laptop. Every UI binds to 127.0.0.1 on the server
   (see `platform/infra/monitoring/docker-compose.monitoring.yml`) — none is
   ever reachable from the network. One command opens all three, or run just
   the line you need:
   `ssh -L 3002:localhost:3002 -L 8090:localhost:8090 -L 8080:localhost:8080 owner@<server-ip>`
   - Uptime Kuma only: `ssh -L 3002:localhost:3002 owner@<server-ip>`
     then browse `http://localhost:3002`
   - Beszel hub only: `ssh -L 8090:localhost:8090 owner@<server-ip>`
     then browse `http://localhost:8090`
   - Dozzle only: `ssh -L 8080:localhost:8080 owner@<server-ip>`
     then browse `http://localhost:8080`
   Keep the ssh session open while you use the UI; closing it closes the tunnel.
3. Beszel: add a system in the hub UI, copy its KEY into `BESZEL_KEY` in
   `.env.prod`, restart just the agent:
   `docker compose -f platform/infra/monitoring/docker-compose.monitoring.yml --env-file platform/infra/.env.prod up -d beszel-agent`
4. Kuma first login creates the admin account — use a strong password + 2FA.
5. Create these monitors (all with Telegram and/or email notification):
   1. HTTPS `https://api.example.com/v1/health` (keyword: `"ok"`), 60s —
      "API health down".
   2. HTTPS `https://example.com`, 60s — "web down".
   3. TLS-expiry monitor on both domains, alert at < 14 days.
   4. Beszel alerts: disk > 80%, RAM > 85% for 5 minutes.
   5. Push monitor for backups: copy its URL into `KUMA_PUSH_URL`; alert when
      no push for > 26 h (covers a missed 02:30 run + daylight-saving shifts).
   (Alternative to tunnels: expose the three UIs behind Caddy basic-auth on
   `admin.example.com` — uncomment that block in `platform/infra/caddy/Caddyfile`,
   set ADMIN_DOMAIN + hash in `.env.prod`, add the caddy `extra_hosts` lines.)
6. Dozzle needs no setup: pick a container, read logs. It talks to Docker
   through `socket-proxy` with all mutating API calls blocked (`POST=0`).

## 8. Backups + monthly restore drill

1. Tools on the server (once): `sudo apt-get install -y age rclone cron`
   (or systemd only — no cron needed for the timer path), then
   `rclone config` (create your S3 remote, e.g. Contabo Object Storage / B2),
   `age-keygen -o ~/.age-key.txt` (private key — NEVER leaves the server
   except into your password manager), public key into `AGE_PUBLIC_KEY`.
2. Nightly job — pick ONE:
   - cron: copy `platform/infra/backup/backup.cron.example` into `crontab -e`
     (02:30 Africa/Cairo), fixing the absolute path to your checkout.
   - systemd (preferred): copy `backup.service.example` + `backup.timer.example`
     to `/etc/systemd/system/invitation-backup.{service,timer}`, edit the paths,
     `sudo systemctl enable --now invitation-backup.timer`.
3. What a run does: `pg_dump -Fc` from the live container -> gzip ->
   `age`-encrypt -> `rclone sync` to `$RCLONE_REMOTE` (remote mirrors the local
   7-daily/4-weekly/3-monthly retention) -> pings the Kuma push monitor ONLY on
   success. Failures exit non-zero and do NOT ping, so Kuma pages you at 26 h.
4. Monthly drill (put a calendar reminder): `bash platform/infra/backup/restore-drill.sh`
   restores the latest backup into a throwaway `drill_*` database, prints row
   counts for `profiles`/`orders`/`invitations`, drops it, prints PASS/FAIL.
   A backup you never restored is a backup you do not have.
5. Real restore: `AGE_IDENTITY_FILE=~/.age-key.txt bash platform/infra/backup/restore.sh <file-or-remote-path> [new-db]`
   — restores into a NEW database by default; overwriting the live DB requires
   the literal `--force` flag.

## 9. Upgrading (app + server)

1. App: `git pull` (Coolify: redeploy the changed service; compose:
   `docker compose -f platform/infra/docker-compose.prod.yml --env-file platform/infra/.env.prod up -d --build api web`),
   then re-run `bash platform/scripts/db-apply.sh` (migrations are additive;
   deploy BEFORE migrating only if the release notes say so).
2. Images monthly: `docker compose ... pull` (compose path) + rebuild Caddy
   every few months to pick up Go/security fixes (`--build caddy`).
3. Server: automatic security updates are on; run
   `sudo apt-get update && sudo apt-get upgrade` by hand monthly and reboot if
   `/var/run/reboot-required` exists (do it 03:30, after backups).

## 10. Where the logs are

- App logs: `docker logs <container>` (Coolify: resource -> Logs tab), or
  Dozzle (`:8080` via tunnel) for all containers in one view. Container logs
  rotate at 10 MB x 3 (set by harden.sh); Postgres also logs slow queries
  (> 1 s) and connections into its container log.
- Backup/cron: `/var/log/invitation-backup.log`, or
  `journalctl -u invitation-backup -e` for the systemd timer.
- Firewall/auth: `sudo ufw status`, `sudo fail2ban-client status sshd`,
  `sudo journalctl -u ssh`.

## 11. Incident checklist

- **Site down.** 1) `curl -vk https://api.example.com/v1/health` from laptop
  (TLS or app?). 2) On server: `docker ps` (all up?), `docker logs` api/web,
  `df -h` (disk full kills Postgres first — section below). 3) If only via
  Cloudflare fails: DNS proxy / SSL mode changed? Pause Cloudflare (DNS-only)
  to test origin directly.
- **DB full (disk > 80% page, or writes failing).** `df -h`; `docker exec -it
  <postgres> psql -U app -c "SELECT pg_size_pretty(pg_database_size('app'));"`;
  prune Docker (`docker system prune -a --volumes` CAREFULLY — never the
  `pgdata` volume), expand/attach Contabo storage, then restore-drill to prove
  the backup chain before celebrating.
- **Suspected attack (credential stuffing, scraping flood, DDoS).**
  1) Cloudflare dashboard -> "Under Attack" mode ON.
  2) Check Caddy + api logs for the top IPs/endpoints; confirm the
     `/v1/auth/*` 10/min limit is biting (429s in api logs).
  3) If SSH is targeted: `sudo fail2ban-client status sshd` (bans are
     automatic); consider setting ADMIN_IP and re-running harden.sh.
  4) Rotate any credential that may have leaked (DB password = also update
     `DATABASE_URL` + restart api; age key; EasyConfirm key), then write down
     what happened for next time.
- **Backup push missing (> 26 h alert).** `journalctl -u invitation-backup -e`
  or `/var/log/invitation-backup.log`; common causes: rclone remote expired
  credentials, disk full in BACKUP_DIR, Postgres container renamed
  (fix POSTGRES_CONTAINER). Fix, run backup.sh by hand, watch Kuma go green.
