# Cloud Task Plan: everything left before the platform can go live

> Written 2026-10-24 for **Claude Sonnet running in Claude Code cloud sessions** (claude.ai/code).
> Each task (`T..`) runs in **one cloud session**: one branch, one pull request, nothing merged until the owner approves.
> The goal is an app that **runs end to end** (sign up → pick a template → pay → edit → publish → guests RSVP → admin), **many more invitation templates**, and a list of what the owner still has to provide.

---

## 0. Read this first (every session)

### 0.1 What already exists on `main` (do not rebuild it)
- **Monorepo `platform/`:**
  - `apps/api`: NestJS 11 + Jest.
  - `apps/web`: Next.js 15 + next-intl, Arabic default (RTL) and English, Vitest.
  - `packages/shared`: Zod schemas, plans (`TIERS`), points rules.
  - `packages/api-client`: generated from the API's OpenAPI.
  - `supabase/migrations`: plain **PostgreSQL**. The folder name is historical; there is no Supabase.
  - `supabase/tests/*.sql`: SQL tests.
  - `infra/`: production compose, Caddy, monitoring, backups, hardening.
  - `docs/`: `SELF_HOSTED_PLAN.md`, `DEPLOYMENT.md`, `OPERATIONS.md`, `BACKEND_PLAN.md`.
- **Database access:** `apps/api/src/database` (`DbService.asUser / asService / asAnon`, tagged-template SQL only; `.unsafe` is banned). Only `*.repository.ts` files may use it; ESLint enforces this.
- **Login:** Better Auth inside the API at `/v1/auth/*`. Email one-time code is on; phone code exists behind `PHONE_LOGIN_ENABLED=false`; Google is optional. The web uses `src/auth/session.ts` → `getServerSession()`.
- **Invitations:**
  - Read and autosave (`If-Match`), slug change, publish, undo, switch template.
  - Public page, RSVP and guestbook; owner guest list and CSV.
  - Plan limits are enforced in SQL.
- **Payments:**
  - Manual provider (reference `INV-XXXXXX`).
  - Payment events: a signed webhook plus a matcher with unique-piaster amounts, an `easyconfirm` adapter stub, and an admin queue.
  - Admin confirm and reject. Daily expiry job, with email notifications through SMTP (AR/EN).
- **Admin:** overview KPIs, pending payments, payment events, customers (adjust edits, extend, points), audit log.
- **Customer:**
  - Dashboard, orders and points.
  - **Pick and preview** (`/app/new`), a personalised preview at `/pick-preview/[slug]`, and checkout.
- **Security:** headers, CSP in report-only mode, real client IP (`TRUST_PROXY`), per-route rate limits, robots/noindex, lint guards, DB guard triggers (fixed in 0015).
- **Templates in `apps/web/src/templates`:**
  - Original and sellable: `diwan`, `mashrabiya`, `bustan`, `rawda`, `riwaq`.
  - **Not sellable** (derived from a third-party design, private drafts only): `africa`, `citystars`, `elegante`, `excellence`.
- **Next migration number: `0021`.** Each task below reserves its own numbers. **Never edit an existing migration.**

### 0.2 Rules for every task
1. Work on the branch named in the task (`task/Txx-…`), created from the latest `main`. Open a **pull request to `main`. Never merge or push to `main`.** The owner reviews and merges.
2. Stay inside the task's **Owns** paths. Anything outside needs a note in the PR description explaining why.
3. **Shared files are append-only, in your own commented block:**
   - `apps/api/src/app.module.ts`: one import line;
   - `apps/api/src/config/env.schema.ts`: your own block, plus `app-config.service.ts`, `.env.example`, `src/testing/env.ts`, `src/openapi/generate-openapi.ts`;
   - `apps/web/messages/{ar,en}.json`: your own top-level namespace, the **same keys in both** (`npm run check:i18n`).
4. **SQL tests:** one file per task, `supabase/tests/<task>.sql`, wrapped in `begin … rollback`, using **plain plpgsql `assert`. No pgTAP** (not installed).
   - Every `insert into auth.users` auto-creates a `profiles` row (trigger 0013). If you insert a profile too, use `on conflict (id) do update`.
   - Clear claims before writing fixtures: `select set_config('request.jwt.claims','',true);`.
