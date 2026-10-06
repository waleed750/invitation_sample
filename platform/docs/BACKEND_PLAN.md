# Backend Plan — `apps/api` (NestJS) + Supabase

> Written 2026-10-07. Builds on `PLATFORM_PLAN.md` §6.5 (NestJS decision), §8 (rate limits), §16 (accounts, limits, points, admin).
> This file is the **how and in what order**. The product rules (tiers, points, limits) stay in `PLATFORM_PLAN.md` and `packages/shared`.

---

## 1. Where we are today

| Area | State |
|---|---|
| **DB** (`supabase/migrations/0001–0005`) | ✅ All §16.8 tables, RLS on every table, SQL functions `fulfill_paid_order`, `refund_order`, `assert_can_publish`, `publish_invitation`, `create_pending_checkout`. SQL test file. |
| **API skeleton** | ✅ Config validated with Zod at boot, `AuthGuard` (Supabase JWT, HS256 or JWKS), `RolesGuard`, throttler (**in memory**), request IDs, exception filter, Supabase timeout, Dockerfile. |
| **API routes** | ✅ `GET /v1/health`, `GET/PATCH /v1/me`, `POST /v1/checkout`, `POST /v1/payments/mock/webhook`, `POST /v1/dev/payments/mock/:id/succeed\|fail`, `GET /v1/orders[/:id]`, `GET /v1/invitations`, `GET /v1/invitations/:id/entitlement`, `GET /v1/points`, `GET /v1/templates`. |
| **Web ↔ API** | ❌ **Not connected.** The web app runs on two mocks: `CommerceClient` (`apps/web/src/commerce/types.ts`) and `InvitationPublicStore` (`apps/web/src/guest/store.ts`, file-based demo store). |
| **Missing completely** | Invitation editing/publishing over the API, public invitation + RSVP + guestbook endpoints, real OTP, Fawry, Redis, job worker, notifications, media uploads, admin, private edit links, affiliates, CI. |

**The plan in one sentence:** make the API implement everything both web mocks do today, switch the web app to it behind one env flag, then add the parts that need outside accounts (WhatsApp, Fawry) once the owner has them.

---

## 2. Decisions this plan takes (override any of them)

| # | Decision | Why |
|---|---|---|
| D1 | **Supabase Auth owns sessions and OTP.** Phone OTP goes through Supabase's **Send SMS Hook**, which calls our API, and our API sends the code on WhatsApp (SMS fallback). Email OTP uses Supabase with Resend as SMTP. Turnstile uses Supabase's built-in captcha support. | We don't write OTP storage, expiry or lockout ourselves. The web app gets a normal Supabase session and sends its JWT to the API, which already works with `AuthGuard`. |
| D2 | **Next.js reads public invitations through the API** (`GET /v1/public/invitations/:slug`), not Supabase directly. | The "ended" rules, tier gating and snapshot choice stay in one place. ISR caching makes the extra hop free for guests. |
| D3 | **Webhooks are stored first, processed second.** A new `payment_events` table holds every raw webhook (unique on provider + event id). Processing calls `fulfill_paid_order`, which is already idempotent. | Duplicate or out-of-order Fawry deliveries do nothing. We can replay events after a bug. |
| D4 | **One codebase, two processes:** `main.ts` (HTTP) and `worker.ts` (BullMQ). The same Docker image runs both with different commands. | This is already the plan in §6.5. Jobs never slow down requests. |
| D5 | **Redis arrives in B0**, used for throttler storage and BullMQ. Upstash in production, `redis:7` in docker-compose locally. | The in-memory throttler breaks once there are 2 instances. |
| D6 | **The typed web client is generated from OpenAPI** (`openapi-typescript` + `openapi-fetch`) into `packages/api-client`. | The web app and API can't drift silently. CI fails if the generated client is stale. |
| D7 | **Integration tests run against a real local Supabase** (`supabase start`), not mocks, for anything that touches SQL functions or RLS. Unit tests keep mocking Supabase. | Money and permission rules live in SQL, so only a real Postgres proves them. |

