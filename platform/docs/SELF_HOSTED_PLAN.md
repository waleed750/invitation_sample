# Self-Hosted Launch Plan: Postgres on the VPS, own login, auto-confirmed payments

> Status: **v2 — agreed after the Claude ↔ Gemini debate, 2026-10-09.**
> Owner decisions: **no Supabase**. Everything runs on the owner's VPS. Login is by phone number or email (one-time code). Payments are confirmed automatically by **EasyConfirm** (API key), with a manual fallback.
> Readers: the owner, and the implementer agents (agy, opencode, Codex, Sonnet). Each lane below is written so that it can be handed to one agent as its own brief.

---

## 1. Goal for today and what "done" means

The goal is to finish today, with 4–6 agents working in parallel. "Done" means:

- **Code complete.** Every lane is merged to `main`, and the GitHub CI is green: code checks, plus the database job running against a **plain Postgres** container.
- **Ready to deploy.** The infra files, the monitoring set-up and the runbook exist, so the owner can deploy on the VPS by following them.
- **Not done today.** Anything needing the owner's accounts: the VPS itself, the domain, the EasyConfirm API key, the email or SMS sender, and the storage that backups are sent to. The code reads all of these from environment variables, and a "log only" fallback is used until they exist.

## 2. Target architecture

```
Internet ──► Cloudflare (free: DNS proxy, DDoS absorption, WAF, bot fight)   [recommended]
              │  only Cloudflare IPs may reach the VPS on 443
              ▼
VPS (Contabo, Ubuntu 24.04, Coolify)
  ├─ Caddy/Traefik (TLS, per-IP rate limits, real-IP from Cloudflare)
  ├─ web  (Next.js)          :3000  (internal)
  ├─ api  (NestJS + Better Auth at /v1/auth/*)  :3001 (internal)
  ├─ postgres 17             internal Docker network ONLY, never published
  ├─ monitoring: Uptime Kuma (uptime + alerts) + Beszel (CPU/RAM/disk) + Dozzle (logs)
  └─ backup job: pg_dump nightly → S3-compatible storage off the server   [later, scaffold now]
External: EasyConfirm → POST /v1/payments/easyconfirm/webhook (auto-confirms InstaPay transfers)
          SMTP provider (email codes) · WhatsApp/SMS sender (phone codes, later)
```

## 3. Key design decisions (the debate should challenge these)

### 3.1 Database access: no Supabase layers
- The driver is `postgres` (postgres.js), using **tagged-template queries only**, so values are always parameters.
- ESLint bans `sql.unsafe` and any string-built SQL. This is the main SQL-injection defence. Zod validation of every input stays.
- One `Db` service has three entry points. Only `*.repository.ts` files may use it; that ESLint rule already exists.
  - `Db.asUser(userId, role, fn)` opens a transaction, runs `set local role authenticated`, then `select set_config('request.jwt.claims', '{"sub":"<id>","role":"authenticated"}', true)`, then runs `fn`. Postgres RLS and `auth.uid()` keep working, and nothing leaks between pooled connections, because `set local` lasts only for that transaction.
  - `Db.asService(fn)` runs a transaction as the API's own role (bypasses RLS). It is used only in admin, webhook and job code. Methods using it end in `AsServiceRole`, as today.
  - `Db.asAnon(fn)` runs `set local role anon`. It is used for public reads.
- **Bootstrap migration `0000_selfhost_bootstrap.sql`** creates what Supabase used to provide, so migrations 0001–0014 run **unchanged** on plain Postgres:
  - Supabase's default privileges must be recreated BEFORE 0001 (grant usage on schema public + `alter default privileges ... grant all on tables, sequences, routines to anon, authenticated, service_role`).
  - the roles `anon`, `authenticated` and `service_role` (`service_role` is NOLOGIN BYPASSRLS), plus a login role `app_api` (`app_api` is LOGIN NOINHERIT and a member of the three roles);
  - schema `auth`;
  - a Supabase-compatible `auth.users` subset (`id, email, phone, raw_user_meta_data, raw_app_meta_data, created_at`), so the 0013 sign-up trigger keeps working;
  - `auth.uid()`, which reads `request.jwt.claims`.
- **Guard fix: a security bug found while planning.** `invitations_guard` and `profiles_guard` (0003) skip their checks when `current_user <> session_user`. Their comment assumes direct client writes have `current_user = session_user`. That is false whenever the server logs in as one role and then switches role: PostgREST's `authenticator` → `authenticated` on Supabase today, and `app_api` → `authenticated` in the new design. So the column guards never run in production. The API's own checks still hold, but the database's own protection does not. Gemini confirmed the bug and the fix.
  - **Fix in migration 0015:** skip the checks only when `current_user` is **not** `authenticated` or `anon` (that is, inside SECURITY DEFINER functions or service code). The `auth.uid() is null` bypass is removed too (anon must not bypass).
  - **Tests:** an authenticated direct `update invitations set status=…` must fail, and `publish_invitation()` must still succeed.