5. **Arabic is first-class.** Use natural Arabic text (not machine-literal), and CSS **logical properties** only (`margin-inline-start`, never `margin-left`). Every page must work at **390px, 768px and 1280px** in both `ar` and `en`, with **no horizontal scroll**.
6. **No secrets in code.** New config goes through env vars with safe test defaults.
7. **Never claim a check passed without running it.** Paste the real last lines of every gate in the PR description.
8. Production code must never branch on `NODE_ENV === 'test'` to satisfy tests. Use test doubles.
9. Keep `apps/web` free of any database driver; the web only talks to the API.
10. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### 0.3 Cloud environment setup (paste into the cloud environment's setup script)
```bash
# Node 22 + deps
cd platform && npm ci
# PostgreSQL for SQL tests and the full run (no Docker needed)
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres psql -c "alter user postgres password 'postgres';"
export DATABASE_URL_ADMIN=postgresql://postgres:postgres@127.0.0.1:5432/postgres
# Browser for end-to-end tests and screenshots
npx playwright install --with-deps chromium
```
If the cloud image already has Docker, `platform/infra/docker-compose.dev.yml` (created by T00) can be used instead.

### 0.4 Gates (every task; all must pass)
```bash
cd platform
npm run build --workspace @platform/shared
npm run typecheck
npm run lint
npm test
npm run check:i18n
npm run build:api
npm run gen:api-client && git status --short packages/api-client   # commit regenerated files if they changed
scripts/db-apply.sh && scripts/db-test.sh                             # SQL migrations + SQL tests
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build             # web production build
npm run e2e                                                           # after T00/T01 exist
```

### 0.5 Screenshots ("images") for review
Every task that changes UI adds or updates a Playwright test that saves screenshots to `platform/e2e/screenshots/<task-id>/<page>-<locale>-<width>.png`, at 390, 768 and 1280 for `ar` and `en`. CI uploads them as an **artifact**; do **not** commit PNGs. List the screenshot names in the PR description.

---

## 1. Execution order and parallelism

```
Wave 0 (sequential, first):  T00 full-run dev stack  →  T01 finish e2e + screenshots
Wave 1 (parallel):            T10 editor data model ─→ T11 editor UI (needs UI_DESIGN_PLAN.md)
                              T12 media uploads (T11 consumes it)
                              T13 credit balance (wallet)   T15 one-button order flow (after T13)
                              T30 template factory  →  T31…T40 new templates (parallel, one session each)
Wave 2 (parallel):            T20 public pages  T21 customer pages  T22 admin pages  T23 private links
                              T24 points/referral  T25 share preview images + view stats
                              T26 custom design request / contact us (after T13 for paid quotes)
Future (switched off):        T14 online gateway · EasyConfirm auto-confirm (adapter exists, disabled)
                              T40s quality: T41 CSP enforce, T42 Next 16, T43 load test, T44 security audit
Owner-blocked:                T50 InstaPay reader app (optional), T51 phone code sender, T52 WhatsApp
```

**Conflict hot spots** (rule 0.2.3 covers them): `app.module.ts`, `env.schema.ts`, messages JSON, `package-lock.json` (only tasks that add a dependency touch it; regenerate it, never hand-merge), and the dashboard navigation (owned by T21; others add their link in one line).

**Reserved migration numbers:**

| Number | Task | Number | Task |
|---|---|---|---|
| 0021 | T10 | 0026 | T22 |
| 0022 | T12 | 0027 | T23 |
| 0023 | T13 | 0028 | T24 |
| 0024 | T15 | 0029 | T25 |
| 0025 | T21 | 0030 | T14 |
| 0031 | T26 | | |

---

## 2. Tasks

### T00 · Full-run development stack · branch `task/T00-full-run`
**Goal:** a fresh clone becomes a working platform on one machine with one command, with demo data, so anyone (owner, agent, CI) can click through the whole product.

**Owns:**
- `platform/scripts/dev-*.sh`, `platform/scripts/seed-dev.sql`;
- `platform/infra/docker-compose.dev.yml`;
- root `platform/package.json` scripts (`dev:full`, `db:reset`, `seed`);
- `apps/api/.env.development.example`, `apps/web/.env.development.example`;
- `platform/README.md` (a "Run it locally" section).

