# Invitation Platform — Launch Plan

> Turning this invitation template lab into a paid product: customers pick a template, pay, edit their details in a dashboard, and share a link where guests can RSVP.
> Status: **plan only, no code written yet.** Date: 2026-09-24 · updated 2026-09-29 (accounts, limits, loyalty, admin tools, AR/EN: §16).

---

## 0. TL;DR

| Topic | Decision |
|---|---|
| Templates today | **9 live** in `src/sites/`, plus **13 more** in the import pipeline |
| 🚨 Blocker | 7 of the 9 were rebuilt from **scraped thedigitalyes.com demos**. They **cannot be sold** as they are (see §2) |
| Stack | Next.js (App Router) on Vercel + Supabase (Postgres, Auth, Storage, RLS) + Cloudflare R2 for media |
| Backend | **Next.js itself** (Route Handlers + Server Actions, TypeScript) — one codebase for frontend and backend, no separate API server (§6.5) |
| Sign-in | Passwordless first: **WhatsApp OTP**, **email OTP code**, **Google**. Optional password. Account is created at checkout |
| Payments | **Egypt-only for launch** — Fawry (see §15.5 for why, not Paymob). Negotiated deals entered as manual orders by an admin (§16.5) |
| Media-buyer affiliate tracking | Unique `?ref=code` link **and** a promo code at checkout, both tied to the same buyer record so sales can be matched and paid out weekly/monthly (§15.6, admin tool in §16.5) |
| Hosting cost | **~$15–40/month** all-in on a VPS, or **~$0–20/month** on managed hosting (free tier covers early traffic) — see §15.2–15.4 for the trade-off |
| Break-even | ~**2–3 Classic sales a month** covers running costs; net ≈ EGP 990–1,190 per Classic sale (§16.1) |
| Pricing | 3 tiers + add-ons, one-time payment per event (§4). Test prices with real couples before launch |
| DDoS | Vercel Firewall + Attack Challenge + bot protection, Cloudflare Turnstile on forms, media on a CDN |
| Rate limits | Upstash Redis limits per phone, IP and invitation on OTP, RSVP, AI and uploads. Queues + backoff for our own calls to WhatsApp and LLM APIs |
| Dashboards | Customer dashboard (editor, guests, share, edits left, days online, points) + admin dashboard (accounts, sales, **add new demos**, **affiliate links + payouts**, customers, manual orders, abuse) (§7, §16.5–16.6) |
| Customer access | **Account by phone (WhatsApp OTP) or email** is the default; a **private edit link** for one invitation is the fallback, and can be claimed into an account later (§16.2) |
| Purchase limits | Each order gives a **number of published edits** and an **online period** (never ending before the event date). Extra edits and extensions are paid upsells (§16.3) |
| Loyalty | Accounts earn **points** (1 per EGP 10) and track **purchase count**, with Member / Silver / Gold levels (§16.4) |
| Languages | **Arabic (default) + English** everywhere: `/ar` and `/en` URLs, full RTL, bilingual invitations, messages, receipts and legal pages (§16.7) |
| AI | A **Theme Spec** JSON contract lets a server-side AI agent generate new designs and render reels (Remotion). The contract is built in Phase 1; the agent comes in Phase 4 |
| Time to MVP | ~8–10 weeks for 1–2 developers, after original designs are ready |

---

## 1. What we have today

### 1.1 Template inventory

**9 live templates** (routes in `src/registry/index.js`):

| # | Template | Category | Event | Source | Sellable? |
|---|---|---|---|---|---|
| 1 | Video Open Invitation | Full invitation | Engagement | Own prototype (Abdelrahman & Nourhan) | ✅ after checking the video/music license |
| 2 | Lace Photo Scratch | Save the date | Save the date | Own prototype | ✅ after checking the assets |
| 3 | Africa Safari | Full invitation | Wedding | thedigitalyes scrape | ❌ needs a redesign |
| 4 | Boho | Save the date | Save the date | thedigitalyes scrape | ❌ |
| 5 | Aventureros | Full invitation | Wedding (Spanish) | thedigitalyes scrape | ❌ |
| 6 | Maldives Beach | Full invitation | Wedding | thedigitalyes scrape | ❌ |
| 7 | Excellence | Full invitation | Wedding | thedigitalyes scrape | ❌ |
| 8 | Elegante | Full invitation | Wedding | thedigitalyes capture | ❌ |
| 9 | Citystars | Full invitation | Wedding | Built on the Elegante base | ⚠️ check the assets |

**Import pipeline:** 18 source zips in `imports/cloudflare-link/site-zips/`. Still unconverted: bloom, bridgerton, daynight, dolcevita, finca, floral, majestic, mediterranean, minimal-fun, minimalist, nautical, rosas, sweetlove (**13**). All are thedigitalyes demos, so the same legal blocker applies.

### 1.2 What we can reuse as-is (the real asset)

The **engine** is ours and has value:

- `src/registry/`: template enums, the data schema (JSDoc) and a lazy-loaded registry
- `src/shared/InvitationShell.jsx`: intro wiring, music, reveal-on-scroll, theme CSS variables
- **16 shared sections:** Hero, Countdown, Welcome, Schedule, Details, Map, MessageForm, Story, DressCode, Gifts, Rsvp, Faq, Credit, HotelList, Gallery, ImageDivider
- **2 intros:** VideoOpen, ScratchReveal
- The data-driven `sections[]` pattern. This is exactly what an editor and an AI generator need

### 1.3 Gaps before this can be a product

- No backend. RSVP and MessageForm submissions are fake (local state only)
- Client-only SPA routing, so no per-invitation OG tags. **WhatsApp link previews show nothing useful.** This matters, because most invitations will be shared on WhatsApp
- Content is hardcoded in `data.js` files, with no DB and no editor
- Media is heavy (≈95 MB in `public/assets/`) and served from the app, with no transcoding pipeline
- No Arabic/RTL support, even though the main market is Egypt/MENA
- Schema is JSDoc only, with no runtime validation (needed for the editor and the AI)

---

## 2. 🚨 Legal blocker: fix this first

7+ templates, and all 13 pipeline zips, copy the designs, layouts, videos, illustrations and copy of **thedigitalyes.com**, a competing commercial product. Their Typekit fonts are also licensed to *their* kit.

Selling these exposes us to copyright claims, payment-provider bans (Paymob/Paddle will drop a merchant over IP complaints) and hosting takedowns.

**Plan:**
1. Treat the scraped templates as **internal references only**. Keep them out of the production build and the public repo.
2. Build **original designs** on the same engine: new layouts, our own illustrations, licensed or AI-generated video, licensed music, and Google Fonts or other properly licensed fonts. The AI pipeline (§10) speeds this up.
3. Launch with **5–6 original templates**. Quality beats count.
4. Keep an `assets/LICENSES.md` recording the source and license of every image, video, song and font.
5. Remove the thedigitalyes Credit links and Typekit kit IDs from anything that ships.