### 3.2 Login: Better Auth inside the API
- Better Auth is mounted in NestJS at `/v1/auth/*`, with:
  - **email one-time code** as the primary method today (the launch method);
  - **phone number one-time code**, through a `sendOTP` hook into an `OtpSender` port (`log` / `smtp` / `whatsapp` / `sms` adapters; only `log` and `smtp` are real today). This is built behind a feature flag and stays OFF until a WhatsApp/SMS sender exists.
  - **Google** as optional;
  - the **bearer plugin**, so a future mobile app can use tokens.
- NestJS's global JSON body parser must be bypassed for `/v1/auth/*` so Better Auth's handler can read the raw request body.
- Sessions live in Postgres. The browser carries an httpOnly cookie, scoped to the parent domain, so both `example.com` and `api.example.com` receive it. CSRF is covered by SameSite=Lax plus Better Auth's trusted-origins check.
- `AuthGuard` resolves the session, using a short cookie cache, to `{userId, role}`. `RolesGuard` stays as it is.
- When Better Auth creates a user, the API inserts into `auth.users`, and the 0013 trigger then creates `profiles`. Phones are stored in E.164 format.
- One-time code abuse controls:
  - a code is valid for 5 minutes and is stored only as a hash;
  - 5 wrong attempts lock that code;
  - at most 3 sends per phone or email per 10 minutes, and 10 per IP per hour;
  - a daily send cap, protecting against toll fraud.
- The web app drops `@supabase/ssr`. `getServerSession()` keeps its shape (`accessToken`, `userId`, ...), and Next.js server-side calls to the API must forward the incoming `cookie` header explicitly. Middleware only checks that the session cookie is present; real validation happens in the API.

### 3.3 Payments: EasyConfirm auto-confirmation with a manual fallback
- **EasyConfirm's public documentation could not be found.** The lane therefore builds a **provider-agnostic** inbound pipeline, plus an `easyconfirm` adapter that is finished once the owner shares the docs, the API key and the signing method.
- **New table `payment_events`** (migration 0016): provider, `external_id` (unique), amount_minor, currency, sender, reference_text, raw jsonb, received_at, status (`matched` / `unmatched` / `ambiguous` / `duplicate` / `rejected`), order_id.
- **Endpoint** `POST /v1/payments/:provider/webhook`. It verifies the provider signature or API key, rejects anything older than 5 minutes (replay protection), and inserts idempotently.
- **Matcher, in order:**
  1. The reference `INV-XXXXXX` appears in the transfer note: exact match. This stays the FIRST rule.
  2. Otherwise a **unique amount**. Each pending manual order gets 1–99 extra piasters at checkout (e.g. EGP 1,299.37), unique among open orders, so a transfer of that exact amount within the 72-hour window identifies the order. These unique-piaster allocations are released when a pending order expires or is rejected. "InstaPay accepting piasters is unverified — confirm with a real transfer before relying on it." The checkout wiring of the unique amount happens in the W3 integration step (L3 does not touch checkout files).
  3. Otherwise the event goes to the admin queue, with suggested orders.
- **Auto-confirm** happens only on an exact, unique, same-amount match. It runs a new SQL function, `system_confirm_payment(order_id, event_id)`, which is idempotent, attributes the action to `system:<provider>` in `audit_log`, and calls `fulfill_paid_order`.
- **Never auto-confirm** on amount mismatch, duplicates, or orders that are not pending or have expired.
- If EasyConfirm offers a list API, the daily/15-minute job also polls it, as a safety net for missed webhooks.

### 3.4 Security layers ("all attacks")