---

## 2b. Stack for "easy now, scale later" (owner requirements, 2026-10-07)

Requirements: easy to run, scales later, Google sign-in now, WhatsApp auto-replies later, payment gateways for the whole world later, admin + customer dashboards, ready-to-buy templates, and a WordPress-style editor (add / remove / drag-to-reorder sections).

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **Keep NestJS** | NestJS *is* Node.js: it runs on Node and adds structure on top of Express. Plain Express would be faster for a weekend project but turns messy once there are 15+ modules (auth, payments, WhatsApp, admin, editor). NestJS is already built and tested here (~50 API tests). |
| Database | **PostgreSQL**, hosted on Supabase for now | Postgres handles this product up to millions of invitations. The JSON column type (`jsonb`) suits editor documents. Every rule is in plain SQL migrations, so it can move to any Postgres host (§2c). |
| Data access | **Keep the Supabase client with the user's JWT (`forUser`)**, behind one thin repository class per module. *(Changed after review, 2026-10-07: no Drizzle now; see §2c.)* | Postgres row-level security and the guard triggers keep protecting every owner request. Swapping the database later only touches the repositories. |
| Sign-in | **Supabase Auth: Google now**, email code now, phone/WhatsApp code later | Turning on Google sign-in is a setting plus a Google Cloud OAuth client, with no new code. The API keeps verifying the same JWT. |
| Jobs + rate limits | **At launch:** in-memory rate limits (one API instance) + `@nestjs/schedule` for the daily expiry/reminder job. **Later** (with video processing, B8, or the WhatsApp bot, B13): Redis + BullMQ + a separate worker. *(Changed after review.)* | No Redis to run on a small VPS until a feature actually needs a queue. |
| Files | Cloudflare R2 + CDN | No fee for downloads, which matters for video. |
| Web | Next.js: public site, `/app` (customer dashboard), `/admin` (admin dashboard) | One app. The API's `RolesGuard` protects admin routes. |

### Hosting: which VPS

