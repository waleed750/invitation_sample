# DEPLOYMENT — first production deploy of the self-hosted stack

> Audience: a senior mobile engineer new to servers. Copy-paste top to bottom;
> every command shows the directory it runs in. There is **no Supabase** in
> this stack: Postgres 17 runs on your VPS (Coolify or compose), login is
> Better Auth inside the API, payments start as **manual** (admin confirms).
> Day-to-day running (monitoring, backups, incidents) lives in
> [OPERATIONS.md](./OPERATIONS.md); the why behind the architecture is in
> [SELF_HOSTED_PLAN.md](./SELF_HOSTED_PLAN.md).
>
> Replace `example.com` / `api.example.com` / `<server-ip>` with your real
> values throughout. Generate every secret with `openssl rand -base64 32`.

## 0. What you need before starting

- A domain you control (apex + `api` subdomain), pointed at Cloudflare
  (free plan, proxy ON) — see [OPERATIONS.md](./OPERATIONS.md) section 6.
- An SMTP sender for one-time-code emails (step 7) and a Google OAuth client
  (step 8, optional). Phone login stays OFF until a WhatsApp/SMS sender exists.
- The EasyConfirm questions (step 10) can wait until after launch — manual
  payments work without them.

## 1. Buy and harden the VPS

Follow [OPERATIONS.md](./OPERATIONS.md) sections 1–3 (buy Contabo Cloud
VPS 10, Ubuntu 24.04, 8 GB; run `platform/infra/server/harden.sh`;
install Coolify if you take the Coolify path below). Do not skip hardening:
after it, SSH is key-only and the firewall is up. Keep the first root
terminal open until `ssh owner@<server-ip>` works from a second terminal.

## 2. Deploy Postgres (pick ONE path)

**Path A — Coolify (recommended).** New Resource → Database → PostgreSQL 17.
Set a 32+ char password (`openssl rand -base64 32`), do NOT enable any public
port. Note the internal hostname Coolify assigns (e.g. `postgres-xyz`); the
owner connection string is
`postgresql://postgres:<password>@<coolify-hostname>:5432/postgres`.

**Path B — compose reference stack.**

```bash
# on the server, from the repo root (/opt/invitation-platform)
cp platform/infra/.env.prod.example platform/infra/.env.prod
nano platform/infra/.env.prod   # fill POSTGRES_*, DOMAIN, API_DOMAIN, ACME_EMAIL + app keys
docker compose -f platform/infra/docker-compose.prod.yml --env-file platform/infra/.env.prod up -d --build postgres
docker compose -f platform/infra/docker-compose.prod.yml logs postgres  # wait for "ready to accept connections"
```

Postgres never gets a published port on either path — it lives on an
internal network with the API only.

## 3. Create the `app_api` password

Migration `0000` creates the login role `app_api` **with no password**
([0000_selfhost_bootstrap.sql](../supabase/migrations/0000_selfhost_bootstrap.sql)).
Set one now, as the superuser/owner (path A: Coolify → Postgres resource →
console; path B: on the server):

```sql
-- connected as the owner/superuser:
alter role app_api with password '<the-app-api-password-you-generated>';
```

Compose path, copy-pasteable:

```bash
# on the server, from the repo root
docker compose -f platform/infra/docker-compose.prod.yml exec postgres \
  psql -U postgres -c "alter role app_api with password '<app-api-password>';"
```

Your API connection string is then
`postgresql://app_api:<app-api-password>@<internal-host>:5432/postgres`
(compose: host `postgres`; Coolify: the internal hostname from step 2).
Put it in `DATABASE_URL` (step 5). Nobody else ever uses this password.

## 4. Apply the migrations

[db-apply.sh](../scripts/db-apply.sh) runs every file in
`platform/supabase/migrations/` in order against an **owner/superuser**
connection and records progress, so re-runs are safe. It needs
`DATABASE_URL_ADMIN` (owner string from step 2 — NOT the app_api one):

```bash
# from the repo root (server or any machine that can reach Postgres)
DATABASE_URL_ADMIN='postgresql://postgres:<owner-password>@<internal-host>:5432/postgres' \
  bash platform/scripts/db-apply.sh
# sanity:
psql "$DATABASE_URL_ADMIN" -c '\dt'   # expect profiles, orders, invitations, ...
```

## 5. API environment

Full contract: [apps/api/.env.example](../apps/api/.env.example). The API
refuses to boot on any invalid value (fail-fast, readable error). Production
must use `PAYMENTS_PROVIDER=manual` (`mock`/`fawry` are rejected in production).