| Threat | Layer | Measure |
|---|---|---|
| DDoS (volumetric) | Edge | Cloudflare free proxy. The VPS firewall allows 80/443 only from Cloudflare IP ranges, and SSH only by key from the owner's IP. Contabo's own network protection is the last line. **A single VPS cannot absorb a volumetric attack by itself.** |
| DDoS (application) / brute force | Proxy + API | Caddy per-IP limits; NestJS throttler per route (exists), moving to a Postgres or Redis-backed store before running more than one copy; OTP limits (3.2); body-size limits. Add real client IP behind Caddy/Cloudflare (`TRUST_PROXY`) so rate limits key on the visitor, not the proxy. |
| SQL injection | API + DB | Tagged-template queries only; ESLint ban on `sql.unsafe`; Zod on every input; least-privilege DB roles; RLS as defence in depth; the guard fix (3.1). |
| XSS / clickjacking | Web | CSP, HSTS, X-Frame-Options (allow framing only on demo pages), Referrer-Policy, through helmet on the API and Next.js headers; React escaping; no `dangerouslySetInnerHTML` with user data (lint rule). |
| CSRF | Web/API | SameSite=Lax cookies plus Better Auth origin check; state-changing routes are POST only. |
| Scraping / enumeration | Web/API | No public list endpoints; UUIDs internally; `noindex` + `robots.txt` for `/i/*`; per-IP rate limits on public invitation GET/RSVP; Cloudflare Bot Fight mode; guest data never public; honeypot (exists); optional Turnstile on RSVP and sign-in. |
| Account takeover | Auth | One-time codes only (no passwords), hashed codes, lockout, session rotation on sign-in, sign-out-everywhere, admin role only by SQL. |
| Payment fraud | Payments | Signed webhooks, replay window, idempotent events, exact-match-only auto-confirm, audit log, the admin queue for anything unclear. |
| Server compromise | Server | Unattended security upgrades, SSH key only plus fail2ban (or CrowdSec), Postgres not exposed, secrets only in Coolify env, Docker images pinned, the owner's 2FA on Coolify, Cloudflare and GitHub. |
| Data loss | Backups | Nightly encrypted `pg_dump` to off-server S3-compatible storage, a retention policy (7 daily / 4 weekly / 3 monthly), and a **tested restore**. |
| Personal data (PDPL) | Data | Guest phones purged 30 days after an invitation ends (exists), IP hashing (exists), logs redacted (exists). |
| TLS at origin behind Cloudflare | Proxy | Cloudflare Origin CA certificate in Caddy (HTTP-01 fails when the firewall only admits Cloudflare) |