**Recommendation (updated 2026-10-07, budget first): Contabo Cloud VPS 10, EU (Germany), Ubuntu 24.04, with [Coolify](https://coolify.io)** (a free, self-hosted Heroku-style panel: deploy from git, free SSL, logs, one-click Redis, scheduled backups).

- About **€4.50/mo** for 4 vCPU / 8 GB RAM / 75 GB NVMe, with no traffic limit (price as of early 2026; check before buying).
- Hetzner raised its cloud prices sharply in June 2026 (CPX plans up to +176%), and its cheapest CX plans are often sold out, so it's no longer the cheap option.
- **What's worse on Contabo:** the CPU is shared and slower, support is slow, and there are occasional network problems.
- **How we handle that:** no important data lives only on the server. The database is on Supabase, files are on R2, and nightly backups go to R2. If the server dies, a new one is set up again in about an hour.

| Stage | Setup | Approx. cost |
|---|---|---|
| Launch | 1× Contabo Cloud VPS 10: Coolify + API + worker + Redis. Database on Supabase (free). Web on Vercel (free). | ~€5/mo |
| Growing | Contabo VPS 20/30, or move the API to Hetzner/DigitalOcean if Contabo's speed or reliability gets in the way. Supabase Pro ($25) for daily backups. | ~€10–40/mo |
| Real scale | 2+ API servers behind a load balancer, a separate worker server, managed Redis, a bigger database | €100+/mo |

The API stores no state on the server itself (sessions are JWTs, files are in R2, jobs are in Redis), so moving to another host or adding servers needs no code changes.

### The WordPress-style editor (sections you add, remove and reorder)

The data model already fits: every invitation is `sections[]`, each with `{type, id, props}`, and each section type has a Zod schema in `packages/shared`.

- **Customer editor (web), changed after review:** a **mobile-first section list**, because most customers will edit on a phone, in Arabic:
  - section cards you can drag to reorder (`dnd-kit`, with touch support);
  - add / remove / hide sections;
  - a form per section, generated from its Zod schema;
  - a live preview of the real invitation next to it, or under it on a phone.
  - Puck's editor is built for desktop. It stays an option later for the **admin** template builder (§B9), not for customers.
- **Document model:** `{schemaVersion, theme, sections:[{id, type, variant, props, hidden, locked}]}`:
  - `locked` lets a **ready-to-buy template** fix some sections (for example the hero design) while the rest stays editable.
  - `schemaVersion` + small migration functions in `packages/shared` let section types change later without breaking old invitations.
- **Templates:** a template = a starter document + theme + allowed section types. Buying one copies the starter document into the customer's invitation. Tiers control which section types and how many sections a customer can add (enforced in the API, not only in the editor).
- **Backend:** autosave saves the draft (debounced; a conflict check stops two tabs overwriting each other). "Publish" stores an unchangeable snapshot (already in SQL). Each section's props are validated against its Zod schema on every save.

### WhatsApp automatic replies (later; design for it now)

```
WhatsApp Cloud API ─webhook─► /v1/webhooks/whatsapp (check signature, save raw event)
     ─► queue "inbound" ─► Bot: 1) rules/FAQ (prices, how to edit, payment status from our DB)
                               2) AI reply (Claude) with our data, for anything else
                               3) hand off to a human → Admin "Inbox" screen
     ─► queue "outbound" ─► WhatsApp Cloud API (rate-limited, retries)
```

- Tables: `wa_contacts` (linked to `profiles` by phone), `wa_conversations`, `wa_messages`, `bot_rules`.
- WhatsApp's rule: free-form replies only within **24 hours** of the customer's last message. Outside that window, only Meta-approved templates. The outbound queue enforces this.
- The same `Channel` interface is used for OTP codes and notifications (B3/B4), so the auto-reply bot reuses it.

### Payment gateways for the whole world (later; design for it now)

- The existing `PaymentProvider` interface becomes a **registry**: the provider is chosen by country/currency (Egypt → Fawry/Kashier; rest of the world → a global provider).
- ⚠️ **Stripe doesn't accept Egyptian merchant accounts.** For global sales, use a **Merchant of Record** such as **Paddle** or **Lemon Squeezy** (they also handle sales tax/VAT worldwide), or Stripe through a company registered abroad (for example a US LLC or UAE company). This is a business decision, not a code one.
- **Do now, while there's no real data:** store money as **whole minor units** (`amount_minor bigint` + `currency`), not `amount_egp numeric`, and add a `prices` table (template × tier × currency). Doing this after launch would be painful.

## 2c. Keeping the database replaceable

*Corrected 2026-10-07 after the agy review.* The first version said "Drizzle over a direct Postgres connection, with RLS as a second layer". That was wrong. A direct connection has no user JWT, so `auth.uid()` is null. The guard triggers then allow every change (`supabase/migrations/0003_rls.sql:73`), and RLS doesn't apply to the connection's role. The database's own protection would quietly switch off.

1. **All SQL in migrations**, never clicked together in the Supabase dashboard (already the rule).
2. **Thin repositories:** services never import Supabase directly. Only `*.repository.ts` files talk to the database, using `SupabaseService.forUser(jwt)` for owner requests and `admin()` only in admin/webhook/job code.
3. **Supabase-specific features only for sign-in and the PostgREST client.** Files are on R2.
4. **Leaving Supabase later** means rewriting the repositories with any Postgres driver. Each request runs in a transaction that first does `set local role authenticated` + `set_config('request.jwt.claims', <jwt claims>, true)`. That is exactly how Supabase sets things up, so every RLS policy, `auth.uid()` and guard trigger keeps working unchanged on any Postgres host. A small `auth.uid()` shim function is needed outside Supabase.

The result: moving to another Postgres host is a repository rewrite (about 2–4 days), with no security rules to rewrite. Replacing Supabase sign-in as well is about 1–2 more weeks.

---

## 3. Milestones

Each milestone is one brief → implement → review → commit cycle (Codex / opencode implement, Claude reviews). Size: S ≈ ½ day, M ≈ 1–2 days, L ≈ 3–4 days of implementer time.

### B0 — Foundations, slimmed after review (M) · no blockers

- Thin repository layer over the existing `forUser(jwt)` / `admin()` clients (§2c). No Drizzle.
- Migration: money columns → `amount_minor bigint` + `currency`, plus a `prices` table (template × tier × currency).
- Google sign-in switched on in Supabase Auth (+ a Google Cloud OAuth client).
- Logging: `nestjs-pino` with the request ID already present. Sentry (`@sentry/nestjs`), enabled only when `SENTRY_DSN` is set.
- `packages/api-client`: generate it from `/v1/openapi.json` with a script `npm run gen:api-client`.
- **CI (GitHub Actions):** install → typecheck → lint → unit tests (shared, api, web) → `check:i18n` → start local Supabase → API integration tests → `supabase/tests/*.sql` → verify the generated client is up to date.
- Staging: Coolify on the Contabo VPS running the API (one instance, in-memory rate limits).
- **Moved out of B0:** Redis, BullMQ and the worker process (until B8/B13).
- **Gate:** CI is green on a PR; staging `/v1/health` is up over HTTPS.

### B1 — Invitations: drafts, editing, publishing (L) · no blockers

- **Added 2026-10-07:**
  - The block document model from §2b (`schemaVersion`, `variant`, `hidden`, `locked`) in `packages/shared`, with a migration function from today's `sections[]`.
  - The API rejects changes to `locked` sections and section types the tier doesn't allow.
  - **Each route is wired into the web app in the same milestone** (`ApiCommerceClient` methods / `ApiInvitationPublicStore`), so the web app and the API never drift (moved earlier after review).
  - The customer editor is the mobile-first section list from §2b (separate web milestone).

| Route | Notes |
|---|---|
| `GET /v1/invitations/:id` | Owner only (RLS through the user's JWT). Returns data + entitlement + status. |
| `PATCH /v1/invitations/:id` | Body: `data` (shared `InvitationData` Zod schema). `If-Match: <updated_at>` gives optimistic concurrency, so 2 open tabs never overwrite each other (409 on conflict). Throttle: 60/min per user. |
| `PATCH /v1/invitations/:id/slug` | Only before first publish. Reserved words + profanity list in `packages/shared`. |
| `GET /v1/slugs/:slug/availability` | Returns `{available, suggestions[]}` (`ahmed-mona-2026` style). |
| `POST /v1/invitations/:id/publish` | Calls the SQL `publish_invitation` (counts the edit, stores the snapshot). Maps SQL errors to `no_edits_left` / `expired` / `not_found`, the same result shape as today's web mock. Then queues `revalidate`. |
| `POST /v1/invitations/:id/undo-publish` | Republishes the previous snapshot. Does **not** use an edit. Needs a new SQL function. |
| `POST /v1/invitations/:id/switch-template` | Uses `template_switches_left`. |

- New module `RevalidationModule`: queue job → `POST {WEB_URL}/api/revalidate` with an HMAC header. Retried with backoff. The Next.js route is added in the same milestone.
- Migration `0006`: `undo_publish()`, `switch_template()`.
- **Gate:** integration tests prove a user can't edit or publish someone else's invitation, can't publish with 0 edits, and can't change the slug after publishing.

### B2 — Public invitation, RSVP, guestbook (M) · no blockers

| Route | Notes |
|---|---|
| `GET /v1/public/invitations/:slug` | `@Public`. Returns the **latest publish snapshot**, or `{state:'ended', couple, ...}` once `online_until` has passed. Sets cache headers. |
| `POST /v1/public/invitations/:slug/rsvp` | Turnstile guard + throttles from §8.2 (5/IP/min, 500/invitation/hour). Upsert per `(invitation, phone)`. Tier `rsvpLimit` enforced. Honeypot field. Phone normalized to E.164. |
| `POST /v1/public/invitations/:slug/messages` | Turnstile, 3/IP/10 min, profanity filter, `approved=false` when the owner turned approval on. |
| `POST /v1/public/invitations/:slug/view` | Increments the aggregated `invitation_views` counter. Called once per session from the page, not on every render. |
| `GET /v1/invitations/:id/rsvps`, `GET …/messages`, `PATCH …/messages/:mid` | Owner only. |
| `GET /v1/invitations/:id/rsvps.csv` | Keep the BOM + formula-injection defence already in `apps/web/src/guest/csv.ts` (move it to `packages/shared`). |

- `TurnstileGuard` (skipped when `TURNSTILE_SECRET` is unset in dev/test).
- `ip_hash` = HMAC(IP, server secret). Raw IPs are never stored.
- **Gate:** the web flows that work today on the demo store work against the API in both languages (see B3.5).

### B3 — Accounts and sign-in (M) · email now, WhatsApp **blocked on Meta verification**

- Supabase config: phone + email OTP on, captcha (Turnstile) on, OTP length 6, expiry 10 min.
- `POST /v1/hooks/auth/send-sms` (`@Public`, verified with the Standard Webhooks signature Supabase sends). It sends a WhatsApp **authentication template** in the user's locale. If WhatsApp fails or isn't configured yet, it falls back to an SMS gateway. In dev it logs the code.
  - The hook must answer within ~5 s, so it sends directly (no queue) with a 3 s timeout.
  - A daily spend cap in Redis: when it's hit, it refuses and alerts.
- Profile row created by a trigger on `auth.users` insert (check whether 0001 already has it; add it in a migration if not). `preferred_locale` taken from the sign-up metadata.
- Phone normalization (`01x…` → `+201x…`) moved from `apps/web/src/commerce/phone.ts` to `packages/shared` and used on both sides.
- **Gate:** sign-in with email OTP works end to end. Phone OTP works with the SMS fallback. A third OTP request within 10 minutes is refused.

### B3.5 — Switch the web app to the API (M) · no blockers

- `ApiCommerceClient` implements `CommerceClient`; `ApiInvitationPublicStore` implements `InvitationPublicStore`. Both use `packages/api-client`.
- `COMMERCE_BACKEND=mock|api` env flag. The mock stays for demos and the landing-page "try it" flow.
- `simulatePayment` keeps using the `dev/payments/mock` routes (already blocked in production by the env schema).
- Playwright e2e: sign in → checkout → mock pay → edit → publish → guest RSVP → owner sees the RSVP → CSV, in AR and EN.
- **Gate:** that e2e passes in CI against local Supabase + API. **This is the point where the product works end to end with only the mock payment.**

### B4 — Jobs and notifications (M) · WhatsApp templates **blocked on Meta**; email works now

- `NotificationsModule`: `send(userId, templateKey, params)` → picks channel (WhatsApp if a phone is verified, else email) and the user's language. Message texts live in `apps/api/src/notifications/templates/{ar,en}.ts` and are checked by the same i18n key check as the web app.
- Migration: `notifications_log` (who, which template, channel, status, provider id, cost). This is the "cost per signup" KPI.
- Queues and jobs:
  - `notifications` — concurrency 5, exponential backoff + jitter.
  - `lifecycle` (repeatable, daily 03:00 Africa/Cairo): reminder 7 days before `online_until` → mark ended → 30 days after ending, purge guest phones and archive → expire points.
  - `revalidate` (from B1).
- Order paid → receipt message. Order failed → "try again" message.
- **Gate:** run the lifecycle job against fixed clock times (there is already a `clock.ts`) and assert every transition, including that running it twice changes nothing.

### B5 — Admin tools (L) · no blockers

All under `/v1/admin/*` with `@Roles('admin')`. An `AuditInterceptor` writes every admin **mutation** to `audit_log` (actor, action, target, before/after, reason). Mutations that grant something require a `reason` field.

- Customers: search (phone / email / name / slug), detail (orders, invitations with meters, points history, level).
- Entitlements: add edits, extend `online_until` (SQL function `admin_adjust_entitlement`, migration `0007`).
- Points: grant/deduct → `points_ledger` row with `reason='admin'`.
- Orders: **manual order** (`provider='manual'`, amount typed in) → `fulfill_paid_order` → sends an account invite or a private edit link. Refund → `refund_order` (+ Fawry refund API once B7 exists).
- Dashboard KPIs (§16.1) as SQL views: drafts, paid, conversion, AOV, refund rate, OTP spend.
- **Gate:** a non-admin gets 403 on every `/v1/admin` route (one test walks all registered routes). Every mutation leaves an audit row.

### B6 — Private edit links + claim (M) · no blockers

- `POST /v1/admin/invitations/:id/access-links` and an owner version → returns the raw token **once**. Only the SHA-256 is stored (the table already does this). Revoke route.
- `EditLinkGuard`: reads `X-Edit-Token`, hashes it, loads the link, checks `revoked_at`, scopes the request to that one invitation and updates `last_used_at`. It works on the B1 edit/publish routes only — never on orders, refunds or profile.
- `POST /v1/invitations/:id/claim` (signed in + edit token) → moves the invitation and its order to the account. Points are granted retroactively.
- **Gate:** a link token can't read any other invitation, can't reach `/v1/orders`, and stops working right after revoke.

### B7a — Manual payments, used at launch (M) · no blockers (owner decision 2026-10-07)

The customer pays outside the site; an admin confirms; the system does the rest.

1. **Checkout** creates a `pending` order with `provider='manual'` and a short **payment reference** (for example `INV-4821`). The page and a WhatsApp/email message show the amount, the reference and how to pay:
   - InstaPay
   - Vodafone Cash / other wallets
   - bank transfer

   The payment details are admin settings, in AR/EN.
2. **The customer sends proof:** a screenshot on WhatsApp with the reference, or an optional upload on the order page (added with B8 media; WhatsApp only until then).
3. **The admin "Pending payments" screen** (the first piece of B5) lists pending orders with the reference, amount, customer and age.
   - **Mark as paid** asks for the amount actually received and the transaction id, then calls `fulfill_paid_order`. That creates the entitlement, points and affiliate credit exactly as an online payment would, and writes `audit_log`.
   - **Reject** closes the order and records a reason.
4. Pending orders expire after **72 h** (the daily job) and the customer gets a reminder at 24 h. The customer can still edit the draft while the order is pending, but can't publish until it's paid.
5. **Env:** `PAYMENTS_PROVIDER` becomes `mock|manual|fawry`. Production allows `manual` and `fawry`, never `mock`. Today's schema allows only `mock` (`apps/api/src/config/env.schema.ts:38`).
6. **Gate:** a customer can't mark their own order paid. Marking the same order paid twice does nothing the second time (already idempotent in SQL). A typed amount that doesn't match the order needs an explicit "accept anyway" with a reason.

Fawry (B7) later replaces step 1–3 for customers who want to pay online. Manual stays for negotiated deals (§16.5).

### B7 — Fawry payments (L) · **blocked on the Fawry merchant account** (build against the sandbox)

- `FawryPaymentProvider` implements the existing `PaymentProvider` interface:
  - card / wallet → hosted checkout redirect URL;
  - "pay at Fawry" → returns a reference number the customer pays in a shop (expires in N hours).
- `POST /v1/payments/fawry/webhook`: raw body → verify the signature → **amount and currency must match the order** → insert into `payment_events` (unique id; duplicates return 200 and stop) → queue `payments.process` → `fulfill_paid_order`.
- `payments.reconcile` repeatable job (every 10 min): asks Fawry for the status of orders `pending` for more than 15 min. This covers lost webhooks.
- Refunds through the Fawry refund API, called from the admin refund (B5).
- Env: `PAYMENTS_PROVIDER` becomes `mock|fawry`. Production refuses `mock` (already enforced).
- Kashier later as a second class behind the same interface, only if Fawry falls through.
- **Gate:** sandbox tests for card, wallet and reference code; duplicate webhook; wrong amount (rejected and alerted); lost webhook recovered by reconcile; refund.

### B8 — Media uploads (M) · needs an R2 bucket (owner's Cloudflare account)

- `POST /v1/media/uploads` → checks the per-tier size cap and the 30/day quota → creates a `media` row (`processing`) → returns a presigned R2 PUT URL (expires in 10 min).
- `POST /v1/media/:id/complete` → queues `media.process`. The worker checks the real file type with magic bytes (`file-type`), then: images → WebP/AVIF + sizes; video → H.264 at a sensible CRF + a poster frame (ffmpeg is in the worker image). Then marks it `ready`, or `rejected` with a reason.
- Served from `media.<domain>` (Cloudflare CDN). Originals deleted after processing.
- **Gate:** a renamed `.exe` uploaded as `.jpg` is rejected. Over-quota uploads are refused before any URL is issued.

### B9 — Admin templates manager (M) · no blockers

- CRUD for `templates` + `template_assets` (uploads reuse B8). Theme Spec validated with the shared Zod schema, with readable errors returned.
- Status `draft → live → retired`. **Going live is refused unless every asset has a source + license** (`license_complete`, §2 of the plan).
- Per-template stats view: demo views, drafts, sales, conversion.

### B10 — Affiliates (M) · no blockers

- `POST /v1/public/affiliate-clicks` (`{ref, path}`, throttled, aggregated per day).
- Checkout attribution: **a typed code wins, otherwise the last `ref` cookie within 30 days.** Stored on the order (`affiliate_id`, `attribution`). Self-referral (same phone/email as the affiliate) is **flagged, not blocked**.
- Admin: CRUD, generated share links + QR (PNG), stats per date range, commission **payable only after the 7-day refund window**, "mark as paid" → `affiliate_payouts`, CSV export.

### B11 — Points: the remaining pieces (S) · no blockers

Earn/refund/levels are already in SQL. Left to do: redeeming points at checkout, with the **30% total discount cap** (points + coupon + affiliate) in one shared function used by both the web quote and the API; the expiry job (in B4's lifecycle); the friend-referral bonus.

### B13 — WhatsApp auto-replies (L) · blocked on Meta verification

The design is in §2b:
- webhook + raw event store;
- `inbound` / `outbound` queues;
- rules/FAQ first, then a Claude reply, then hand-off to a human;
- an admin Inbox screen;
- the 24-hour window enforced in the outbound queue.

### B14 — Global payments (M) · blocked on the business choice (Merchant of Record vs. a company abroad)

- A provider registry chosen by country/currency.
- A Paddle or Lemon Squeezy provider class.
- Prices per currency from the `prices` table.
- Webhooks use the B7 pattern: store first, then process.

### B12 — Production (M) · needs owner accounts (domain, Fly/Railway, Upstash, Supabase Pro, Sentry)

- Contabo + Coolify (§2b): `api` ×2 + `worker` ×1 from the same image. Supabase EU region, Pro plan for point-in-time backups. Redis on the VPS, or Upstash once there are several servers.
- `api.<domain>` behind Cloudflare (orange cloud) + WAF rules; the origin accepts only Cloudflare IPs (§8.1).
- Secrets only in the host's env. Separate staging project with the mock provider.
- Uptime (Better Stack) on `/v1/health`; alerts on 5xx rate, queue backlog, failed jobs, OTP spend.
- k6 load test: 200 RSVPs/s on one invitation + a viral-wedding read burst through ISR.
- Run `/security-audit`, then go through the "ready to take money" checklist (§16.10).

---

## 4. Recommended order (revised after review, 2026-10-07)

```
B0 (slim) ─► B1 + web wiring ─► B2 + web wiring ─► B3 Google/email sign-in ─► B3.5 e2e test
          ← working product on mock payments
   ─► B7a manual payments + admin "Pending payments" screen  ← launch here and take money
   ─► B4 notifications ─► rest of B5 admin ─► B9 ─► B10 ─► B11 ─► B6
   ─► B7 Fawry once the merchant account exists
   ─► B4 notifications + daily job (@nestjs/schedule) ─► B5 admin ─► B9 templates manager
   ─► B10 affiliates ─► B11 points ─► B6 private edit links
   ─► later: B8 media (adds Redis + BullMQ + worker) · B13 WhatsApp bot · B14 global payments · B12 scale-out
```

- **MVP launch = B0–B3.5 + B7a manual payments (+ the reminder/expiry part of B4).** Fawry is not needed to launch. Affiliates, points and private edit links follow right after.
- Points are already done in SQL, so they cost little.
- Nothing before B3.5 waits on the owner.

---

## 5. Cross-cutting rules (every milestone)

- **Validation:** every body/query/param goes through a shared Zod schema via `nestjs-zod`. No hand-written DTOs that copy shared types.
- **Data access:** owner requests use a Supabase client built with the **user's JWT**, so RLS still applies. The service role is used only in admin, webhooks, hooks and jobs, and those code paths must be named `*.service-role.ts` so they're easy to review.
- **Money and limits live in SQL functions.** The API calls them; it never re-implements the math. Pure display math stays in `packages/shared`.
- **Idempotency:** every `POST` that costs money or sends a message accepts an `Idempotency-Key` (checkout already does).
- **Errors:** one error shape `{code, message, requestId}` with stable `code`s the web app translates (`no_edits_left`, `expired`, `slug_taken`, …).
- **Time:** inject `Clock` everywhere (exists). Business dates in `Africa/Cairo`; stored in UTC.
- **Privacy:** guest phones are owner-only, purged 30 days after an invitation ends, hashed IPs only, no phone numbers in logs (a pino redaction list).
- **Tests per milestone:** unit tests for services, plus at least one integration test against local Supabase for every new SQL function or RLS rule, plus the explicit "can't bypass it" test named in each gate.

---

## 6. New migrations expected

| Migration | Contents | Milestone |
|---|---|---|
| `0006_publishing.sql` | `undo_publish`, `switch_template`, public snapshot read function | B1 |
| `0007_admin.sql` | `admin_adjust_entitlement`, KPI views, auth-user → profile trigger if missing | B3 / B5 |
| `0008_notifications.sql` | `notifications_log` | B4 |
| `0009_payments.sql` | `payment_events` (unique `provider, event_id`), reconcile index on pending orders | B7 |
| `0010_affiliates.sql` | Commission-payable view (after refund window), self-referral flag | B10 |

---

## 7. What's needed from the owner (and when it blocks)

| Item | Blocks |
|---|---|
| Meta Business verification + approved AR/EN WhatsApp auth template | WhatsApp OTP (B3) and WhatsApp notifications (B4). SMS/email cover it until then. |
| SMS gateway account (fallback OTP) | Phone OTP before Meta is done |
| Fawry merchant account (sandbox credentials first) | B7 |
| Cloudflare account + R2 bucket + domain | B8, B12 |
| Contabo VPS (+ Coolify install), Supabase Pro, Sentry accounts | B12 |
| Google Cloud OAuth client (for Google sign-in) | Google sign-in (B0) |
| Paddle / Lemon Squeezy account, or a company abroad for Stripe | B14 |
| Resend account + verified sending domain | Email OTP in production |
