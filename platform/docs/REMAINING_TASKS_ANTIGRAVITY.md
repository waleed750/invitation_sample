# Remaining tasks: briefs for Antigravity

> Written 2026-10-24. Everything below is **not done yet**. The finished work (T00–T23, most of T24) is on branch `beta-version` (PR #1).
> Give Antigravity one task at a time. Each brief is self-contained: goal, what already exists, what to build, tests, done-when.
> The original plan (`CLOUD_TASKS.md`) still holds for rules and gates; this file adds what was learned while building T00–T24.

## 0. Start here

**Branch:** work on `beta-version` (or a branch cut from it). Never push to `main`; the owner merges.
**Order:** T24 (web part) → T25 → T26 → T30 → T31–T40 → T41 → T42 → T43 → T44. T14 (gateway) and T50–T52 stay deferred.
**Run locally:** see `platform/README.md` ("Run it locally") or `.wolf/STATUS.md` → "Commands".

### 0.1 Rules that were learned the hard way
1. **After changing the API**: `npm run build -w @platform/shared && npm run build:api`, then restart `bash scripts/e2e-serve.sh api` (port 3001). The e2e run uses the *built* API; a stale build gives confusing 400/401s.
2. **After changing `next.config.ts` or `src/security/headers.ts`**: restart the web dev server. Headers are read once.
3. **New migration**: never edit an existing one. Add `00NN_name.sql`, apply to the dev DB with `DATABASE_URL_ADMIN=postgresql://postgres:postgres@127.0.0.1:5432/invitations_dev bash scripts/db-apply.sh`, then `npm run gen:api-client` and commit the regenerated `packages/api-client` files.
4. **SQL tests run on a CLEAN database** (they fail on the seeded dev DB): create an empty DB, `bash scripts/db-apply.sh`, `bash scripts/db-test.sh`. One `supabase/tests/Txx.sql` per task, plain plpgsql `assert`, wrapped in `begin … rollback`, first line after `begin`: `select set_config('request.jwt.claims','',true);`. No pgTAP.
5. **Business logic pattern (use it):** a service-role-only plpgsql function that takes the acting user's id, re-checks the role, writes `audit_log`, and returns `jsonb {ok, reason}`. The API repository calls it through `DbService.asService`; the service maps the answer with `common/rpc-result.ts` (`unwrapRpc`). Only `*.repository.ts` files may touch the database.
6. **Web talks to the API only.** Server components use `apiCall` / `apiText` from `src/balance/server.ts` (bearer token). Browser code calls the API with `credentials: 'include'`; if you add a request header the browser sends, add it to `allowedHeaders` in `apps/api/src/security/apply-security.ts` (this bit us twice: `If-Match`, `X-Edit-Token`).
7. **i18n:** one new top-level namespace per task, identical keys in `ar.json` and `en.json`; `npm run check:i18n` must pass. Arabic must read naturally. CSS **logical properties only**.
8. **e2e rule:** a click before React hydrates is ignored. Wrap the first interaction in `await expect(async () => { await click(); await expect(result).toBeVisible(); }).toPass({timeout: 45_000})`. Never use `pkill -f` (it kills your own shell); use `fuser -k <port>/tcp`.
9. **No `NODE_ENV === 'test'` branching, no DB driver in `apps/web`, no secrets in code.**
10. **Commit messages** end with the attribution lines the session gives you. Do not create a second PR; pushing updates PR #1.
11. **Money:** API and DB use integer minor units (piasters). The web `Order.amountEgp` is major units. Use `formatMoney` (whole pounds) in the dashboard and `formatEgp` (2 decimals) on receipts.
12. **Shared files are append-only**: one import line in `app.module.ts`; your own block in env schema files; your own namespace in messages.

### 0.2 Gates (all must pass before you say "done")
```bash
cd platform
npm run build -w @platform/shared
npm run typecheck && npm run lint
(cd apps/api && npx jest) && (cd apps/web && npx vitest run)
npm run check:i18n   # run inside apps/web
npm run build:api
npm run gen:api-client && git status --short packages/api-client
# clean DB:
createdb-equivalent + DATABASE_URL_ADMIN=… bash scripts/db-apply.sh && bash scripts/db-test.sh
# e2e (API + web running): cd e2e && npx playwright test tests/<your>.spec.ts --project=chromium
```
Last known green numbers: API jest 567, web vitest 345, 14 SQL test files, e2e specs journey/balance/media/order-flow/public-pages/editor/customer/admin-more/private-links.

### 0.3 What exists (so you do not rebuild it)
- Editor (T11): `apps/web/src/editor/**`, routes `/app/invitations/[id]/edit` and `/edit/[token]`.
- Customer pages (T21): receipts, `/app/upgrades`, `/app/share/[id]`, account export/delete.
- Admin (T22): `/admin/{templates,coupons,affiliates,refunds,settings,invitations/[id]}`; partner links `/{locale}/r/<code>` set cookie `ref`.
- Private edit links (T23): header `x-edit-token`, decorator `@EditTokenRoute()` (editor routes only).
- Balance (T13), media (T12), document model (T10), order flow (T15).
- Latest migration is `0028_points_referral.sql`. **Next free migration numbers: 0029 (T25), 0031 (T26)** as the plan says.

---

## T24 (remaining web part): points at checkout + referral
**Already done (migration 0028, SQL test `supabase/tests/T24.sql`, API, tests green):**
- Points are reserved by open orders (`spendable_points`): the same points cannot back two pending orders.
- Referral: `get_referral_code`, `attach_referrer`, trigger `reward_referrer` (+100 points to the referrer on the friend's first paid *new* order, once, never self, reversed by a refund), `points_expiring_soon`.
- API: `GET /v1/points` now also returns `spendable`, `expiringSoon {points, firstExpiry, days}` and `referral {code, invited, rewarded, rewardPoints}`; `POST /v1/checkout` accepts `friendCode` (`f-xxxxxxxx`) and returns 409 `insufficient_points` when points are already held.
- The 30% cap (`applyDiscountCap`, `maxRedeemableEgp` in `packages/shared/src/points.ts`) is the single function used by the API and the web quote.

**To build (web only):**
1. `apps/web/src/commerce/types.ts` + `api-schemas.ts` (`pointsSchema`, `mapPoints`): carry `spendable`, `expiringSoon`, `referral` as **optional** fields (the mock client returns none). Extend `CommerceClient.getPoints()` return type.
2. Route `app/[locale]/invite/[code]/route.ts` (copy `app/[locale]/r/[code]/route.ts`): validate `^f-[a-hj-np-z2-9]{8}$`, set an httpOnly 30-day cookie `friend=<code>`, redirect to `/{locale}`. No API call.
3. `commerce/ref.ts`: add `FRIEND_COOKIE` and `parseFriendCookie`; in `commerce/api.ts` `startCheckout`, add `friendCode` to the request body from the cookie (see the existing `partnerRef()`), only for `kind: 'new'`.
4. Points page `app/[locale]/app/points/page.tsx`:
   - a **referral card**: the invite link `${NEXT_PUBLIC_SITE_URL}/{locale}/invite/{code}`, copy button (`CopyButton`), WhatsApp share (`https://wa.me/?text=…`, Arabic and English text), "friends invited / rewarded" counts, "you get 100 points when a friend's first order is paid";
   - an **expiring-soon banner** when `expiringSoon.points > 0` ("X points expire on <date>");
   - ledger reason label for `referral` (and `bonus`, `refund`, `admin`, `expire`; today only purchase/redeem are labelled);
   - show `spendable` next to the balance when it is lower than the balance ("N are held by orders waiting for payment").
5. Checkout form: when the API answers 409 `insufficient_points`, show a clear message (add `errors.insufficient_points` in the checkout namespace) and reset the redeemed points to 0.
6. Messages: add to the existing `dashboard.points` block (both languages).

**Tests:** vitest for `parseFriendCookie`; Playwright `e2e/tests/points.spec.ts`: sign in as a new customer, open `/ar/invite/<code of another customer>` (get that code from the other user's `/ar/app/points` page), run the checkout up to the pay page, check the points page shows the referral card and counts; screenshot `/app/points` at 390/768/1280 in ar+en with no horizontal scroll.
**Done when:** a customer can copy their invite link, a friend following it and paying their first order gives the referrer +100 (check via SQL test already; e2e checks the link, cookie and card).

---

## T25 · Share preview images + view stats · migration `0029_share_stats.sql`
**Goal:** WhatsApp/Facebook shows a rich card for `/{locale}/i/<slug>`, and owners see simple stats.

**Build:**
1. **Open Graph image per invitation:** `app/[locale]/i/[slug]/opengraph-image.tsx` (Next `ImageResponse`, 1200×630, PNG). Content: couple names (Arabic shaped correctly: load a font file with Arabic glyphs, e.g. Amiri or Noto Kufi from `public/fonts` or `next/font/local`; `ImageResponse` cannot use web fonts by URL at build), event date, template colours from the published document's theme. Cache it (`revalidate = 3600`, or `Cache-Control: public, max-age=3600`). An ended or missing invitation returns a generic brand card, **never 404 and never leaking private data**. Also set `generateMetadata` `openGraph.images` and `twitter.card = 'summary_large_image'` (the ended-page fix in that file must stay).
2. **View counter, no personal data:** table `invitation_views` already exists with `(invitation_id, day, count)`. Add the SQL function `count_invitation_view(p_slug text, p_visitor text)` (service role). "One count per visitor per day": the **web** computes a visitor key = HMAC-SHA256(secret, ip + user-agent + day) truncated, and the API stores only a per-day set of those hashes **in memory/Redis-less form**: simplest compliant design is a table `invitation_view_keys(invitation_id, day, key_hash)` with a unique index; insert `on conflict do nothing` and increment `invitation_views.count` only when a row was inserted; delete keys older than 2 days in the same function. No raw IP, no cookie id stored. Never count bots (user-agent contains `bot|crawler|spider|preview|whatsapp|facebookexternalhit`), never count the owner.
   API: `POST /v1/public/invitations/:slug/view` (public, throttled 60/min, body `{visitor: string(64)}`), called best-effort from the public page via a small client component (or a route handler) after load.
3. **Owner stats card** on `/app/invitations/[id]`: views (today / 7 days / total), RSVPs yes/no/guests (reuse existing RSVP queries). API `GET /v1/invitations/:id/stats` (owner only; another user gets 404).
4. Messages namespace `shareStats`.

**Tests:** SQL `supabase/tests/T25.sql` (dedupe per visitor per day, a new day counts again, bots ignored, old keys purged, unknown slug); API specs (owner-only stats, throttle); Playwright: `GET /ar/i/demo-nour-omar/opengraph-image` returns `image/png`, 1200×630 (read PNG header bytes), cache header present, ended invitation still returns an image; visiting the page twice as the same visitor counts once.
**Done when:** pasting an invitation link in a WhatsApp preview checker shows the image; the owner sees counts that do not double on refresh.

---

## T26 · Custom design requests · migration `0031_design_requests.sql`
**Goal:** a customer asks for a fully custom theme from inside the product; the owner quotes a price; the customer pays from their balance.

**Owns:** `apps/api/src/design-requests/**`, `0031_design_requests.sql`, `supabase/tests/T26.sql`, `app/[locale]/custom-design/**`, `app/[locale]/contact/**`, `app/[locale]/admin/design-requests/**`, messages `customDesign`.

**Database:**
- `orders.kind` check currently allows `new, extension, edits, addon`; add `custom_design` (drop and recreate the check in the migration). `fulfill_paid_order` must not break for this kind: it falls into the existing `else` branch that only earns points, which is acceptable; confirm with a test.
- Table `design_requests(id, number serial/short code, type check in ('custom_design','contact'), user_id nullable, status check in ('new','contacted','quoted','accepted','in_progress','delivered','declined'), occasion, event_date, names, style_choices jsonb, style_text, colors, reference_media jsonb (max 5), starting_template_id, budget_range, contact_channel check in ('whatsapp','phone','email'), contact_value, locale, message, assigned_to, admin_note, quote_order_id, delivered_template_id, created_at, updated_at)`. RLS: owner (user_id) reads own; admins everything; guests cannot read.
- Functions (service role, audited, admin re-check): `submit_design_request(...)`, `admin_set_request_status(admin, id, status, note)`, `admin_send_quote(admin, id, amount_minor, description)` → creates an order `kind='custom_design'`, `status='awaiting_balance'`, `provider='balance'` for the request's user (requires a signed-in requester; a guest request must be linked to an account by email/sign-in first, otherwise `reason: 'no_account'`), stores `quote_order_id`, status `quoted`; `admin_mark_delivered(admin, id, template_id)`.
- The quote order is paid by balance exactly like any order (`purchase_with_credit`, auto-paid by `confirm_topup`). When it becomes paid, move the request to `accepted` (a trigger on orders, like `count_coupon_use` in 0026).

**API:** `POST /v1/design-requests` (public, honeypot field `website`, throttle 5/min/IP; if the caller is signed in, link `user_id`), `GET /v1/design-requests/mine`, admin: list with filters + notes + assignment, status change, send quote, mark delivered. Notifications through `NotificationsService`: admin email on each new request; customer email on quote sent, payment received, delivered (AR/EN). Only the requester and admins can read a request (404 for others).

**Web:**
- `/custom-design`: form with all fields; reference images use the existing media upload (T12) when signed in (max 5), guests may skip images; Turnstile is optional: use the honeypot + rate limit if no key is configured. After sending: confirmation + "Chat on WhatsApp" button prefilled with the request number (number from Admin → Settings `support_whatsapp`; see `GET /v1/settings/public`).
- `/contact`: WhatsApp, email, a short message form saved with `type='contact'`.
- Entry points, one line each, do not redesign the pages: card "Want a custom design? Contact us" at the end of the template gallery, on the pricing page, and in the editor theme panel (`editor/DetailsPanel.tsx` `ThemePanel`); a "Contact us" link in the footer.
- `/admin/design-requests`: list with status filters, notes, assignment, "Send quote" (amount + description), "Mark delivered" (pick a template). Add to the admin nav (`admin/layout.tsx`).

**Tests:** SQL T26 (only requester/admin read, quote creates an awaiting-balance order, auto-paid after top-up, non-admin cannot change status, audit rows); API e2e for 401/403/404 and honeypot/rate limit; Playwright for the public form at 3 widths × 2 languages (screenshots), admin sends a quote, customer sees it in My orders.
**Done when:** the full loop request → quote → balance payment → delivered works and every status change is in the audit log.

---

## T30 · Template factory
**Goal:** a new template takes hours, not days.

**Read first:** `apps/web/src/templates/` (look at `registry.ts`, one existing template folder such as `mashrabiya`, its `data.ts`, CSS and test), `packages/shared/src/invitation.ts` (the 22 section types and their Zod schemas), `apps/web/src/engine/` (shell and sections), `apps/web/ASSET_LICENSES.md`.

**Build:**
1. `platform/docs/TEMPLATE_GUIDE.md`: anatomy of a template; every section type with its props; theme tokens (`--background --foreground --muted --ivory` plus the template's own CSS file); intro types (`none`, video-open, scratch, shutters, envelope); asset and license rules (`ASSET_LICENSES.md` entry required for every non-code asset); the AR/EN sample-data checklist; mobile-first rules (images ≤ 250 KB WebP, `prefers-reduced-motion`, no horizontal scroll at 390px, logical CSS properties).
2. `npm run template:new -- <slug>` (script in `apps/web/scripts/`): creates `src/templates/<slug>/{data.ts,styles.css,index.ts,<slug>.test.ts}` from a skeleton with all required sections and AR/EN placeholders, adds the registry entry with status `draft`, and fails if the slug exists or is not kebab-case.
3. A visual test (Playwright, file `e2e/tests/templates.spec.ts`) that, for **every template in the registry**, renders `/{locale}/preview/<slug>` at 390/768/1280 in ar and en and fails on horizontal overflow (`scrollWidth - clientWidth > 0`) or on a console error. Save screenshots to `e2e/screenshots/T30/`.
4. Unit test: every registry template's data parses with `parseInvitationData` and has sample copy in both languages.

**Done when:** running the scaffold for a fake slug produces a template that passes the new visual test with no manual edits (delete the fake one afterwards).

---

## T31–T40 · Ten new templates (one session each)
Use T30's scaffold and guide. **Rules for every template:** original art only (CSS/SVG drawn from scratch, or photos with a commercial-use license such as Unsplash/Pexels, each recorded in `apps/web/ASSET_LICENSES.md`); natural Arabic and English sample data; sections used: hero, countdown, story or welcome, schedule, venue + map, dress code, gallery, RSVP, guestbook, footer; mobile first; optional music; `prefers-reduced-motion` respected; images ≤ 250 KB (WebP); fonts free for commercial use (Google Fonts through the existing `next/font/local` setup); registry status `draft` until the owner approves; a test file; screenshots at 3 widths × 2 languages.

| Task | Slug | Occasion | Concept / mood | Palette | Fonts |
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

**Done when (each):** the T30 visual test passes for the slug, the unit test passes, the template appears in the admin template list (T22) as a draft with its assets listed, and the PR description lists the screenshot names.
Important: a template must also work in the **editor** (T11): open it with an invitation, add/reorder sections, change the theme preset, and confirm the live preview renders it. Add the template's theme presets to `packages/shared/src/document/presets.ts` only if it needs its own (append-only).

---

## T41 · Enforce the Content Security Policy
Today the CSP is **report-only** (`apps/web/src/security/headers.ts`, `buildCsp`). Build:
- A per-request nonce in `apps/web/src/middleware.ts` (generate 16 random bytes, base64), passed to the response CSP header (`script-src 'self' 'nonce-…' 'strict-dynamic'`) and to Next via the request header `x-nonce` so inline scripts get it. Keep `'unsafe-eval'` only in development.
- Allow what the product really uses: Google Maps iframe (`frame-src https://www.google.com https://maps.google.com`), the editor preview frame (`frame-src 'self'`, already set), `img-src` for media host and `data:`/`blob:`, `connect-src` for the API origin, `font-src 'self' data:`. `frame-ancestors 'self'` only for the embeddable paths (`preview`, `demo`, `pick-preview`, `editor-frame`).
- Switch the header name from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`, and add `report-uri`/`report-to` pointing at a new endpoint `POST /v1/csp-report` (API, public, **throttled 30/min**, body size ≤ 8 KB, accepts `application/csp-report` and `application/reports+json`, logs a trimmed record, never stores anything, always returns 204).
- Update `headers.test.ts` and add an e2e that loads the home page, a template, the editor and the admin pages and fails on **any** CSP violation event (`page.on('console')` for "Refused to" and `securitypolicyviolation`).
**Done when:** every page in the e2e suite runs with the enforced policy and zero violations.

## T42 · Upgrade Next.js to 16
Follow the official upgrade guide (current is Next 15). Run every gate and **all** e2e specs; fix breaking changes (async request APIs, `next-intl` version compatibility, the middleware → proxy rename if applicable, `next/image`, fetch caching defaults). Do not change product behaviour. Note the resolved self-hosting cache advisory in the PR description.
**Done when:** build, unit tests and all e2e specs are green on Next 16, with the real last lines pasted.

## T43 · Load test (k6)
Scripts in `platform/loadtest/` (k6 binary is not in the repo; document the install). Scenarios: (1) RSVP burst, 200 requests/second for 30s on one published invitation (`POST /v1/public/invitations/:slug/rsvp`, unique names/phones, expect 2xx or the documented 403/429 only); (2) public page reads (`/ar/i/<slug>`) at 100 rps; (3) checkout creation (authenticated, 20 rps). Run against the e2e stack, record p50/p95/p99, error rate and the first bottleneck (DB pool size, rate limiter, Next render). Write `docs/LOAD_TEST.md` with numbers, bottlenecks and proposed settings. Fix a bottleneck only when the fix is small and safe; otherwise list it.

## T44 · Security audit
Walk **every** API route (`apps/api/src/**/*.controller.ts`): authentication, ownership/role, rate limit, input validation (Zod), and what data the response exposes. Special attention: the three `@EditTokenRoute()` routes, `/v1/__e2e/last-code` (must be refused in production), media upload, account deletion/export, partner and referral attribution, CSV export (formula injection is handled by `csvCell`; verify), `/v1/edit-links/resolve` (no oracle beyond valid/invalid), `x-edit-token` never logged. Run `npm audit` and fix what is safe. Write `docs/SECURITY_REVIEW.md` (route table with findings and fixes). Add regression tests for each fix. Also run the Claude `/security-audit` and `/security-review` skills and `/code-review` over the branch and paste their summaries.

---

## Deferred (do not start)
T14 online payment gateway (owner decision: manual top-ups for now) · T50 InstaPay reader app · T51 phone-code sender · T52 WhatsApp notifications.

## Owner-side items (nothing in code can finish these)
Real SMTP credentials; production domain and TLS; payment instructions and the support WhatsApp number (Admin → Settings); legal text review (terms, privacy, refund pages from T20); analytics choice; a real Egyptian phone provider for T51; Meta verification for T52.