*Note: Dozzle has no auth by default, so it must sit behind Caddy basic auth (or Dozzle's own simple auth) and never be public.*

### 3.5 Monitoring (light enough for 8 GB)
- **Uptime Kuma:** HTTP checks for `/v1/health` and the web home page; TLS-expiry alerts; a **push monitor** that the backup job pings after each successful run. Alerts go to Telegram and/or email.
- **Beszel** (hub + agent): CPU, RAM, disk and per-container usage, with alerts at disk > 80% and RAM > 85%.
- **Dozzle:** a read-only log viewer for the containers, protected by auth.
- **App level:** structured pino logs (exist), a `/v1/health` deep check (DB reachability, migrations version), optional Sentry (exists, env-gated).
- **Not used:** Prometheus + Grafana + Loki. They are too heavy for this box today.

### 3.6 SaaS admin dashboard (owner)
- Start from branch `agy-admin` (pending payments, customers), after its TypeScript fix.
- Add an **Overview** page with an API route `GET /v1/admin/stats`: revenue today/7d/30d, orders by status, pending payments, active invitations, new sign-ups, RSVPs, and unmatched payment events.
- Add a **Payment events** page: assign an unmatched transfer to an order, which calls the same SQL function with an admin actor.
- Add an **Audit log** page (read-only).

### 3.7 Customer "pick and preview before you buy"
- The gallery (`/templates`), template pages, `/preview/[slug]` and `/checkout/[slug]` already exist. **Another Claude session owns the landing, template and engine files**, so this lane only adds new files plus a small dashboard entry point:
  - a "New invitation" button in the customer dashboard;
  - a `/[locale]/app/new` flow: pick a template, preview it with **your own names and date**, compare plans, then go to checkout.
- In API mode the template catalog and prices come from `GET /v1/templates` and the `prices` table.

## 4. Parallel execution plan

### 4.1 Rules that make parallel work safe
1. **Contracts first.** Wave 0 lands interfaces, stubs, migrations 0000/0015 and the CI switch **before** any lane starts. Lanes code against those contracts.
2. **Disjoint file ownership.** Each lane owns the paths in its row. Anything outside them needs the orchestrator's approval.
3. **Append-only shared files**, each lane in its own marked block:
   - `apps/api/src/app.module.ts` (one import per lane);
   - `apps/api/src/config/env.schema.ts` (one block per lane);
   - `apps/web/messages/{ar,en}.json` (one top-level namespace per lane);
   - `.env.example` files.
4. **Migration numbers are reserved:** 0000 + 0015 (W0), 0016 (L3 payments), 0017 (L2 auth / OTP), 0018 (L7 security), 0019 (L5 admin stats, if needed).
5. **Each lane writes its own SQL test file**, `platform/supabase/tests/<lane>.sql` (wrapped in `begin … rollback`). CI runs **all** `tests/*.sql` files, so lanes never edit the same test file.
6. **Dependencies:** only W0 (`postgres`) and L2 (`better-auth`) add npm packages. The lock file is regenerated at integration and never hand-merged.
7. **Branches and landing:** each lane pushes `lane/<name>` and needs green CI. The orchestrator merges in the order below and reruns CI after every merge. An implementer never pushes to `main`.
8. **Time-box:** 90–150 minutes per lane. At the limit, the implementer stops, keeps the gates green, and reports what is done and what is left.
9. **Sandbox limit:** Codex has no network in its sandbox: the orchestrator pre-installs node_modules in its worktree and Codex must not add dependencies.

### 4.2 Waves and lanes

| Wave | Lane | Implementer | Owns | Must not touch |
|---|---|---|---|---|
| W0 (now) | Contracts & DB switch | Sonnet | 0000 bootstrap, 0015 guard fix, apps/api/src/database/**, scripts/db-apply.sh + db-test.sh, CI database job on postgres:17, ESLint DB/`.unsafe` rules, env DATABASE_* | repositories, auth, web |
| W0 (now, parallel) | L4 Ops: infra + monitoring + backups | opencode | platform/infra/**, docs/OPERATIONS.md | application code |
| W0 (now, parallel) | L6 Customer pick & preview | Sonnet | app/[locale]/app/new/**, src/pick/**, styles/pick.css, messages `pick`, one CTA in dashboard home | landing/templates/engine/checkout/preview files (owned by another session) |
| W0 (now, parallel) | L7 Security (slim) | Sonnet | apps/api/src/security/**, helmet/body-limit/trust-proxy in setup-app/main, web next.config.ts headers + robots, lint rules, npm audit | auth, repositories, middleware |
| W1 (after W0) | L1 Repositories → postgres.js | Sonnet | every *.repository.ts EXCEPT apps/api/src/auth/**; remove supabase.service + supabase-js from the API | auth module, payment-events |
| W1 (after W0) | L2 Login (API + web) | agy | apps/api/src/auth/** (Better Auth, AuthGuard, OTP port), 0017, apps/web/src/auth/**, apps/web/src/middleware.ts, sign-in page, messages `auth` | other repositories, admin, pick |
| W1 (after W0) | L3 Payment auto-confirm | Codex | apps/api/src/payment-events/** (incl. the unique-amount allocator as a standalone service), 0016, supabase/tests/payments.sql | checkout files, web, auth |
| W3 | Integration | agy + orchestrator review | wire unique amount into checkout, merge existing branch agy-admin (pending payments + customers screens), merges, conflict fixes, rewrite DEPLOYMENT/OPERATIONS for the final stack | — |

**Deferred to after launch:** new admin pages (overview KPIs, payment-events assignment page, audit log viewer), Redis, phone-code delivery provider, Fawry.

### 4.3 Today's timeline (realistic)
- W0 + L4/L6/L7 in parallel now (~75 min).
- L1/L2/L3 (~2–2.5 h).
- Integration (~1 h).

*Note: L2 (login) is the critical path and can slip to the evening.*

## 5. Owner inputs (do not block code; needed to go live)
1. EasyConfirm: docs link, API key, and how it notifies us (webhook URL plus signing secret, or a polling API).
2. VPS bought (8 GB minimum; 16 GB recommended if the monitoring stack and a later Redis run on it).
3. Domain, plus Cloudflare free account (strongly recommended).
4. Email sender for one-time codes. SMTP from a provider's free tier is recommended, because self-sent mail from a VPS IP often lands in spam.
5. Phone code sender: WhatsApp Cloud API (needs Meta Business verification) or an SMS gateway. Until then, phone sign-in stays off and email sign-in works.
6. S3-compatible storage for backups (Contabo Object Storage / Backblaze B2 / Wasabi).
7. A Telegram bot or an email address for alerts.

## 6. Open questions
- EasyConfirm docs / API key / signing method.
- Does InstaPay accept piasters?
- Cloudflare yes / no.
- Email (SMTP) provider choice.
- VPS size.

## 7. Debate record

| Point | Gemini's Verdict | Final Decision |
|---|---|---|
| 1. Guard bug | Agree | Fix kept |
| 2. Bootstrap | Agree | Default privileges and BYPASSRLS added by Claude |
| 3. Better Auth in NestJS | Change | Body parser bypass + cookie forwarding |
| 4. Unique amount | Agree | Release on expiry |
| 5. Security | Change | Origin CA, Dozzle auth, trust proxy |
| 6. Monitoring | Agree | Monitoring stack agreed |
| 7. Parallel collisions | Change | L1 excludes auth, L3 never touches checkout |
| 8. Scope | Partly accepted | Admin extensions + phone delivery deferred, slim security lane kept because the owner asked for it explicitly |