---

## 3. Product: who uses it and how

### 3.1 Roles

| Role | Can do |
|---|---|
| **Visitor** | Browse the template gallery and open a live demo of each template |
| **Customer** (the couple or host) | Buy, edit, preview, publish, share, see RSVPs, export the guest list |
| **Guest** | Open the invitation, RSVP, leave a message, add to calendar, open the map |
| **Admin** (us) | See accounts, sales, templates and invitations; moderate; refund; manage the catalog |

### 3.2 Core journey (optimized to save the customer time)

```
Gallery → Live demo → "Use this template"
      → Quick setup (3 fields: names, date, venue) → instant live preview of THEIR invitation
      → Pay (WhatsApp/email OTP happens inside checkout, so there's no separate sign-up page)
      → Editor dashboard → Publish → Share via WhatsApp (pre-filled message + link)
```

**Key UX idea:** the customer sees their own names in the template **before** paying or signing up, which drives conversion. The draft is stored anonymously (cookie plus a DB row with a TTL) and claimed at checkout.

### 3.3 Guest journey

`WhatsApp link → rich preview card (photo + names + date) → intro animation → sections → RSVP (name + phone + count, no account) → "Add to calendar" + "Open in Maps"`

---

## 4. Pricing (hypothesis: validate with 10–15 real couples before launch)

Charge a one-time price per event, not a subscription. An invitation is used once.

| Tier | For | Includes | Suggested price |
|---|---|---|---|
| **Save the Date** | Simple announcement | 1 single-screen template, countdown, calendar button, 3 months online | EGP 499 |
| **Classic** | Most couples | Full invitation, all sections, RSVP up to 300 guests, guest-list export, 6 months online | EGP 1,299 |
| **Premium** | Big weddings | Everything in Classic + video intro + music upload + unlimited RSVP + guest messages + 12 months + priority WhatsApp support | EGP 2,499 |

**Add-ons:** custom subdomain (`ahmed-mona.ourdomain.com`), extra languages (AR + EN on the same invitation), a "done for you" setup by our team, an AI-generated reel of the invitation (§10), and a hosting extension.
**International:** USD pricing through the Merchant of Record ($29 / $59 / $99).
**Launch promos:** early-bird coupons, and referral credit for couples who bring friends.

Also needed: a clear refund window (e.g. full refund within 7 days and before publishing), an auto-archive date after the event, and Egyptian **e-invoicing** requirements (check with an accountant).

---

## 5. Sign-in: the fastest path for the customer

The goal is **zero-password, one-thumb sign-in on mobile.**

| Method | Why | Provider |
|---|---|---|
| **WhatsApp OTP** (primary in Egypt) | Everyone has WhatsApp. Phone is the main identifier | WhatsApp Cloud API (Meta) authentication template. Fallback: Twilio Verify / an Egyptian SMS gateway |
| **Email OTP code** (6 digits) | Works abroad. A code beats a magic link, because links open in the wrong in-app browser | Supabase Auth + Resend / Postmark |
| **Google sign-in** | One tap for people who use Gmail | Supabase Auth |
| Optional password | Some users want one | Supabase Auth |

Rules:
- **No separate sign-up page.** Sign-in happens inside checkout ("Where should we send your invitation link?" → phone or email → OTP).
- The customer confirms their phone or email with the OTP *explicitly*; we never create silent accounts (this addresses consent and invoicing). This was changed after the opencode debate.
- **Guests never sign in.** RSVP needs only a name and phone, protected by Turnstile.
- Link WhatsApp and email to the same account later from Settings.
- ⚠️ WhatsApp Cloud API needs **Meta Business verification**, which can take weeks, so **start it on day 1.** Each auth message costs money, so rate-limit hard (§8).

---

## 6. Architecture

### 6.1 Why leave the Vite SPA