**Build:**
1. `scripts/dev-setup.sh`: checks Node and Postgres, creates database `invitations_dev`, sets the `app_api` password, applies all migrations, and loads the seed.
2. `scripts/seed-dev.sql` (idempotent):
   - users: 1 admin (`admin@example.test`), 2 customers;
   - every **sellable** template set live, with prices in the `prices` table;
   - 1 paid order with a published invitation and 10 RSVPs;
   - 1 pending manual order, and 1 unmatched payment event.
3. `npm run dev:full`: starts the API (port 3001) and the web (port 3000) together, with `COMMERCE_MODE=api`, `GUEST_MODE=api`, `PAYMENTS_PROVIDER=manual`, and the email sender `log`. **Login codes print in the API console in dev only.** Never in production; prove it with a test.
4. `infra/docker-compose.dev.yml`: Postgres 17 + Mailpit (a fake email inbox at localhost:8025) for people with Docker; then `EMAIL_SENDER=smtp` pointing at Mailpit.
5. README: "From zero to a clicked-through invitation in 10 minutes", with exact commands and the login steps.

**Tests:**
- A script test runs `dev-setup.sh` twice in CI and must be idempotent.
- An API e2e signs in with the seeded admin through the log sender capture.

**Done when:**
- From a clean environment, `scripts/dev-setup.sh && npm run dev:full` serves the landing page, sign-in works, and the admin sees the seeded pending payment.

### T01 · Finish the end-to-end test + screenshot run · branch `task/T01-e2e` (continue the existing branch `lane/E1-e2e`)
**Goal:** one Playwright smoke test proves the whole customer journey on every PR, and produces the review screenshots.

**Owns:** `platform/e2e/**`, the `e2e` job in `.github/workflows/platform-ci.yml`, and test-only email capture in `apps/api/src/auth` (only when `E2E_CAPTURE_EMAILS=1` and not production; with a test proving it is off in production).

**Build:**
1. Rebase `lane/E1-e2e` onto `main` (or restart from its ideas if rebasing is messier).
2. The spec, in Arabic:
   - sign in by email code;
   - gallery → pick a template → personalise → checkout (manual) → see the reference;
   - make the user an admin with SQL; the admin confirms the payment;
   - the invitation is active → edit one text → publish;
   - open the public page and RSVP from a fresh browser context;
   - the owner sees the RSVP.
3. Screenshot suite (`e2e/screenshots.spec.ts`): every route at 390/768/1280 × ar/en → artifact.
4. CI job: Postgres service → db-apply → seed → build → start api+web → Playwright → upload the report, traces and screenshots. Under 15 minutes.

**Done when:** the e2e job is green on the PR, and the screenshots artifact contains every route.

### T10 · Editor document model · branch `task/T10-editor-model` · migration 0021
**Goal:** a flexible, versioned invitation document the editor can manipulate safely.

**Owns:** `packages/shared/src/document/**`, `apps/api/src/invitations/document*.ts`, `0021_invitation_document.sql`, `supabase/tests/T10.sql`.

**Build:**
1. Shared Zod model:
   - `{schemaVersion, theme:{presetId, colors, fonts}, locales:{primary, enabled[]}, sections:[{id, type, variant, hidden, locked, props}]}`;
   - text props hold `{ar, en}`;
   - pure functions: `addSection`, `removeSection`, `moveSection`, `duplicateSection`, `toggleHidden`, `setVariant`, `applyThemePreset`, plus `migrate(old → latest)` from today's `InvitationData`.
2. **Per-plan rules** in shared: allowed section types, max sections, which sections are locked by the template.
3. API: the PATCH validates the whole document, rejects edits to locked sections and to section types outside the plan (`409 section_not_allowed`), and keeps the `If-Match` behaviour.
4. Migration: a `document_version` column if needed. **Existing rows must migrate losslessly.** Write a SQL plus a TS round-trip test over every template's sample data.

**Tests:** property-style unit tests for every pure function (order preserved, ids unique, locked untouched), migration round-trip for all 9 templates, API tests for every rejection.

### T11 · Site editor UI · branch `task/T11-editor-ui` · depends on T10, uses T12
**Goal:** the customer edits their site easily on a phone, tablet or desktop, with a live preview for all three.

**Read first:** `platform/docs/UI_DESIGN_PLAN.md` (the editor section is the spec).

**Owns:** `apps/web/src/editor/**`, `app/[locale]/app/invitations/[id]/edit/**`, messages namespace `editor`, `src/styles/editor.css`.

