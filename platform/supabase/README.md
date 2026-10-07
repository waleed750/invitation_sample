# Supabase migrations — invitation platform

SQL only. Three migrations + one test file, applied in numeric order.

| File | Contents |
|---|---|
| `migrations/0001_core.sql` | Extensions (`pgcrypto`), `handle_updated_at()`, all tables, checks, unique constraints, indexes |
| `migrations/0002_functions.sql` | `is_admin()`, `level_for_purchases()`, `points_balance_v`, `fulfill_paid_order()`, `refund_order()`, `assert_can_publish()`, `publish_invitation()` |
| `migrations/0003_rls.sql` | `ENABLE ROW LEVEL SECURITY` on every table, all policies, column-guard triggers, `REVOKE … FROM anon` |
| `tests/rls_and_fulfillment.sql` | Assertions in one rolled-back transaction (fulfillment, refunds, publish gate, anon privacy) |

## Table overview

| Table | Role |
|---|---|
| `profiles` | One row per account (`id` = `auth.users.id`). Phone/email (E.164 / unique, nullable), locale, role, cached `level` / `purchases_count` / `points_balance` |
| `templates` | Catalog: bilingual names, tier, theme spec, bilingual sample data, `status` (draft/live/retired), `license_complete` gate |
| `template_assets` | R2 assets per template with `source`/`license` (license gate) |
| `affiliates` | Media buyers: lower-case `ref_code`, commission %, customer discount %, payout details |
| `affiliate_clicks` | Aggregated `(affiliate, day, path)` counters — server-incremented only |
| `affiliate_payouts` | Manual payouts (service/admin only) |
| `coupons` | Lower-case PK codes; `percent_off` or `amount_off_minor` + `currency`; validated server-side so codes never leak publicly |
| `prices` | Money catalog: one active row per (template or tier default, tier, currency) in integer minor units; anon/authenticated read active rows, writes are service-role only |
| `orders` | Checkout record: tier, kind (new/extension/edits/addon), `amount_minor` + `currency`, `discount_total_minor`, provider (`fawry`/`kashier`/`manual`/`mock`), idempotency key, affiliate attribution, points in/out |
| `invitations` | Customer invitation: slug (lowercase-slug check, 3–60 chars), Zod-validated `data` jsonb, status (draft/published/ended/archived) |
| `invitation_entitlements` | What the purchase bought: edits allowed/used, template switches (null = unlimited), `online_until`, `min_online_until` (event floor) |
| `invitation_publishes` | Snapshot per publish (edit counting + undo) |
| `invitation_access_links` | Private edit links: **only the SHA-256 `token_hash` is stored — the raw token is never persisted** |
| `invitation_views` | Aggregated `(invitation, day)` counters — server-incremented only |
| `rsvps` | Guest RSVPs, unique per `(invitation, phone)` (upsert); owner-read-only |
| `messages` | Guestbook with owner approval flag; owner-read-only |
| `media` | Customer uploads (R2 key, processing/ready) |
| `points_ledger` | Append-only points history; balance is derived, cached on `profiles` |
| `audit_log` | Admin action trail (admin-read, service-written) |
| `anonymous_drafts` | Pre-checkout cookie drafts, auto-expire after 7 days (service-side only) |

## Money / points rules implemented

- **Tiers** (`fulfill_paid_order`, single CASE source of truth): Save-the-Date 5 edits / 3 mo / event+7d / 1 switch · Classic 15 / 6 / +14 / 2 · Premium 40 / 12 / +30 / unlimited (null).
- **Online window**: `greatest(now + months, event_date + grace)` on new orders (never ends before the event); extensions add the tier months to the *current* `online_until`; edits packs add +10 edits; addons touch only points.
- **Event date** is read from `invitations.data` (`event_date`, `event.date`, or `eventDate`); a missing/unparseable date never fails fulfillment.
- **Money**: all amounts are integer minor units (`bigint`, 1/100 of the major unit; EGP 1299 = `129900`) with an ISO-4217 `currency` (`^[A-Z]{3}$`). Never floats. The base price is read from `prices` (template-specific active row, else the tier default with `template_id is null`). `templates.price_override_egp` no longer exists.
- **Points**: `floor(amount_minor / 1000)` for `currency = 'EGP'` (same as `floor(EGP / 10)`; other currencies earn 0 points until B14) × level multiplier (member 1.0, silver 1.10, gold 1.25), floored again; +50 bonus on the first paid order; spent points written as a negative `redeem` row; earned rows expire after 12 months.
- **Levels** by paid-order count: 0–1 member, 2–3 silver, 4+ gold.
- **Idempotency**: the order row is locked (`FOR UPDATE`); any non-`pending` status returns `already_processed` with zero writes — duplicate webhooks are safe.
- **Refunds**: `refund_order` writes an equal-and-opposite `refund` row per ledger row of the order (earned taken back, redeemed restored), flips status to `refunded`, recomputes counters. Balances may go negative when points were already spent (§16.4).

## How to apply

Supabase CLI (recommended):

```bash
supabase db reset   # local, or: supabase db push  (linked project)
```

Plain `psql` (files must run in order):

```bash
psql "$DATABASE_URL" -f platform/supabase/migrations/0001_core.sql
psql "$DATABASE_URL" -f platform/supabase/migrations/0002_functions.sql
psql "$DATABASE_URL" -f platform/supabase/migrations/0003_rls.sql
```

Run the tests (throwaway project only, as the DB owner — the file uses
`SET LOCAL ROLE` to impersonate `service_role`/`anon`, and rolls back):

```bash
psql "$DATABASE_URL" -f platform/supabase/tests/rls_and_fulfillment.sql
```

Assumptions: Supabase-managed `auth.users`, and the `anon` / `authenticated` /
`service_role` roles, already exist (standard on every Supabase project).
`auth.uid()` is used for owner checks; the test impersonates a user via the
`request.jwt.claims` GUC, exactly as PostgREST sets it per request.

## Enforced in SQL vs. in Next.js server code

**In SQL (this folder — cannot be bypassed from the client):**
- Fulfillment atomicity + idempotency, entitlement math, points math, level math, refund compensation.
- Publish gate (`assert_can_publish`): ownership, edits left, online window.
- RLS: public sees only `published` invitations / `live` templates (+ assets); owners see only their rows; no client writes to entitlements, orders, ledger, RSVPs, messages, counters, links, audit log, drafts.
- Column guards: `status`/`published_at`/`order_id`/post-publish `slug` on invitations and `role`/`level`/`purchases_count`/`points_balance` on profiles are server-only.
- Raw edit-link tokens are never stored (hash only); `fulfill`/`refund` are `service_role`-only; `points_balance_v` is `security_invoker`.

**In Next.js server code (NOT here — build per PLATFORM_PLAN):**
- Webhook signature verification + passing the idempotency key; Turnstile + Upstash rate limits on RSVP/message/OTP/upload routes; 1-per-phone RSVP upsert; view/click counter increments.
- Private-link token generation (`crypto.randomBytes` 32+), hashing, revocation, claim-into-account flow.
- Coupon validation + the 30%-off stacking cap; affiliate attribution (code wins, else 30-day `ref` cookie); commission paid only after the 7-day refund window.
- Daily cron: end/archived transitions, 7-day reminders, 30-day guest-phone purge, draft expiry, points expiry accounting.
- Zod validation of `data`/`theme_spec`, OG rendering + ISR revalidation on publish, receipts/e-invoicing, audit_log writes, slug reservation/profanity lists.