- **Per-invitation OG tags / WhatsApp previews** need server rendering (the #1 reason)
- An API is needed for RSVP, payments, auth and uploads
- SEO for the gallery and landing pages

→ **Migrate to Next.js (App Router).** Shared sections, intros and CSS move over almost unchanged, since they are plain React components.

### 6.2 Stack

| Layer | Choice |
|---|---|
| Web app | Next.js 15+ (App Router), React 19, TypeScript |
| Backend / API | **Next.js** Route Handlers (`app/api/**/route.ts`) + Server Actions, running on Vercel (Node.js runtime). No separate backend service (§6.5) |
| Hosting | Vercel (app) |
| DB / Auth / Storage | Supabase (Postgres + Row-Level Security + Auth). Pick the EU region for proximity to MENA |
| Media | Cloudflare R2 + a CDN subdomain (`media.ourdomain.com`), with no egress fees for heavy video |
| Media processing | ffmpeg worker (transcode uploads to H.264/AV1 at a sensible CRF, generate posters, compress images to WebP/AVIF) |
| Validation | Zod schemas generated from today's JSDoc schema, shared by the editor, API and AI agent |
| Payments | Fawry (EGP, Egypt-only launch, §15.5); Kashier as the fallback. International (Paddle / Lemon Squeezy as Merchant of Record) only if we expand beyond Egypt. Negotiated deals = manual orders (§16.5) |
| Email | Resend or Postmark |
| WhatsApp | Meta WhatsApp Cloud API |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| Bot protection | Cloudflare Turnstile + Vercel bot protection |
| Jobs / queues | Inngest or Trigger.dev (webhooks, media transcoding, AI jobs, reminder messages) |
| Analytics | PostHog (product funnels) + our own admin metrics from the DB |
| Errors / uptime | Sentry + Better Stack (or UptimeRobot) |
| i18n / RTL | `next-intl`, with Arabic as a first-class language (RTL layouts, Arabic fonts such as Cairo, Tajawal or Amiri) |

### 6.3 Rendering strategy

- **Gallery / landing:** static, rebuilt when the catalog changes.
- **Public invitation `/i/[slug]`:** server-rendered and **cached at the edge** (ISR, with on-demand revalidation when the owner publishes an edit). RSVPs are separate API calls, so they don't bust the page cache. *(opencode suggested plain SSR because of RSVP writes; rejected, because RSVP never changes the page HTML.)*
- **Dynamic OG image** per invitation via `next/og` (couple photo + names + date), so every WhatsApp share gets a rich card.
- **Dashboard:** client-rendered behind auth.

### 6.4 Data model (Postgres)

```
profiles        id, phone, email, name, locale, role(customer|admin), created_at, signup_method
templates       id, slug, name, tier, category, event_type, theme_spec(jsonb), status(draft|live|retired), preview_media
orders          id, user_id, template_id, tier, amount, currency, provider, provider_ref, status, created_at
invitations     id, owner_id, template_id, order_id, slug(unique), data(jsonb, Zod-validated),
                status(draft|published|archived), published_at, expires_at, locale
invitation_views  invitation_id, day, count                 -- aggregated, not per-hit rows
rsvps           id, invitation_id, name, phone, guests_count, attending, note, created_at, ip_hash
messages        id, invitation_id, name, body, approved, created_at
media           id, owner_id, r2_key, kind, size, status(processing|ready)
coupons, refunds, audit_log, ai_jobs
```

**RLS:** anonymous users can read `invitations` only where `status='published'`. Owners read and write their own rows. RSVP inserts go only through a rate-limited API route. Admin access uses a server-side service role (never exposed to the client).

**Slugs:** reserved-word list, profanity filter, and suggestions such as `ahmed-mona-2026` when a slug is taken.

---

### 6.5 Backend: Next.js

The backend is the same Next.js app, not a separate server. That keeps one repo, one deploy, and one set of shared types and Zod schemas.

| Concern | How it runs in Next.js |
|---|---|
| Public API (RSVP, guest messages, OTP request/verify, uploads) | Route Handlers under `app/api/**/route.ts`, rate-limited with Upstash and protected with Turnstile |
| Dashboard mutations (edit invitation, publish, guest list, settings) | Server Actions, validated with the shared Zod schemas, then written to Supabase |
| Data access | Supabase server client (`@supabase/ssr`) using the user's session, so RLS applies. The service-role key is used only in server code for admin and webhooks |
| Auth | Supabase Auth session cookies, checked in `middleware.ts` for `/app` and `/admin` (admin role only) |
| Payment + WhatsApp webhooks | Route Handlers that verify the signature, record the event idempotently, and hand the work to the job queue |
| Long work (video transcoding, AI generation, reminder messages) | Not run inside a request. Queued to Inngest / Trigger.dev, called from Route Handlers |
| Runtime | Node.js runtime by default (Supabase, payment SDKs, crypto). Edge only for lightweight redirects in middleware |

If one job ever outgrows serverless (for example a long ffmpeg job), only that worker moves to its own service. The API stays in Next.js.

## 7. Dashboards and UI/UX

### 7.1 Design principles

- **Mobile-first.** Most customers will edit on a phone.
- **Arabic + English with full RTL.** Templates support both languages, e.g. names in Arabic calligraphy with English secondary text.
- **Live preview everywhere.** A split view on desktop, and a toggle between "Edit" and "Preview" on mobile.
- **Warm, premium, not generic:** our own brand system (cream, gold and deep green, or similar), a serif display font with a clean sans for UI. Avoid a default-shadcn look for the public side.
- **Accessibility:** WCAG AA contrast, 44px tap targets, and `prefers-reduced-motion` support for intros.
- **Performance budget:** public invitation LCP < 2.5 s on 4G. The intro poster loads first and the video streams after.

### 7.2 Public site

`/` landing (hero reel, how it works, pricing, FAQ, testimonials) · `/templates` gallery with filters (event type, style, language, price) · `/templates/[slug]` live demo + "Use this template" · `/pricing` · `/i/[slug]` the invitations themselves.

### 7.3 Customer dashboard (`/app`)

| Screen | Contents |
|---|---|
| **My invitations** | Cards with status, views, RSVP count, and days to the event |
| **Editor** | Left: sections list (reorder, toggle on/off). Right: live preview. Forms are generated from the Zod schema (names, date, venue + map search, schedule items, dress code, gifts / bank/Instapay details, FAQ). Media upload with cropping. Music picker from a licensed library |
| **Guests** | RSVP table (attending / not / pending), totals, search, **export CSV/Excel**, WhatsApp "remind" deep links |
| **Messages** | Guestbook moderation |
| **Share** | Copy link, WhatsApp share with a pre-filled message, QR code (for printed cards), OG preview |
| **Billing** | Orders, invoices, upgrade tier, extend hosting |
| **Settings** | Linked WhatsApp/email/Google, language, delete account (data protection) |

Also: edits-left and days-online meters, Extend / Buy edits, points, level and purchase history. See **§16.6**.

### 7.4 Admin dashboard (`/admin`, admin role only)

| Widget | Metric |
|---|---|
| **Accounts** | Total accounts, new today/7d/30d (chart), **by signup method** (WhatsApp / email / Google), by country |
| **Funnel** | Visitors → demo opened → draft created → checkout started → paid → published |
| **Revenue** | Total, by tier, by template, by provider, refunds, coupon use |
| **Templates** | Sales and demo views per template (which designs to build more of) |
| **Invitations** | Published, upcoming events, archived; total RSVPs collected |
| **Ops / abuse** | OTP sends and costs, rate-limit hits, flagged slugs or messages, failed webhooks, AI job queue |
| **Tools** | Look up a user by phone/email, impersonate for support (logged in `audit_log`), refund, extend expiry, manage the catalog and AI-generated templates awaiting approval |

Numbers come from Postgres views (exact counts). PostHog provides the funnel and behavior data.

Also: the **templates / demos manager** (add new demos with a license gate), the **affiliates manager** (links, codes, QR, payouts) and **customers & orders** tools (manual orders, private edit links, points). See **§16.5**.

---

## 8. Security: DDoS, rate limiting, abuse

### 8.1 DDoS / bot protection (layered)

| Layer | Measure |
|---|---|
| Edge (app) | **Vercel Firewall** (built-in L3/L4 DDoS mitigation) + custom WAF rules (block bad paths and abusive countries if needed) + **Attack Challenge Mode** switch in the runbook + Vercel bot protection |
| Edge (media) | Cloudflare in front of **R2 media only** (`media.` subdomain), which takes the heavy traffic off the app |
| Forms | **Cloudflare Turnstile** (invisible CAPTCHA) on OTP request, RSVP, messages and checkout |
| App | Upstash rate limits (§8.2), request body size limits, Zod validation on every input |
| Cost protection | Vercel spend limits / alerts, Supabase usage alerts, WhatsApp/SMS daily spend cap |

> We decided **not** to put Cloudflare's orange-cloud proxy in front of Vercel. Vercel recommends against it, and it interferes with its own edge caching, certificates and firewall. This point came from the opencode debate and we accepted it. Use Cloudflare for DNS (grey cloud) and R2/media only.

### 8.2 Rate limits we apply (starting values; tune from the data)

| Endpoint | Limit |
|---|---|
| OTP send (WhatsApp/SMS/email) | 3 per phone/email per 10 min · 10 per IP per hour · global daily spend cap |
| OTP verify | 5 attempts per code, then lock for 15 min |
| RSVP submit | 5 per IP per min · 1 per phone per invitation (upsert) · 500 per invitation per hour |
| Guest message | 3 per IP per 10 min + profanity filter + optional owner approval |
| Media upload | 30 per user per day, size caps per tier, MIME/type sniffing |
| Editor save (autosave) | Debounced on the client + 60 per user per min |
| AI generation | Per-tier quota (e.g. 3 reels per Premium order) + 5 jobs per user per hour |
| Public invitation GET | Cached at the edge, so it needs no limit. The WAF handles floods |
| Payment webhooks | No rate limit. Verify the **HMAC signature** + **idempotency key** instead (Fawry can resend) |

### 8.3 Avoiding being rate-limited *ourselves* (by third parties)

- WhatsApp Cloud API, email and LLM calls go through a **job queue** with concurrency caps, **exponential backoff + jitter** and retries.
- Cache map geocoding and OG images, and never call an external API on each page view.
- Media: transcode once and serve from the CDN forever.
- AI: batch jobs, prompt caching, and a small or cheap model for drafts with a large model only for final review.

### 8.4 Other must-haves before publishing

- Secrets only in Vercel/Supabase env vars. Nothing secret in client bundles. Rotate keys.
- RLS enabled on **every** table, with tests that an anonymous user can't read drafts or RSVPs.
- Security headers: CSP, HSTS, X-Frame-Options (allow embedding only on our demo pages), Referrer-Policy.
- RSVP phone numbers are personal data: owner-only access, deletion on request, auto-purge N months after the event (Egypt Personal Data Protection Law No. 151/2020 + GDPR for EU guests).
- Daily DB backups (Supabase PITR on the paid plan).
- Audit log for admin actions.
- Dependency audit (`npm audit` / Dependabot). Run `/security-audit` before launch.

---

## 9. Launch readiness checklist

- [ ] 5–6 **original** templates with a licensed asset register (§2)
- [ ] Next.js migration of the engine, sections, intros and registry
- [ ] Zod schema + editor + live preview
- [ ] Auth (WhatsApp OTP, email OTP, Google) + Meta Business verification done
- [ ] Fawry live + webhooks idempotent + refund flow (full money checklist in §16.10)
- [ ] RSVP / messages backend + guest-list export
- [ ] Dynamic OG images tested on WhatsApp, iMessage and Facebook
- [ ] Arabic RTL tested on all templates at 390px (no horizontal overflow; see cerebrum)
- [ ] Media pipeline (R2 + transcode); invitation LCP < 2.5 s on 4G
- [ ] Rate limits + Turnstile + Vercel firewall rules + spend alerts
- [ ] Admin dashboard metrics correct
- [ ] Legal pages: Terms, Privacy, Refund policy (AR + EN); company / tax registration for invoicing
- [ ] Sentry, uptime monitor, backups, incident runbook (incl. "turn on Attack Challenge Mode")
- [ ] Domain, brand name, logo, WhatsApp Business number, support inbox

---

## 10. AI agent: a reusable template contract, new designs and reels

### 10.1 The key idea: a **Theme Spec** as the contract

Every template becomes **data, not code**, split into 4 parts that an AI can read and write:

```jsonc
{
  "id": "nile-sunset",
  "tokens":   { "colors": {...}, "fonts": {"display": "Amiri", "body": "Cairo"}, "radius": 12, "spacing": "airy" },
  "layout":   { "intro": "video-open", "sections": [ {"type":"hero","variant":"full-bleed-video"}, {"type":"countdown","variant":"boxes"}, ... ] },
  "assets":   { "introVideo": "r2://...", "ornaments": ["r2://..."], "music": "lib://oud-romance-01" },
  "motion":   { "reveal": "fade-up", "intro": "envelope-open", "durationScale": 1.0 },
  "copy":     { "locale": ["ar","en"], "tone": "romantic-formal" }
}
```

- Shared sections gain **variants** (`hero: full-bleed-video | split-photo | monogram`, etc.) chosen by spec, not by custom CSS files per site. Today each site has its own `styles.css`; the goal is tokens + variants, with custom CSS as an escape hatch only.
- The same `InvitationData` (names, date, venue…) plugs into **any** Theme Spec, so customers can switch templates without re-entering data.
- The Zod schema for the Theme Spec is **built in Phase 1**, because the editor needs it anyway. The AI agent builds on it later.

### 10.2 The design-generation agent (server-side)

```
Brief ("Upscale Nile sunset wedding, Arabic-first, gold & terracotta")
  → LLM generates Theme Spec JSON (strict Zod / JSON-schema output)
  → Asset step: image model generates ornaments, backgrounds and poster; video model (optional) generates the intro loop
  → Render: headless Chromium renders the spec with sample data at 390px + 1280px
  → Critique loop: a vision model scores screenshots (contrast, overflow, hierarchy, "does it look generic?") → revise spec (max N rounds)
  → Automated checks: no horizontal overflow, WCAG contrast, LCP budget, asset licenses recorded
  → Admin approval queue in /admin → publish to catalog
```

- **Runs as a worker** (Inngest / Trigger.dev job, or a small Node service on Fly/Railway). Never inside a user request.
- **Model-agnostic interface.** Claude works well here: e.g. `claude-sonnet-5` for generation and `claude-opus-5-5` for critique. OpenAI/others can be swapped in behind the same interface.
- The agent can also be exposed as tools/MCP (e.g. `create_theme`, `render_preview`, `list_sections`), so you can drive it from Claude, ChatGPT or any agent client.
- A human approves every template before it goes live (quality + IP safety).

### 10.3 Reels and marketing videos

- **Remotion** (React-based video) reuses the *same* section components and Theme Spec to render **9:16 reels (15–30 s)**: envelope opens → names → date → venue → "RSVP at link".
- Two outputs from one pipeline:
  1. **Marketing reels** for our Instagram/TikTok (one per template, auto-generated when a template is published).
  2. **Customer add-on:** "Get a reel of your invitation" to post as a story. It sells well and costs little to produce.
- **ChatGPT / external tools path:** the agent also exports a **storyboard pack** (scene list, frame screenshots, captions, music cue, and prompts ready to paste into ChatGPT/Sora/other video models) for when you want generative footage beyond what Remotion renders.
- LLM-written captions + hashtags in Arabic and English, stored with each reel.

### 10.4 Why phase it later (agreed with opencode)

AI generation is only as good as the contract it writes to. Once the Theme Spec + variants are solid and 5–6 original templates prove the product sells, the agent becomes cheap to add. If it comes first, it produces broken layouts.

---

## 11. Roadmap

| Phase | Weeks | Deliverables |
|---|---|---|
| **0 — Foundations** | 1 | Brand name/domain, Meta Business verification started, Fawry merchant application, company/tax check, legal pages drafted, customer interviews on pricing |
| **1 — Engine port** | 2–3 | Next.js app, shared sections/intros ported, Zod schemas (InvitationData + Theme Spec + variants), Arabic/RTL, R2 media pipeline |
| **2 — Original templates** | 2–3 (parallel) | 5–6 original designs on the Theme Spec, licensed assets, demo pages |
| **3 — Commerce + dashboards** | 3 | Auth (WhatsApp/email/Google), checkout (Fawry), editor + live preview, RSVP/guests/messages, share + OG, admin dashboard, entitlements (edit limit + online period), admin templates manager, affiliates manager, points (build order in §16.9) |
| **4 — Hardening + launch** | 1–2 | Rate limits, Turnstile, firewall rules, Sentry, backups, load test, security audit, soft launch to 20 couples |
| **5 — AI studio** | 3–4 (post-launch) | Design-generation agent + admin approval queue, Remotion reels, storyboard export, reel add-on |

---

## 12. Rough running costs (early stage, estimates only; verify current pricing)

| Service | Early-stage expectation |
|---|---|
| Vercel Pro | ~$20 / member / month |
| Supabase Pro | ~$25 / month |
| Cloudflare R2 | Low (storage-based, no egress fees) |
| Upstash Redis, Resend, Sentry, PostHog | Free tiers are enough at first |
| WhatsApp auth messages | Per message, so budget per signup and cap daily spend |
| Fawry | Percentage per transaction (~1.5–2.5%, quoted per merchant, §15.5) |
| AI (Phase 5) | Per job, so price reels above the generation cost |

---

## 13. Debate log (Claude ↔ opencode)

| Topic | opencode's position | Outcome |
|---|---|---|
| Vite vs Next.js | Must leave Vite (OG tags, SEO) | ✅ Agreed |
| ISR vs SSR for invitations | SSR, because RSVP is write-heavy | ❌ Kept ISR: RSVP is a separate API call and doesn't change page HTML |
| Passwordless only | Wrong for Egypt; allow a password; no silent accounts | ✅ Partly: passwordless primary + optional password; explicit OTP confirmation, no silent accounts |
| Cloudflare proxy in front of Vercel | Breaks Vercel edge | ✅ Agreed: Vercel Firewall for the app, Cloudflare for DNS + R2 media only |
| Pricing | Possibly too high for Egypt | ✅ Lower entry tier added (EGP 499) and marked as a hypothesis to validate |
| AI first? | Defer | ✅ Contract now, agent after launch |
| Legal | Purge all derivative assets, not just layouts | ✅ Agreed (§2) |
| Missing items | OG images, slug moderation, RTL, e-invoicing, data-protection deletion, webhook idempotency | ✅ All added |

---

## 15. Backend, hosting cost, and affiliate tracking (added 2026-09-24)

### 15.1 There is no backend yet

Today's app is a static Vite + React site: no database, no accounts, no real RSVP storage — see §1.3. The dashboard, payments, and affiliate tracking below all need the backend to exist first. **That backend is Next.js** (Route Handlers + Server Actions on Vercel, with Supabase for DB/Auth/Storage, see §6.5), not a separate API server. This section prices what that backend needs to run on and adds the affiliate-link mechanism on top of it.

### 15.2 Where to run it: managed vs. a VPS

| | Managed (Vercel + Supabase, as in §6) | Self-run VPS (e.g. Hetzner, DigitalOcean) |
|---|---|---|
| Monthly cost at launch | **$0–20/mo** — both have free tiers that comfortably cover a few hundred invitations/month | **~$5–15/mo** for the VPS itself, but you set up and patch everything |
| What you get | Deploys, SSL, CDN, backups, DB, autoscaling — all handled | A blank Ubuntu box. You install Docker/Nginx/Postgres/SSL certs, monitor uptime, patch security updates, and rebuild your own CI |
| Media (R2) | ~$0.015/GB/month storage, no egress fee — a few dollars a month at this scale | Store on the same VPS disk, or still use R2/S3 separately (recommended regardless) |
| Scaling a spike (e.g. a viral wedding) | Automatic | You resize the VPS manually or it falls over |
| Time cost | Near zero — this is the point of "managed" | Real ongoing sysadmin time, which has its own cost even if the VPS itself is cheap |

**Recommendation: start managed.** A VPS isn't actually cheaper once you count the time to keep it patched, backed up, and monitored — and Vercel/Supabase's free tiers cover a real launch. Move to a VPS later only if a specific cost or compliance reason forces it (there usually isn't one at this scale).

**If you still want VPS pricing** (e.g. as a personal preference, or for a component you do want to self-host): a Hetzner **CX23** (2 vCPU / 4GB RAM / 40GB NVMe) runs about **€5.49–10.49/month** (~$6–11), which is enough for this app plus a Postgres database at launch scale. A step up (CPX-class, more RAM/CPU) runs roughly **€20–30/month** (~$22–33) — worth it once you have real traffic. [Hetzner Cloud Pricing 2026](https://vpsfor.dev/posts/hetzner-cx22-pricing-2026/), [Hetzner plans overview](https://northflank.com/blog/hetzner-cloud-server-price-increases).

### 15.3 Domain + subdomains

- A `.com` domain costs **~$12–20/year** at most registrars (Namecheap, Cloudflare Registrar, GoDaddy) — this is the only real recurring cost here. [Domain pricing 2026](https://www.hostinger.com/tutorials/domain-name-cost/).
- **Subdomains are free.** `weddingname.yourdomain.com` is just a DNS record under the one domain you already own — no extra registration or cost per customer, however many you create.

### 15.4 All-in monthly estimate at launch

| Item | Cost |
|---|---|
| Vercel (Hobby free tier, or Pro at $20/mo once you need a team seat / more bandwidth) | $0–20 |
| Supabase (free tier, or Pro at $25/mo once you outgrow it) | $0–25 |
| Cloudflare R2 media storage | ~$1–5 |
| Domain (`.com`, amortized monthly) | ~$1–2 |
| Fawry integration | No monthly fee — per-transaction only (§15.5) |
| **Total** | **roughly $2–50/month depending on tier**, realistically **under $20/month** for the first few months of real traffic |

This is materially cheaper than most people assume — the free tiers of Vercel/Supabase are generous enough that a self-hosted VPS mainly buys you *control*, not savings, at this scale.

### 15.5 Payments: Egypt only, and not Paymob

You've said: Egypt-only for now, and Paymob is out. For any custom/cheaper deal a customer negotiates directly, that's handled manually outside the automated checkout — no gateway integration needed for those.

**Fawry** is the recommended default for the automated checkout flow:
- Reaches **~97% of Egyptian households** through 300,000+ physical payment points, plus card/wallet/Meeza support online — the widest reach of any Egyptian option. [Payment gateways in Egypt 2026](https://nowpayments.io/blog/payment-gateway-egypt).
- Fees are typically **lower** than Paymob/Kashier's published 2.75% + 3 EGP — Fawry's fees run roughly **1.5–2.5%** depending on method and volume (quoted per merchant, so get their current rate directly).
- Needs a business/tax registration to onboard, same as any Egyptian gateway — this isn't unique to Paymob.

If Fawry's onboarding terms don't work out, **Kashier** is a close second (same 2.75% + 3 EGP structure as Paymob, but a different company/relationship if that's the actual concern) and **Geidea** is the option if you ever want in-person/POS payment at an event too.

### 15.6 Media-buyer affiliate link + payout tracking

You want: a link (and/or a code) each media buyer can promote, so every sale through them is attributed and you can pay them out weekly/monthly. This needs the backend from §6 — here's the concrete design:

**How it works:**
1. Each affiliate gets a row in an `affiliates` table: name, a unique `ref_code` (e.g. `ahmed01`), payout details (bank/InstaPay/Vodafone Cash — whatever you settle with them), and a running balance.
2. **Link tracking:** `yoursite.com/?ref=ahmed01` — the `ref` param is captured in a cookie on landing and carried through the whole checkout, so even if the visitor browses for a while before buying, the sale still credits the right affiliate.
3. **Code tracking:** at checkout, an optional "Have a code?" field. Entering `AHMED01` credits the same affiliate record — this covers the case where someone shares the code verbally or in an ad caption rather than a clickable link.
4. Every completed `order` row stores which affiliate (if any) it came from, by cookie-ref or by code, whichever applied.
5. **Payout report:** a simple admin view — filter orders by affiliate + date range, see total sales and the commission owed (a flat % you set per affiliate, or per campaign). You review it and pay them manually (bank transfer, InstaPay, etc.) weekly or monthly, exactly as you described. No automated payout integration is needed for this — that's the right amount of automation for a manual, negotiated payout process.
6. **Anti-fraud basics:** one affiliate shouldn't be able to buy through their own link and refund it for a payout — flag self-referrals (same phone/email as the affiliate) in the report for you to review, don't auto-block (a media buyer legitimately testing their own link is normal).

This is a small addition on top of the `orders`/`invitations` tables already planned in §6.4 — one new `affiliates` table and one nullable `affiliate_id` column on `orders`. Straightforward to build once the backend exists; no separate infrastructure needed.

---

## 16. Accounts, limits, loyalty, admin tools and bilingual launch (added 2026-09-29)

This section is written from two angles: as the **owner** (what makes money, what it costs, what to watch) and as the **engineer** (what to build, and where the rules are enforced). It builds on §3–§7 and §15 and doesn't replace them.

### 16.1 How the business makes money

**Revenue streams, most important first:**
1. **One-time invitation purchase** (tiers in §4).
2. **Upsells inside the dashboard:** extra edits pack, online-period extension, custom subdomain, AR + EN bilingual, reel (§10). These cost us almost nothing to deliver, so they're nearly pure margin. Each one should be a single tap.
3. **Repeat purchases.** The same family buys a save-the-date, then an engagement, a wedding, a baby announcement or a birthday. Points and levels (§16.4) reward this.
4. **Done-for-you setup** by our team: high margin per order, but it doesn't scale, so it's a premium add-on.

**Unit economics per Classic sale** (estimates: confirm the real Fawry rate and each affiliate's commission):

| Line | EGP |
|---|---|
| Price | 1,299 |
| Fawry fee (~2.5%) | −33 |
| Affiliate commission, if the sale was referred (e.g. 15%) | −195 |
| WhatsApp OTP + notification messages | −5 to −15 |
| Points given back (~5%, spent on a later order) | −65 |
| Hosting + media per invitation | ~−5 |
| **Net per referred sale** | **~EGP 990** |
| **Net per direct sale** | **~EGP 1,190** |

Fixed running cost is ~$20–50/month (§15.4), roughly EGP 1,000–2,500 at about EGP 50 per USD (check the current rate). That means **break-even is about 2–3 Classic sales a month**. Everything after that is profit, minus our own time.

**Rules that protect the margin:**
- Discounts don't stack without limit. Points + affiliate discount code + coupon together are capped at **30% off** an order.
- Affiliate commission is paid only after the refund window closes (7 days, §4), so refunded orders never get paid out.
- The "invitation ended" page (§16.3) and a small "Made with ‹brand›" line on every live invitation are free advertising to every guest.

**KPIs to review every week** (admin dashboard, §7.4):
- Demo → draft conversion
- Draft → paid conversion
- Average order value, including upsells
- Repeat-purchase rate
- Revenue vs. commission per affiliate
- Refund rate
- Cost per signup (OTP spend)

### 16.2 Customer access: an account first, a private link as the fallback

| Mode | When | How it works |
|---|---|---|
| **Account** (default, recommended) | Every normal checkout | **Phone number** verified by WhatsApp OTP is the main identifier. **Email** verified by email OTP is the alternative, and Google is optional (§5). The account holds all invitations, orders, receipts, points and level |
| **Private edit link** | The customer refuses to make an account, or we set up a done-for-you / manual order (§15.5) | A secret link `/{locale}/edit/{token}` that gives access to **one invitation only**. We send it on WhatsApp or email. Same editor, same limits |

**Private link rules:**
- The token is 32+ random bytes, **stored hashed**, and scoped to one invitation. The owner or an admin can revoke it and issue a new one if it leaks.
- The link cannot change the contact phone/email, request refunds, or see other orders.
- **No points and no purchase history on link-only access.** The editor shows a banner: "Save this invitation to your account to keep it safe and earn points". The customer verifies a phone or email, and the invitation and its order move into the account (a "claim"). This is the incentive to create an account.

**Identity details:**
- Phone numbers are stored in E.164 format (`+20…`). Egyptian local formats are normalized (`01x…` → `+201x…`) so the same person never ends up with two accounts.
- Phone and email can both be linked to one profile (§5).

### 16.3 What a purchase includes: an edit limit and an online period

Every paid order creates an **entitlement** on its invitation. **The limits are enforced on the server** (inside the Server Actions that publish, §6.5), not only in the UI. The meters in the dashboard are just a display.

Proposed limits (validate them in customer interviews):

| | Save the Date | Classic | Premium |
|---|---|---|---|
| **Published edits** (each "Publish changes") | 5 | 15 | 40 |
| Draft saves and previews | Unlimited | Unlimited | Unlimited |
| **Online period** from first publish | 3 months | 6 months | 12 months |
| Never goes offline before | event date + 7 days | event date + 14 days | event date + 30 days |
| Template switches after purchase | 1 | 2 | Unlimited (same tier) |

**What counts as one edit:** one "Publish changes" that updates the live page. Drafts and previews are free, so customers can experiment without worrying, and small fixes naturally get batched into one publish. The dashboard shows "7 of 15 edits left". Every publish stores a snapshot, so we can also offer "undo last publish".

**Timeline of an invitation:**

```
draft ─► published (online_until is set)
      ─► 7 days before the end: WhatsApp + email reminder (AR/EN) with an "Extend" button
      ─► ended: the public link shows a bilingual "This invitation has ended" page
               (couple names + "Create your own" call to action).
               The owner can still sign in, export the guest list and extend.
      ─► 30 days after ending: guests' phone numbers are purged (privacy, §8.4), and the invitation is archived.
               Extending restores it at the same link.
```

**Upsells at the limits** (suggested prices, to validate):
- Out of edits → "Add 10 edits: EGP 99"
- Near the end → "Keep it online 3 more months: EGP 199"

**Engineering notes:**
- A daily scheduled job (Inngest cron) sends reminders and moves invitations to ended/archived.
- The public route also checks `online_until` on every render/revalidation, so it never depends only on the job running. Any state change triggers ISR revalidation.
- Admins can add edits or extend dates for support cases, and every such change is written to `audit_log`.

### 16.4 Loyalty: points and purchase count

Every account shows its **purchase count**, **level** and **points balance**.

| Rule | Proposal |
|---|---|
| **Earn** | 1 point per EGP 10 actually paid (after discounts) |
| **Bonus points** | First purchase +50. Testimonial/review +50. A friend you referred buys +100 (customer-to-customer referral, separate from media-buyer affiliates) |
| **Redeem** | 100 points = EGP 50 off a future order (≈5% back). Points can pay for at most 30% of an order, and they can't be cashed out |
| **Expiry** | 12 months after they were earned, which keeps the outstanding liability bounded |
| **Levels** (by number of paid orders) | 1 = Member · 2–3 = **Silver** (+10% points) · 4+ = **Gold** (+25% points and a free 1-month extension on every order) |
| **Refunds** | Refunding an order reverses the points it earned. If they were already spent, the balance goes negative and is netted against future points |
| **Timing** | Points are granted only when the order is `paid` (after the verified payment webhook), never when checkout starts |

**Engineering notes:**
- Points are stored as an **append-only ledger** (`points_ledger`). The balance is the sum of the ledger, so there's always a history, and we never keep only a mutable counter.
- `purchases_count` is derived from paid orders (a view) and cached on the profile for display.

### 16.5 Admin dashboard: the new tools

These add to the admin dashboard in §7.4. All admin actions are written to `audit_log`.

**1. Templates / demos manager (`/admin/templates`), for adding new demos without a developer**
- **Create a template:**
  - name in Arabic + English, slug, category, event type
  - tiers it's sold in, optional price override
  - sort order and a "featured" flag
- **Design:** upload a Theme Spec JSON (validated with Zod on upload, with errors shown clearly), or pick a base layout + section variants in a form (§10.1).
- **Assets:** upload to R2 with automatic processing (video → H.264 + poster frame, images → WebP/AVIF). Each asset shows its size against the performance budget.
- **Sample data in Arabic and English,** so the public demo page works in both languages.
- **Preview** at 390px and 1280px, in AR and EN, before publishing.
- **License gate:** every asset needs a source and a license entry. **The Publish button stays disabled until they're all filled in.** This enforces §2 in the tool itself.
- **Status:** draft → live → retired. A retired template leaves the gallery but keeps working for customers who already bought it.
- **Stats per template:** demo views, drafts, sales and conversion, which tells us which designs to make more of.

**2. Affiliates manager (`/admin/affiliates`), for media-buyer links** (extends §15.6)
- **Create an affiliate:**
  - name, phone, payout method (bank / InstaPay / Vodafone Cash)
  - commission % (a default, overridable per affiliate)
  - optional discount for customers who use their code
- **Generated automatically:**
  - a ref code
  - share links in both languages (`/ar/?ref=ahmed01`, `/en/?ref=ahmed01`)
  - links to specific templates (`/ar/templates/nile?ref=ahmed01`)
  - a downloadable **QR code** for printed material
- **Attribution rule:** a code typed at checkout wins. Otherwise, the last `ref` link clicked within **30 days** gets the sale (stored in a cookie and on the anonymous draft).
- **Stats per affiliate and date range:** clicks, drafts, paid orders, revenue, refunds, commission owed, and flagged self-referrals.
- **Payouts:** "Mark as paid" with the amount, method, reference and date. It creates a payout record and reduces the balance owed. Export to CSV.
- *Later:* a read-only affiliate page on a private link, so media buyers can see their own numbers without asking us.

**3. Customers and orders (`/admin/customers`)**
- Search by phone, email, name or invitation slug.
- **Per customer:**
  - orders and purchase count
  - level and points balance/history
  - each invitation with its edits left and end date
- **Actions:**
  - add edits or extend an invitation
  - grant or deduct points, with a required reason
  - issue or revoke a private edit link
  - refund an order
  - **create a manual order** for the negotiated deals in §15.5 (provider `manual`, amount typed by the admin). It creates the entitlement and sends either an account invite or a private edit link.

### 16.6 Customer dashboard: the new parts

These add to the customer dashboard in §7.3.
- **Each invitation card:**
  - "edits left" meter
  - "days online left" counter
  - event countdown
  - **Extend** and **Buy edits** buttons
- **My account:**
  - purchase count and level badge
  - points balance and history, including points expiring soon
  - a referral link to share with friends
- **Orders and receipts:** every order with a downloadable receipt / e-invoice in Arabic or English.
- **Language switch** (العربية / English) always visible in the header, and saved on the profile.

### 16.7 Arabic and English, everywhere

Arabic is the default for Egypt, and the English version is complete, not partial. The same rules apply to the public site, the invitations, both dashboards and every message we send.

| Area | Rule |
|---|---|
| **URLs** | Locale prefix `/ar/…` and `/en/…` with `next-intl`. A first visit picks the locale from the saved preference → the browser's `Accept-Language` → Arabic. `hreflang` tags for SEO |
| **Layout** | `<html lang dir>` set per locale. CSS uses logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`), so one stylesheet serves both RTL and LTR. Arrows and chevrons flip, while logos, photos and videos don't |
| **Fonts** | Arabic: Cairo or Tajawal for the UI, Amiri (or similar) for display. English: the brand serif + sans. All from Google Fonts or properly licensed (§2) |
| **Numbers and dates** | Western digits (0–9) in both languages for phone numbers, prices and codes (common in Egypt and avoids mixed-digit bugs). Arabic month names in the Arabic UI. Dates are formatted with `Intl.DateTimeFormat` |
| **Money** | `EGP 1,299` in English, `1,299 ج.م` in Arabic |
| **Mixed text** | Phone numbers, codes, emails and URLs are wrapped in `<bdi>` / `dir="ltr"` so they don't come out reversed inside Arabic sentences |
| **Invitation content** | Every text field in `InvitationData` can hold `{ ar, en }`. The customer chooses Arabic only, English only, or both (the bilingual add-on shows a language toggle on the invitation) |
| **Messages** | OTP texts, WhatsApp templates, emails, reminders and receipts exist in both languages and are sent in the recipient's saved language. Meta must approve each WhatsApp template separately per language |
| **Legal pages** | Terms, Privacy and Refund policy in both languages. For Egyptian customers the Arabic version likely governs (confirm with a lawyer) |
| **Admin** | Admin UI in English with an Arabic toggle. Template and affiliate names are stored in both languages |
| **QA** | Every screen checked at 390px in both directions, with no horizontal overflow. A CI check fails the build if any translation key is missing in either language |

### 16.8 Data model additions (extends §6.4)

```
profiles                 + preferred_locale, level, purchases_count (cached), points_balance (cached)
orders                   + kind(new|extension|edits|addon), provider(fawry|manual),
                           affiliate_id, attribution(link|code), discount_total, points_redeemed, points_earned
invitation_entitlements  invitation_id, order_id, edits_allowed, edits_used, template_switches_left,
                         online_until, min_online_until
invitation_publishes     id, invitation_id, published_by, published_at, snapshot(jsonb)   -- edit count + undo
invitation_access_links  id, invitation_id, token_hash, created_by, created_at, revoked_at, last_used_at
points_ledger            id, user_id, order_id, delta, reason(purchase|bonus|redeem|refund|admin|expire),
                         expires_at, created_at
affiliates               id, name, phone, ref_code(unique), commission_pct, customer_discount_pct,
                         payout_method, active
affiliate_clicks         affiliate_id, day, landing_path, count                         -- aggregated
affiliate_payouts        id, affiliate_id, amount, method, reference, period_start, period_end, paid_at
templates                + name_ar, name_en, sample_data_ar, sample_data_en, sort_order, featured, license_complete
template_assets          id, template_id, r2_key, kind, size, source, license, license_url
```

**Where the rules live:**
- One server function, `assertCanPublish(invitationId)`, checks edits left, the online period and ownership. Every publish Server Action calls it.
- One function, `fulfillPaidOrder(orderId)`, runs once per verified payment webhook, in a single transaction and idempotently. It:
  - creates or extends the entitlement
  - writes the points ledger rows
  - credits the affiliate
  - updates `purchases_count`

### 16.9 Build order inside Phase 3 (§11)

1. Accounts (phone + email OTP) + orders + Fawry checkout and webhook → `fulfillPaidOrder`.
2. Entitlements: edit limit + online period + publish snapshots + the "ended" page.
3. Customer dashboard meters + Extend / Buy edits checkout.
4. Admin customers/orders tools + manual orders + private edit links + claim into an account.
5. Admin templates manager with the license gate.
6. Affiliates manager + attribution + payouts.
7. Points ledger + levels. This can ship a week after launch, because points can be awarded retroactively from existing paid orders.

### 16.10 "Ready to take money" checklist

These add to §9.

- [ ] Fawry merchant account live; a real payment and a real refund tested in production (card and Fawry reference code)
- [ ] Payment webhook → order paid → entitlement → points → affiliate credit tested end to end, including a duplicate webhook
- [ ] Edit limit and online period can't be bypassed by calling the API directly
- [ ] Expiry reminders and the "invitation ended" page work in Arabic and English
- [ ] An admin can add a new demo end to end, and the license gate blocks an incomplete one
- [ ] An admin can create an affiliate; their link and code both attribute a test sale; a payout can be marked paid
- [ ] Manual order → private edit link → claim into an account works
- [ ] Receipts / e-invoices in AR and EN; company and tax registration done
- [ ] Landing, pricing, FAQ and legal pages live in AR and EN
- [ ] WhatsApp Business number and a support routine (who replies, and how fast) in place

### 16.11 Go-to-market: the first 90 days (owner view)

- **Soft launch:** 20 couples at a discount, in exchange for a testimonial and permission to show their invitation as a public example.
- **Media-buyer affiliates:** start with 3–5 on **commission only** (no fixed fee), so we pay only for real sales.
- **Wedding industry partners:** give planners, photographers, makeup artists and venues their own affiliate codes. They meet couples at exactly the right moment.
- **Content:** one reel per template on Instagram/TikTok, with Arabic captions first (§10.3).
- **Built-in loop:** every guest who opens an invitation sees the "Made with ‹brand›" line and, after the event, the "Create your own" page. Every wedding markets the next one.
- **Review at day 30 / 60 / 90:** conversion, average order value, cost per affiliate sale and refund rate. Then adjust prices and limits (§16.3) from real data, not guesses.

---

## 14. Open decisions for you

1. **Brand name + domain.** Needed for Meta verification and payments.
2. **Launch market:** Egypt only first, or Egypt + Gulf (needs AED/SAR pricing, and more payment methods such as Tabby/Tamara)?
3. **Who designs the original templates:** an in-house designer, a freelancer, or AI-assisted with a designer's final pass?
4. **Scope of the "done for you" service:** it is profitable but doesn't scale. Should it be a premium add-on?
5. **Keep or retire** the 2 own prototypes (Video Open, Lace Scratch) as launch templates after an asset license check?
6. **VPS vs. managed hosting** (§15.2) — recommendation is managed to start; confirm or override.
7. **Fawry vs. Kashier vs. Geidea** (§15.5) — recommendation is Fawry for reach + lower fees; confirm once you get their actual merchant quote.
8. **Affiliate commission structure** — a flat % per sale, tiered by volume, or negotiated per media buyer individually?
9. **Edit limits and online periods per tier** (§16.3): proposed 5 / 15 / 40 published edits and 3 / 6 / 12 months online. Confirm or change.
10. **Points value and levels** (§16.4): proposed 1 point per EGP 10, 100 points = EGP 50, Silver at 2 orders and Gold at 4. Confirm or change.
11. **Allow link-only customers?** (§16.2): recommendation is yes, as a fallback, with no points until the customer claims the invitation into an account.
12. **Upsell prices** (§16.3): proposed EGP 99 for 10 more edits and EGP 199 for 3 more months online.