**Build:**
1. A **device preview switcher** (mobile 390 / tablet 768, with rotate / desktop 1280) using an iframe of the real invitation renderer at that width. It is always visible and remembers the last choice.
2. **Adaptive layout:**
   - phone: preview first; tap a section → a bottom-sheet editor;
   - tablet: split view (preview + side panel);
   - desktop: three panes (section outline / canvas / inspector).
3. Sections: add (picker filtered by plan and event type, with suggestions marked "Recommended"), remove, drag-to-reorder (touch-friendly, with keyboard and up/down buttons as a fallback), hide, duplicate. Style variants and theme presets switch in one tap.
4. Content:
   - fields generated from each section's schema;
   - Arabic/English side by side, or a toggle;
   - **text suggestions** (ready-made Arabic and English phrases per section, such as the invitation wording, the RSVP line and Quran/blessing lines; these are curated lists, no AI);
   - media slots (T12) with crop.
5. **Easy mode** (guided steps: names → date and venue → photos → music → review) and **advanced mode**.
6. Autosave with an always-visible "Saved / Saving / Offline" state; undo/redo (last 50 steps); a conflict message when another tab saved (409).
7. **Publish** button with the remaining-edits counter; "no edits left" and "expired" states with buy and extend links (T21).
8. First-time onboarding (3 short tips) and an empty state.

**Tests:** unit tests for the editor state; Playwright on mobile/tablet/desktop (add, reorder, edit Arabic text, change theme, preview switch, publish); screenshots.

**Done when:**
- A new customer completes easy mode on a 390px phone without help.
- A desktop user can reorder all sections with the keyboard.

### T12 · Media uploads (photos, video, music) · branch `task/T12-media` · migration 0022
**Goal:** customers upload their own media, safely and in sensible sizes.

**Owns:** `apps/api/src/media/**`, `0022_media.sql`, `supabase/tests/T12.sql`, `apps/web/src/media/**`, messages `media`.

**Build:**
1. Storage behind a `MediaStorage` port:
   - `local-disk` adapter (a VPS volume path from env, served by Caddy at `/media/*` with long cache);
   - `s3` adapter (Contabo / B2 / R2-compatible), selected by env.
2. Upload API: `POST /v1/media` (multipart; streamed, not buffered in memory).
   - Checks the **real file type from magic bytes** (jpeg/png/webp/heic → images; mp4/webm → video; mp3/m4a → audio).
   - **Per-plan size and count quotas** (from `TIERS`), and 30 uploads per user per day.
3. Processing:
   - images → WebP + 3 sizes (with the `sharp` dependency), EXIF stripped (privacy);
   - video and audio: stored as-is with a size cap now; an ffmpeg transcode job is a later task;
   - `media` rows go `processing → ready | rejected` (with a reason).
4. Media library page (grid, usage, delete if unused) and a picker used by the editor (T11).