| Var | Required? | Example | Notes |
|---|---|---|---|
| `PORT` | no (3001) | `3001` | internal port; Caddy/Coolify proxy to it |
| `NODE_ENV` | no, set it | `production` | enables prod-only guards |
| `WEB_ORIGINS` | **yes** | `https://example.com` | comma-separated browser origins, strict CORS |
| `DATABASE_URL` | **yes** | `postgresql://app_api:…@postgres:5432/postgres` | the app_api string from step 3 |
| `DATABASE_POOL_MAX` | no (10) | `10` | one API instance needs few; raise only with replicas |
| `DATABASE_STATEMENT_TIMEOUT_MS` | no (5000) | `5000` | per-query kill switch |
| `BETTER_AUTH_SECRET` | **yes**, 32+ chars | `openssl rand -base64 32` | signs sessions/cookies; rotate = log everyone out |
| `BETTER_AUTH_URL` | **yes** | `https://api.example.com` | public API origin; OAuth callbacks derive from it |
| `AUTH_COOKIE_DOMAIN` | no, set it | `.example.com` | leading dot shares the session cookie across apex + api |
| `PHONE_LOGIN_ENABLED` | no (`false`) | `false` | keep OFF until a WhatsApp/SMS sender exists |
| `OTP_DAILY_CAP` | no (500) | `500` | global daily code-send cap (toll-fraud brake) |
| `SMTP_HOST` | **yes** | `smtp.resend.com` | any provider; self-sent mail from a VPS IP lands in spam |
| `SMTP_PORT` | **yes** | `587` | usually 587 (STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | **yes** | (provider creds) | server-only secrets |
| `SMTP_FROM` | **yes** | `noreply@example.com` | must be a sender your provider allows |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | (empty) | unset = Google login button hidden (step 8) |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | no (60000/100) | `60000` / `100` | app-layer rate limit; mirrors Caddy's 100/min |
| `BODY_LIMIT_KB` | no (100) | `100` | max JSON/urlencoded body |
| `TRUST_PROXY` | no, set it | `1` or `cloudflare` | `1` = directly behind Caddy only; `cloudflare` = behind Cloudflare+Caddy (honours `CF-Connecting-IP`); never `true` |
| `PAYMENTS_PROVIDER` | no, set it | `manual` | **production must be `manual`** |
| `MANUAL_PAYMENT_INSTRUCTIONS_JSON` | no, set it | `{"methods":[{"id":"instapay","label":{"ar":"…","en":"…"},"details":{"ar":"…","en":"…"}}]}` | shown after checkout; `id` ∈ instapay/wallet/bank |
| `PAYMENTS_MOCK_SECRET` | only for `mock` | (empty in prod) | leave unset with `manual` |
| `IP_HASH_SECRET` | **yes**, 32+ chars | `openssl rand -base64 32` | HMAC key for guest-IP hashing; raw IPs never stored |
| `WEB_REVALIDATE_URL` | no | `https://example.com/api/revalidate` | blank = revalidation disabled (logged only) |
| `REVALIDATE_SECRET` | iff above set, 32+ | `openssl rand -base64 32` | must equal the web value (step 6) |
| `SWAGGER_ENABLED` | no (`false`) | `false` | keep OFF in production (`/docs` exposure) |
| `LIFECYCLE_CRON_ENABLED` | no (`true`) | `true` | `false` pauses reminders/purge without a redeploy |
| `SENTRY_DSN` / `SENTRY_ENVIRONMENT` | no | (empty) | unset = Sentry disabled |
| `SUPABASE_*` | no, leave unset | (empty) | legacy, being removed; the API boots without them |
| `PAYMENT_EVENTS_SECRET` ⚠️ | no (until L3 lands) | `openssl rand -base64 32` | lane L3 (merging soon): HMAC secret for inbound payment webhooks; unset = webhook disabled |
| `EASYCONFIRM_API_KEY` ⚠️ | no (until L3 lands) | (vendor key) | lane L3: enablement prerequisite, NOT a signature substitute |
| `EASYCONFIRM_SIGNATURE_HEADER` / `EASYCONFIRM_TIMESTAMP_HEADER` ⚠️ | no (defaults shown) | `x-signature` / `x-timestamp` | lane L3: header names, confirm against vendor docs |

## 6. Web environment

Full contract: [apps/web/.env.example](../apps/web/.env.example).
Production must be API-backed (`mock`/`demo` data modes refuse to boot
unless explicitly allowed).

| Var | Required? | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | no, set it | `https://example.com` | absolute SEO/canonical URLs |
| `NEXT_PUBLIC_API_URL` | **yes** | `https://api.example.com` | browser → API origin |
| `API_BASE_URL` | **yes** | `http://api:3001` (compose) / `https://api.example.com` (Coolify) | server → API origin, no trailing path |
| `COMMERCE_MODE` | **yes** | `api` | never `mock` in production |
| `GUEST_MODE` | **yes** | `api` | never `demo` in production |
| `REVALIDATE_SECRET` | iff API sets it | (same 32+ char value as API) | verifies API revalidate calls; server-only |
| `NEXT_PUBLIC_GOOGLE_LOGIN` | no (`0`) | `0`→`1` after step 8 | shows the Google button |
| `NEXT_PUBLIC_PHONE_LOGIN` | no (`0`) | `0` | keep `0` until an SMS/WhatsApp sender exists |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | no, set it | `2010…` (digits only, no `+`) | support number on manual-pay pages |

## 7. Email sender (one-time codes)

Sign-in emails come from `SMTP_*` (step 5). Any provider with SMTP works
(Resend, Postmark, Brevo free tiers are fine). You need: host, port (587),
username, password/API-key-as-password, and a verified sender address for
`SMTP_FROM` (usually `noreply@<your-domain>`, which needs the provider's
domain verification — a few DNS TXT records). Test before launch:

1. Set the five `SMTP_*` vars, redeploy/restart the api.
2. Open `https://example.com/sign-in` (or your locale path), request a code
   for your own address → email arrives within a minute, code signs you in.
3. If nothing arrives: `docker logs <api>` (Coolify: Logs tab) shows the SMTP
   error; providers also show a suppressed/bounce log in their dashboard.

## 8. Google OAuth (optional)

1. Google Cloud console → APIs & Services → Credentials → Create OAuth client
   (Web application). Authorized redirect URI (exact):
   `https://api.example.com/v1/auth/callback/google`
   (Better Auth is mounted at `/v1/auth/*` — see
   `platform/apps/api/src/setup-app.ts` — so the social callback is
   `/v1/auth/callback/google` under your public API origin).
2. Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` on the api,
   `NEXT_PUBLIC_GOOGLE_LOGIN=1` on the web, redeploy both.
3. Smoke: the sign-in page shows Google; a test sign-in creates
   `auth.users` + `profiles` rows and lands on the dashboard.

## 9. Make yourself admin

Admin rights are granted by SQL only (no UI, no passwords). Sign in once
with your own email (creates your `profiles` row), then:

```sql
-- as the owner/superuser:
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Sign out and back in — the admin screens unlock. Repeat for each co-owner.

## 10. EasyConfirm (auto-confirm transfers — after launch is fine)

Manual payments work without this. When you are ready, ask EasyConfirm
support for ALL of the following (their public docs could not be found, and
our adapter is provisional until verified — give them this list verbatim):

1. Webhook registration: where do we register this URL?
   `https://api.example.com/v1/payment-events/easyconfirm`
2. Signing: algorithm + encoding of `x-signature`, the exact signed bytes,
   timestamp header name/units/replay window, and the roles of API key vs
   signing secret (we require BOTH `EASYCONFIRM_API_KEY` and a 32+ char
   `PAYMENT_EVENTS_SECRET`; a key alone never passes verification).
3. Payload field names: event/transaction id, amount + units (minor vs major),
   currency, sender identifier, note/reference text, transfer-status values,
   receipt timestamp + timezone.
4. Event-id uniqueness + retry semantics (we dedupe on the provider event id;
   DB errors return retryable 503, bad signatures a generic 401).
5. Whether a list/poll API exists for reconciliation of missed webhooks.
6. A real transfer confirming InstaPay/wallet support for piasters-level
   unique amounts (we identify some orders by exact amount, e.g. 1299.37).

Wire-up once answered: set `EASYCONFIRM_API_KEY` + `PAYMENT_EVENTS_SECRET`
(+ header names if non-default), restart the api, send a 1 EGP test transfer
with an `INV-XXXXXX` reference, and watch it auto-confirm in the admin queue.

## 11. Smoke test (do all of these before announcing)

| # | Command / action | Expected |
|---|---|---|
| 1 | `curl -s https://api.example.com/v1/health` | `200 {"ok":true,…}` (DB reachable, migrations current) |
| 2 | `curl -s -o /dev/null -w '%{http_code}' https://example.com` | `200` homepage through Cloudflare |
| 3 | `curl --resolve api.example.com:443:<server-ip> -s https://api.example.com/v1/health` | `200` — proves the ORIGIN cert answers directly (bypasses Cloudflare) |
| 4 | Request an email code, sign in | email arrives < 1 min; dashboard loads; session persists on refresh |
| 5 | As a customer: template → checkout → manual pay | order row is `pending` with the exact unique amount incl. piasters |
| 6 | As admin: confirm that order | order `paid`; invitation publishes; public link renders; guest RSVP works |
| 7 | `curl -X POST https://api.example.com/v1/payment-events/easyconfirm -d '{}'` | `401` generic (no valid signature, no info leaked) |
| 8 | `curl -H 'X-Forwarded-For: 1.2.3.9' -s https://api.example.com/v1/health` | `200`, and rate-limit counters are NOT poisoned by the spoofed header |
| 9 | Wrong OTP 5×, then resend 4× in 10 min | code locks; 4th send rejected (abuse caps hold) |
| 10 | `TRUST_PROXY` check: `docker logs <api> \| grep -i trust` on boot | no "invalid TRUST_PROXY" error; boot succeeds |

## 12. Backups (do this on day one, not "later")

Nightly encrypted `pg_dump` → off-server S3 storage, with a monthly restore
drill. Full setup: [OPERATIONS.md](./OPERATIONS.md) section 8
(`backup.sh` + cron/systemd + `rclone` + Kuma push monitor). Minimum viable
today: install the cron job, run `backup.sh` once by hand, confirm the file
lands in your bucket AND the Kuma push monitor goes green — then put the
monthly `restore-drill.sh` reminder in your calendar. A backup you never
restored is a backup you do not have.