**Tests:** a fake `.exe` renamed `.jpg` is rejected; over quota is rejected before anything is stored; EXIF is removed; ownership enforced (another user's media → 404).

### T13 · Credit balance (prepaid store credit) · branch `task/T13-balance` · migration 0023
**Goal:** a customer tops up once, then buys anything in one tap. Owner decisions needed: top-up bonus yes/no, minimum top-up (default EGP 100).

**Owner decisions (2026-10-24):**
- **Every account has a balance.**
- **At launch, all money comes in by manual top-up** (InstaPay or wallet transfer that the admin confirms). There is no gateway and no automatic confirmation yet.
- **Purchases always go through the balance.** If the balance is too low, the purchase is still created as an order with status **"awaiting balance"** and shown in **My orders**, with a "Top up and pay" button. When the admin confirms a top-up, the system **automatically pays the user's awaiting orders, oldest first, while the balance covers them.** It runs in one transaction per order, is idempotent, and writes the audit log.
- Awaiting orders are kept and never auto-expire while unpaid. The user can cancel one from My orders.

**Owns:** `apps/api/src/balance/**`, `0023_credit_balance.sql`, `supabase/tests/T13.sql`, `apps/web/src/balance/**`, `app/[locale]/app/balance/**`, messages `balance`.

**Build:**
1. SQL:
   - `credit_ledger` (append-only: top-up, purchase, refund, admin, bonus; amount_minor, currency EGP), with the balance = the sum (and a cached value);
   - `credit_topups` (pending / confirmed / rejected / expired, with a reference `TOP-XXXXXX` and unique piasters, reusing the allocator idea from 0016);
   - functions, all service_role only, all locking:
     - `confirm_topup(admin_or_system, topup_id, paid_minor, txn_ref)`;
     - `purchase_with_credit(user, order_id)`: in **one transaction** it locks, checks the balance, writes the ledger row and calls `fulfill_paid_order`. **It never goes negative and is idempotent.**
2. **Store credit, not a wallet:** it can't be withdrawn, can't be transferred, and is only spendable on the platform. Refunds go back to the balance.
3. Top-up sources:
   - **Now:** manual InstaPay/wallet transfer, confirmed by the admin on the pending payments screen (extend it to list top-ups).
   - **Future, built but switched OFF:** **payment events auto-confirm** (the existing matcher and the `easyconfirm` adapter, extended to top-ups). It stays disabled by env (`PAYMENT_EVENTS_ENABLED=false`, the default), with a test proving the webhook route returns 404 while disabled.
   - **Future:** gateway top-ups (T14).
4. Awaiting-balance orders:
   - a new order status `awaiting_balance` (migration);
   - `pay_awaiting_orders(user_id)` is called inside `confirm_topup`;
   - "Top up and pay" pre-fills the top-up amount with the shortfall;
   - the user can cancel an awaiting order.
4. API: `GET /v1/balance`, `GET /v1/balance/ledger`, `POST /v1/balance/topups`, `POST /v1/orders/:id/pay-with-balance`; admin confirm/reject top-ups.
5. Web: "My balance" (balance, history, top-up with copy buttons and a waiting state); at checkout, "Pay from balance" and "Top up and pay".

**Tests:**
- double spend: two parallel purchases with a balance for one → exactly one succeeds;
- confirming the same top-up twice is a no-op;
- a top-up auto-pays the awaiting orders it can cover, oldest first, and leaves the rest awaiting;
- cancelling an awaiting order;
- refund back to balance;
- an amount mismatch is not auto-confirmed;
- a non-admin cannot confirm;
- the payment-events webhook is unreachable while disabled.

### T14 · Online payment gateway (Paymob or Kashier) · branch `task/T14-gateway` · migration 0030 · **FUTURE: not at launch (owner: manual top-ups for now). Do not start until the owner asks.**
**Goal:** instant card and wallet payment, for both orders and top-ups.

**Owns:** `apps/api/src/payments/providers/<gateway>/**`, a provider registry entry, `0030_gateway.sql` if needed, tests.

**Build:** a `PaymentProvider` implementation:
- hosted checkout / intention API;
- **webhook HMAC verification**, idempotent event storage, and an amount and currency check;
- a reconcile job for lost webhooks;
- refunds.

Works for orders and for top-ups (T13). It is enabled only when its env vars are set; the sandbox is used in tests via recorded fixtures.

**Tests:** good signature, bad signature, duplicate webhook, wrong amount, lost webhook recovered by reconcile, refund.

### T15 · One-button ordering flow · branch `task/T15-order-flow` · migration 0024 (only if needed) · after T13
**Goal:** template → names → plan → pay → **the website is live**, with as few taps as possible.

**Owns:** checkout pay/result pages (coordinate with nobody else; these are yours now), `apps/web/src/order-flow/**`, messages `orderFlow`, a status endpoint `GET /v1/orders/:id/status` (light, rate-limited).

**Build:**
1. Inline sign-in inside checkout (email code without leaving the page).
2. The pay step is **balance only** at launch.
   - **Enough balance:** one tap "Pay from balance" → the website is live.
   - **Not enough:** the order is saved as **awaiting balance** (visible in My orders) and the top-up screen opens with the shortfall pre-filled. It shows the InstaPay/wallet transfer: the exact amount with piasters, the receiving IPA/number, copy buttons, an "Open InstaPay" link where possible, and an **"I've paid"** button.
3. A **live waiting screen** that polls the status every 5 seconds and turns green automatically when the admin confirms the top-up. The awaiting order is then paid automatically and the website goes live. After 30 minutes it shows a "Still waiting? Message us on WhatsApp" fallback with the reference prefilled. No gateway option appears until T14 exists.
4. Success → straight into the editor (T11) in easy mode, with the share link ready.

**Tests:** Playwright for each payment path (balance, transfer → admin confirm → auto-advance, expired, rejected); screenshots.

### T20 · Public pages · branch `task/T20-public-pages`
**Owns:** `app/[locale]/(legal)/**`, `app/[locale]/i/[slug]/ended/**` (or the state handling in the public page wrapper), `app/not-found.tsx`, `app/error.tsx`, messages `public`.

**Build:**
1. The **"Invitation ended"** page: couple names and date, "This invitation has ended", and a "Create your own" call to action. Used automatically when the API returns `state: ended`.
2. **Terms, Privacy and Refund** pages in AR and EN: clear placeholder text, marked "to be reviewed by a lawyer", with the PDPL (Law 151/2020) privacy points: what is stored, guest phone purge after 30 days, and how to request deletion.
3. 404 and 500 pages in brand style, with a way home.

**Tests:** ended state rendering, legal pages present in both languages, error pages don't leak details; screenshots.

### T21 · Customer pages · branch `task/T21-customer-pages` · migration 0025
**Owns:** `app/[locale]/app/{orders/[id]/receipt, upgrades, account, share}/**`, the dashboard navigation component, messages `customer`.

**Build:**
1. **Receipt page per order:** printable and print-styled, AR/EN, with order, amounts, method and reference. "Download as PDF" uses the browser's print function.
2. **Buy more edits / extend online period:** shows the current meters, the prices from the `prices` table, and a one-tap buy (balance or the order flow).
3. **Account settings:**
   - name, language;
   - link phone and email (verify by code);
   - **export my data** (JSON download: profile, orders, invitations; never other people's data);
   - **delete my account** (confirm by code; anonymises personal data, keeps paid-order records as legally required).
4. **Share and QR page:** the public link, a QR code (PNG download), and WhatsApp share text in AR/EN.

**Tests:** export contains only own data; deletion anonymises and blocks login; receipt totals match the order; screenshots.

### T22 · Admin pages · branch `task/T22-admin-pages` · migration 0026
**Owns:** `app/[locale]/admin/{templates, coupons, affiliates, refunds, settings}/**`, `apps/api/src/admin-{templates,coupons,affiliates,refunds,settings}/**`, `0026_admin_tools2.sql`, `supabase/tests/T22.sql`, messages `adminMore`.

**Build:**
1. **Templates manager:**
   - create or edit a template: names AR/EN, tier, category, event type, sort order, featured;
   - upload its assets (T12 storage), sample data AR/EN, preview at 3 widths;
   - status draft → live → retired;
   - a **license gate**: it cannot go live until every asset has a source and license.
2. **Coupons:** create a code (percent or amount, expiry, max uses), deactivate, usage list.
3. **Affiliates:** create an affiliate (code, commission %, payout details); share links + QR; stats per date range; "mark payout paid"; CSV export; self-referral flag. **Commission becomes payable only after the 7-day refund window.**
4. **Refunds:** refund an order to balance (T13) or mark it refunded manually; calls `refund_order`; writes the audit log.
5. **Settings:** payment instructions (AR/EN), notification email texts, support WhatsApp number. Stored in a settings table; admin only; audited.

**Tests:** non-admin 403 on every new route; the license gate blocks going live; affiliate attribution (a code beats a link, within 30 days); coupon limits.

### T23 · Private edit links + claim · branch `task/T23-private-links` · migration 0027
**Build:**
- Admins issue a secret link `/{locale}/edit/{token}`: 32 bytes, **stored hashed**, scoped to one invitation, revocable.
- The guard accepts it on the editor routes only.
- "Save to my account" claims the invitation after sign-in.

**Tests:** the token can't touch other invitations, orders or the profile; revoke works instantly.

### T24 · Points at checkout + referral · branch `task/T24-points` · migration 0028
**Build:**
- Verify and finish redeeming points at checkout (100 points = EGP 50), with the **30% total discount cap** (points + coupon + affiliate) in one shared function used by the web quote and the API.
- A personal referral link: when a friend's first paid order completes, the referrer gets +100 points.
- The points page shows points that are expiring soon.

**Tests:** cap math, a refund reverses points, referral is only granted once and not to yourself.

### T25 · Share preview images + view stats · branch `task/T25-share-stats` · migration 0029
**Build:**
- A dynamic **Open Graph image** per invitation (couple names, date, template art) so WhatsApp and Facebook shares show a rich card, cached.
- A view counter: one count per visitor per day, aggregated (`invitation_views`), and **no personal data**.
- An owner stats card: views, RSVPs, yes/no counts.

**Tests:** OG route returns a correct image size and type; counter de-duplicates; stats are visible only to the owner.

### T26 · Custom design request ("Customizable theme — Contact us") · branch `task/T26-custom-design` · migration 0031
**Goal:** a customer who wants a fully custom theme (their own colours, art, layout or monogram) asks for it from inside the product. The owner quotes a price, and the customer pays from their balance.

**Owns:** `apps/api/src/design-requests/**`, `0031_design_requests.sql`, `supabase/tests/T26.sql`, `app/[locale]/custom-design/**`, `app/[locale]/admin/design-requests/**`, messages `customDesign`.

**Build:**
1. **Entry points** (one line each; do not redesign those pages):
   - a "Want a custom design? Contact us" card at the end of the template gallery, on the pricing page, and in the editor's theme panel;
   - a "Contact us" link in the site footer.
2. A **request page** `/custom-design` that works signed in or as a guest (Turnstile/honeypot + rate limit):
   - fields: occasion, event date, names, the style they want (choices + free text), colours, optional reference images (uses T12 upload, max 5), an optional starting template, a budget range, a preferred contact channel (WhatsApp / phone / email), contact details, and language;
   - after sending, a confirmation screen plus a "Chat on WhatsApp" button with the request number prefilled.
3. A **general Contact us page** `/contact`: WhatsApp, email, and a simple message form. It saves to the same table with type `contact`.
4. **Admin "Design requests" page:**
   - a list with filters (new / contacted / quoted / accepted / in progress / delivered / declined), notes, and assignment;
   - **"Send quote"**: an amount + description → creates an **order of kind `custom_design` in status awaiting balance** for that customer, shown in their My orders. It is paid by balance like any order (T13).
   - "Mark delivered" links the finished template (created through the templates manager, T22) to the customer's invitation.
5. **Notifications:** the admin gets an email per new request; the customer gets emails on quote sent, payment received and delivered (AR/EN, through the existing NotificationsService).
6. Every status change writes the audit log.

**Tests:**
- public form rate limit and honeypot;
- only the requester and admins can see a request;
- a quote creates an awaiting-balance order, which is auto-paid after a top-up;
- a non-admin cannot change the status;
- screenshots of the request and contact pages at 3 widths × 2 languages.

### T30 · Template factory · branch `task/T30-template-factory`
**Goal:** making a new template takes hours, not days.

**Build:**
- `platform/docs/TEMPLATE_GUIDE.md`: the anatomy of a template, which section types exist, how the theme tokens work, the asset and license rules, the AR/EN sample data checklist, and the mobile-first rules.
- A scaffold script `npm run template:new -- <slug>` that creates the folder, data, CSS, test and registry entry from a skeleton.
- A visual test that renders each template at 3 widths × 2 languages and fails on horizontal overflow.

### T31–T40 · New invitation templates · one session per template · branch `task/T3x-<slug>`
**Goal:** many more **original, sellable** designs.

**Rules for every template:**
- **Original art only:** CSS/SVG ornaments drawn from scratch, or photos with a **commercial-use license** (Unsplash/Pexels licenses), each recorded in `apps/web/ASSET_LICENSES.md`. No third-party template copies.
- Arabic and English sample data, written naturally.
- It uses at least: hero, countdown, story or welcome, schedule, venue + map, dress code, gallery, RSVP, guestbook, and footer.
- Mobile first, with optional music, `prefers-reduced-motion` respected, and images under 250 KB each (WebP).
- A test file + screenshots + a registry entry (status `draft` until the owner approves).

| Task | Slug | Occasion | Concept / mood | Palette idea | Fonts idea |
|---|---|---|---|---|---|
| T31 | `nile-night` | Wedding | Night river, lanterns, gold reflections | navy, gold, ivory | Amiri / Cormorant |
| T32 | `andalus` | Wedding | Andalusian arches, zellige tiles, fountains | terracotta, teal, cream | Aref Ruqaa / Playfair |
| T33 | `khotoba-pastel` | Engagement | Soft pastel florals, rings motif | blush, sage, white | Tajawal / Poppins |
| T34 | `minimal-modern` | Wedding | Ultra-minimal typography, lots of white space | black, white, one accent | IBM Plex Sans Arabic / Inter |
| T35 | `garden-boho` | Wedding | Watercolor greenery, pampas grass | olive, sand, rust | El Messiri / Lora |
| T36 | `royal-velvet` | Wedding | Velvet curtain reveal, crest monogram | burgundy, gold | Amiri / Cinzel |
| T37 | `sebou3` | Baby (Sebou3) | Playful, moons and stars, cradle | baby blue / pink, white | Baloo Bhaijaan / Nunito |
| T38 | `birthday-pop` | Birthday | Confetti, bold shapes, photo collage | bright multi | Cairo / Montserrat |
| T39 | `graduation` | Graduation | Cap, scroll, achievement timeline | deep green, gold | Noto Kufi Arabic / Raleway |
| T40 | `ramadan-gathering` | Iftar / Eid gathering | Fanous lanterns, crescent, warm night | indigo, amber | Reem Kufi / Lora |

Fonts must be free for commercial use: Google Fonts, self-hosted through the existing `next/font/local` setup.

### T41–T44 · Quality and safety
- **T41 Enforce CSP:** add per-request script nonces via middleware, switch from report-only to enforced, and add a report endpoint that logs violations (rate-limited).
- **T42 Upgrade Next.js to 16:** follow the official upgrade guide, run every gate plus e2e, and fix breaking changes. This closes the self-hosting cache advisory.
- **T43 Load test (k6):** RSVP burst (200/s on one invitation), public page reads, checkout. Write a report with the bottlenecks found.
- **T44 Security audit:** walk through every API route: auth, ownership, rate limit, input validation and output data. Run `npm audit` and fix what's safe; write `docs/SECURITY_REVIEW.md` with findings and fixes.

### T50–T52 · Blocked on the owner (prepare only when unblocked)
- **T50 InstaPay reader app (Android, Kotlin), optional:**
  - reads bank SMS and InstaPay notifications on the owner's receiving phone;
  - accepts only whitelisted sender IDs;
  - parses amount, sender and note → a signed POST to `/v1/payment-events/<provider>`;
  - a heartbeat every 5 minutes;
  - sideloaded, not on Play Store.
  The owner is a mobile engineer and may prefer to build this himself.
- **T51 Phone code sender:** the WhatsApp Cloud API authentication template or an SMS gateway adapter for `OtpSender`; then turn on `PHONE_LOGIN_ENABLED`.
- **T52 WhatsApp notifications:** the same notifications as email, over WhatsApp templates (needs Meta verification).

---

## 3. What the owner must provide (nothing above is blocked by these except T14/T50–T52)

| # | Item | Needed for |
|---|---|---|
| 1 | ~~Payment gateway choice~~ **Decided 2026-10-24:** manual top-ups for now; gateway and EasyConfirm later (both kept ready but switched off) | T14 (future) |
| 2 | **Credit balance decisions:** top-up bonus yes/no; minimum top-up (default EGP 100). **Decided:** everyone has a balance; unpaid purchases wait in My orders and are paid automatically after a confirmed top-up | T13 |
| 3 | **Brand name + domain + logo** (the templates and emails use them) | T20, T21, go-live |
| 4 | **Which new template occasions matter most** (the T31–T40 list is a proposal), and whether a designer will review them | T31–T40 |
| 5 | Legal texts reviewed by a lawyer (Terms, Privacy, Refund) | go-live |
| 6 | Company / tax registration (receipts, gateways) | T14, go-live |
| 7 | VPS, Cloudflare, SMTP sender, backup storage, alert channel (Telegram / email) | go-live |
| 8 | EasyConfirm does not exist yet. Its adapter stays in the code, switched off; provide docs/key only when it launches | future auto-confirm |
| 9 | Meta Business verification (WhatsApp) or an SMS provider | T51, T52 |
| 10 | GitHub: allow Claude Code cloud to access the repo; create the cloud environment with the setup script in §0.3 | all cloud tasks |

## 4. Definition of "ready for a full run" (before going live)
- [ ] T00 + T01 merged: a fresh environment runs the whole product, and the e2e test is green on every PR.
- [ ] T10–T13, T15 merged: a customer can pick, pay (balance or transfer), edit with a device preview, publish and share.
- [ ] T20–T22 merged: no missing pages; the admin runs the business without SQL.
- [ ] At least 8 original templates live (5 today + T31–T40).
- [ ] T41–T44 done; the screenshots reviewed by the owner at 390/768/1280 in AR/EN.
- [ ] Then go live following `platform/docs/DEPLOYMENT.md`: deploy, live smoke test, backup restore test, and one real payment.
