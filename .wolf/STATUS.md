# STATUS — abdelrahman-nourhan-invitation

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Update this file at the end of every work phase so the next `/clear` resumes in 1 read.
> Last updated: 2026-10-07

---

## ✅ Done

### Phase 0 — Repo cleanup + baseline (commits b3effca, a2e9a6f)
- Old scraped export deleted, Vite + React app committed; `.claude/`/`.codex/` untracked; `imports/` gitignored; `TASKS.md` added

### Phase 1 — Template registry refactor (commits 2519b72, 13965e2)
- `src/registry/` — templateTypes enums, JSDoc schema contract, central registry (sync meta + lazy loadComponent)
- `src/shared/intros/` — VideoOpenIntro, ScratchRevealIntro (prop-driven, own CSS files)
- `src/shared/sections/` — Hero, Countdown, Welcome, Schedule, Details, Map, MessageForm
- `src/main.jsx` — routes/gallery from registry, React.lazy + Suspense; separate chunk per template
- Review fixes: section keys `id ?? type-index`, lace phantom footer removed, ScratchRevealIntro copy → props

### Phase 2 (first demo) — africa converted (commit 03a66b7)
- `src/sites/africa/` — data.js (10 sections, safari-editorial layoutFamily), AfricaInvitation.jsx, styles.css
- 5 new shared sections: Story, DressCode, Gifts, Rsvp (fake submit), Faq
- 26.6MB media → `public/assets/africa/` (hero-video.mp4 12MB is the size driver)
- Pipeline learnings: demo copy is SSR-baked in index.html (regex-extractable); hashed asset names; Typekit fonts need fallback stacks; ignore `_external/` + `_screenshot.png` scraper artifacts

### Prep for batch conversion — InvitationShell + media compression
- `src/shared/InvitationShell.jsx` — shared shell owning useRevealOnScroll, audio/music toggle, body background, theme CSS vars, intro wiring, sections.map loop
- Both `AfricaInvitation.jsx` and `VideoOpenInvitation.jsx` recomposed to ~40 lines each (local sections + map + one `<InvitationShell>`)
- Africa media compressed 26.6MB → 13.2MB (50%): hero-video 12MB→1.4MB, intro-video 1.7MB→874KB, background-music 4.4MB→2.9MB, intro-poster 1MB→168KB
- `TASKS.md` Phase 2 updated with "Demo conversion pipeline" subsection documenting the learned workflow

### Excellence demo converted (2026-07-23)
- `src/sites/excellence/` — data.js (10 sections, luxury-floral layoutFamily), ExcellenceInvitation.jsx, styles.css
- New shared section: Credit.jsx (reusable footer with portfolio link)
- 21 images compressed to `public/assets/excellence/` (intro-poster.jpg 1.0MB→117KB)
- Scraped live from tdy-excellence-template.thedigitalyes.com (local zip was broken)
- Content: Diana & Richard wedding, Peninsula Hotel Istanbul, wedding weekend itinerary

### Excellence fidelity fixes (2026-07-23)
- Implemented `TASKS-excellence-fixes.md`: real sage palette, Typekit `mrs-eaves`/`parfumerie-script` stacks, hero scroll cue, 3-box countdown, event-card celebrations, dress-code cards, hotel recommendations, RSVP field/copy shape, and monogram/couple/date credit stack
- New shared section: `src/shared/sections/HotelList.jsx`; shared `Hero`, `Countdown`, `Welcome`, `DressCode`, `Rsvp`, and `Credit` gained backward-compatible optional props
- Verified `npm run build`; Brave checks on `/excellence/` show no overflow at 390px or 1280px, no duplicate hero copy, non-looping hero video, Typekit 200 responses, and all new content present
- Shared-route smoke check: `/africa/`, `/boho/`, `/maldives/`, `/aventureros/` load without console/page errors; `/boho/` has unrelated existing 390px overflow (scrollWidth 402) from boho-local decorative images

### Excellence round 2 fixes (2026-07-23)
- Implemented `TASKS-excellence-fixes-2.md`: swapped React/data copy to Mohamad & Salma / 20 August 2026, restored timed white hero overlay, added richer `Schedule` timeline stops, and changed hotel names to script font
- `Hero.jsx` gained optional `overlayFadeOutAt`; when present it defers/restarts hero video playback after the intro content wrapper becomes visible, then fades the overlay at the configured video timestamp
- `Schedule.jsx` gained optional `items[].stops` timeline rendering with fallback to the old flat schedule shape
- Verified `npm run build`; Brave checks show hero overlay opacity 1 at hero video t≈1.1s and 0 at t≈6.1s, excellence overflow 0px at 390px and 1280px, two schedule timelines/eight stops, script hotel names, and no visible leftover Diana/Richard/23 July text outside the baked hero-video pixels

### Excellence additions/removals (2026-07-23)
- Implemented `TASKS-excellence-additions.md`: shared `Countdown` now accepts optional `columnLeftUrl`/`columnRightUrl`; Excellence wires `column-left.png` and `column-right.png` with scoped layered CSS
- Implemented pending `TASKS-excellence-removals.md` Task 1: removed Excellence `hotelList` section data, `HotelList` import/map entry, and hotel references from gallery metadata while preserving the reusable shared component/assets/schema
- Verified `npm run build` succeeds; live browser/overflow checks could not run because Vite dev server fails to bind in this sandbox with `listen EPERM` on both `127.0.0.1:5173` and `0.0.0.0:5173`

### Excellence countdown restyle (2026-07-23)
- Implemented `TASKS-excellence-countdown-style.md`: Excellence countdown panel is now ivory/cream with sage title/subtitle/labels, large italic serif numerals, vertical dividers between stats, and no dark gradient/vignette mask
- Change is CSS-only in `src/sites/excellence/styles.css`; shared `Countdown.jsx` and other sites were not touched
- Verified `npm run build` succeeds; live dev/preview browser checks remain blocked in this sandbox by `listen EPERM`

### Elegante demo converted (2026-07-23)
- Implemented `TASKS-elegante.md` from local capture folder only: `src/sites/elegante/` with Andrea & Pedro content, video-open intro, ambient hero video overlay, countdown, welcome/gallery, venue, alternating day programme, dress code, pre-wedding events, location/transport, accommodation, gifts, RSVP, and Credit footer
- Added shared `Gallery.jsx` and `ImageDivider.jsx`; extended shared `Schedule`, `Details`, `DressCode`, `HotelList`, `Gifts`, `Rsvp`, `Welcome`, and `InvitationShell` with backward-compatible optional props
- Copied used local assets to `public/assets/elegante/` with stable kebab-case names; compressed intro poster and both videos with ffmpeg; omitted background music because the manifest listed an MP3 URL but no local response body was saved
- Verified `npm run build` succeeds and emits a separate `EleganteInvitation` lazy chunk; live browser/overflow checks could not run because Vite dev server still fails to bind in this sandbox with `listen EPERM`

### Platform plan written (2026-09-24)
- `PLATFORM_PLAN.md` — full SaaS launch plan: template inventory (9 live, 13 in pipeline), legal blocker (thedigitalyes-derived templates not sellable), Next.js+Supabase stack, WhatsApp/email/Google OTP auth, Paymob+MoR pricing tiers, customer + admin dashboards, DDoS/rate limits, AI Theme Spec agent + Remotion reels, roadmap. Plan only — no code.

### Batch conversion — 7 templates: floral, finca, sweetlove, dolcevita, daynight, bridgerton, bloom (2026-09-24)
- Converted 7 templates this batch: **floral**, **finca**, **sweetlove** (product id `dulce-amor`), **dolcevita** (product id `dolce-vita`), **daynight**, **bridgerton**, **bloom** — closes the "Remaining complete demos" Next-phase item that previously listed boho, aventureros, maldives, bloom, bridgerton, daynight, dolcevita, sweetlove/dulce-amor, finca (boho/aventureros/maldives were already done earlier; the 7 above were the remaining unconverted ones from that list).
- Each template: `src/sites/<name>/` with `data.js` + `*Invitation.jsx` + `styles.css`, composed from `src/shared/InvitationShell.jsx` + shared sections/intros (reused `Hero`, `Countdown`, `Welcome`, `Schedule`, `Details`, `Map`, `MessageForm`, `Story`, `DressCode`, `Gifts`, `Rsvp`, `Faq`, `HotelList`, `Credit`, `Gallery`, `ImageDivider` as needed per demo).
- Registered in `src/registry/index.js` with `React.lazy` per site; added 7 new `layoutFamily` enums in `src/registry/templateTypes.js`: `FLORAL_ROMANTIC`, `FINCA_RUSTIC`, `SWEETLOVE_ROMANTIC`, `DOLCE_VITA_LAKE`, `DAYNIGHT_DUAL`, `BRIDGERTON_REGENCY`, `BLOOM_GARDEN`.
- Template catalog is now **16 templates total** (2 seed + africa + boho + aventureros + maldives + excellence + elegante + citystars + the 7 new).
- Final `npm run build` passes with all lazy chunks emitted (one per template) — verified build success and file/media wiring.
- **Open caveats (explicit):**
  - (a) None of the 7 have been visually verified in a real browser — this sandbox's Vite dev server has a known `EPERM` binding issue (`listen EPERM` on `127.0.0.1:5173` and `0.0.0.0:5173`) that blocked Playwright/live viewport checks; only build success and file/media wiring were verified.
  - (b) Bloom's intro video is an `ffmpeg` concat of 2 separate source clips into one — `ffprobe` duration matches the sum of the originals, but the join point has not been visually watched for a seam/glitch and should be spot-checked before shipping.

---

## 🚀 Current quest — Platform build, Phase 1 (started 2026-09-29)

> Plan: `PLATFORM_PLAN.md` (§6.5 backend = Next.js, §16 accounts/limits/points/admin/AR-EN). New app lives in `platform/` (the Vite lab in `src/` stays untouched until the engine is ported).
> Workflow: Claude writes briefs + reviews; **opencode (`opencode/claude-sonnet-4-5` or `opencode/claude-haiku-4-5`) and Codex implement. NOTE 2026-09-29: opencode Zen returned 402 "Insufficient account funds" — use Codex until topped up. Codex sandbox has no network: it writes files, Claude runs `npm install` + gates, then sends a delta brief**. User-allowed models only: Haiku 4.5 / Sonnet 4.5 via opencode, or Codex. **No model-vs-model debates.** Briefs live in the session scratchpad (`briefs/p1-*.txt`); re-create from this list if lost.

**Task queue (sequential; review + commit after each):**
1. ✅ `p1-scaffold` — Next.js 15 app in `platform/`: next-intl `ar` (default)/`en`, RTL via CSS logical props, fonts (Cairo / Cormorant / Inter), bilingual landing placeholder, `formatMoney`/`formatDate`/`<Bidi>`, `check:i18n` script, `/api/health`, vitest. (Codex; committed; gates green)
2. 🚀 `p1-schemas` — Zod contracts in `platform/src/lib/schemas/`: `InvitationData` + all section types, localized `{ar,en}` text, Theme Spec, tier entitlements (`computeOnlineUntil`/`canPublish`), points/levels/discount-cap pure functions, round-trip test against the real `src/sites/*/data.js`. (Codex)
3. ⏳ Port shared sections + intros + `InvitationShell` into `platform/` as TSX components, RTL-safe (logical CSS), driven by the Zod types; one original demo route `/[locale]/templates/[slug]`.
3b. ✅ **Monorepo split (5f413a0) + NestJS API skeleton (7fe28fe)** — apps/web + apps/api + packages/shared; API has auth guard, roles, throttling, /v1/health, /v1/me, /v1/invitations/:id/entitlement; 47 api + 20 web + 125 shared tests; live boot verified. ✅ Follow-up done: Supabase retry:false + SUPABASE_TIMEOUT_MS (prod hang 7.05s -> 0.017s; hanging host fails at the 1s timeout), test files excluded from dist. (original plan text:) (owner decision 2026-09-29: backend = NestJS, see PLATFORM_PLAN.md §6.5): move `platform/` → `apps/web`, add `apps/api` (auth guard, health, OpenAPI, throttler, Redis), move Zod schemas + pure functions to `packages/shared`.
4. ✅ (committed 2416fc0) Supabase migrations (profiles, orders, invitations, entitlements, points_ledger, affiliates, templates + RLS + tests) — plan §6.4 + §16.8.
5. ⏳ Phase 3 items in the order of PLATFORM_PLAN.md §16.9 (accounts/OTP → Fawry + `fulfillPaidOrder` → entitlements/dashboard meters → admin customers/manual orders → admin templates manager → affiliates → points).

**Blocked on the owner (don't stall coding):** brand name/domain, Meta Business verification, Fawry merchant account, company/tax registration, original template designs (PLATFORM_PLAN.md §2, §14).

---

## ⏸ Deferred — 6-template live re-scrape (was the next quest before the platform build)

> **Status: NOT started.** The 6 templates below have NOT been converted yet — no implementation work has begun on this phase. Low priority: thedigitalyes-derived templates cannot be sold (PLATFORM_PLAN.md §2).

**Goal:** Convert the 6 remaining templates whose zips are flagged `partial/broken` in `imports/cloudflare-link/current-download-status.json`. These **must be live-rescraped** from their `thedigitalyes.com` demo URLs (same rescue approach previously used successfully for `excellence` / `tdy-excellence-template`), **NOT** unzipped from `imports/cloudflare-link/site-zips/` — the downloaded zips for these 6 are broken/partial (2–19 MB vs ~30–59 MB for complete ones).

### Remaining 6 templates (partial/broken — need LIVE RE-SCRAPE)

| Product id (current-download-status.json) | Live target URL (`batch-report.json` `target_url`) |
|---|---|
| `majestic` | `https://majestic-template.thedigitalyes.com/?embed=1` (`majestic-template.thedigitalyes.com`) |
| `mediterranean` (`mediterranean-edition`) | `https://mediterranean-template.thedigitalyes.com/?embed=1` (`mediterranean-template.thedigitalyes.com`) |
| `minimal` (`minimalist`) | `https://minimalist-demo.thedigitalyes.com/?embed=1` (`minimalist-demo.thedigitalyes.com`) |
| `minimal-fun` | `https://minimal-fun-demo.thedigitalyes.com/?embed=1` (`minimal-fun-demo.thedigitalyes.com`) |
| `nautical` | `https://nautical-template.thedigitalyes.com/?embed=1` (`nautical-template.thedigitalyes.com`) |
| `rosas` | `https://rosas-template.thedigitalyes.com/?embed=1` (`rosas-template.thedigitalyes.com`) |

Source of truth for the "partial/broken" flag: `imports/cloudflare-link/current-download-status.json` (`counts.partial/broken: 7` total — 1 is `maison-doree`/`tdy-excellence-template` already rescued as `excellence`; the 6 above are the remaining). Source for `target_url`: `imports/cloudflare-link/batch-report.json` `sites[].target_url` per site.

### Context
- User previously confirmed wanting all 13 templates (including these 6) to work, but the live-rescrape implementation work itself has **not begun** — do not unzip the broken zips; re-scrape each `target_url` live and then run the normal conversion pipeline.
- Also note `PLATFORM_PLAN.md` §14 open decisions (brand/domain, market, who designs original templates) remain pending — batch-converting thedigitalyes demos is still flagged there as not useful for a sellable product without original designs, but this Next phase tracks the conversion work the user explicitly requested.

### Acceptance criteria (when started)
1. Each of the 6: gallery card + working route, `data.js` conforms to `src/registry/schema.js`, composed from `InvitationShell` + shared presets
2. Media via `public/assets/<name>/` with ffmpeg compression; `npm run build` emits a lazy chunk per template; no `EPERM`-blocked visual check left un-noted

---

## 📁 Active architecture

- **Stack:** Vite + React, lucide-react icons, CSS custom properties per template
- **Key modules:** `src/registry/` (types + schema + registry), `src/shared/` (intros + sections), `src/sites/` (per-template glue + data + CSS)
- **Patterns:** Data-driven sections[] array keyed by `id ?? type-index`; React.lazy per template; shared components with no hardcoded content; intro CSS lives with the intro component
- **Workflow:** opencode CLI implements (driven by `.claude/agents/opencode-delegate.md` agent), Claude reviews each phase against TASKS.md gates

---

## ⚠️ External blockers (don't block coding)

- Commits a2e9a6f..03a66b7 are local-only (not pushed) — push pending user approval
- Vercel deploy (Phase 3) needs the user's Vercel account/login

---

## 🔧 Useful commands

```bash
npm run dev      # dev server: /, /video-open-invitation/, /lace-photo-scratch/, /africa/
npm run build    # production build — verify separate lazy chunks
npm run preview  # preview built output
```

---

## 📚 References (read IF needed)

- `TASKS.md` — phased task list with Done-when gates
- `.wolf/cerebrum.md` — User Preferences + Do-Not-Repeat + Decision Log
- `.wolf/anatomy.md` — token-efficient file index
- `.wolf/buglog.json` — known bugs + fixes


## ⚠️ Push decision pending (2026-09-30)
Origin repo `waleed750/invitation_sample` is **PUBLIC**; 11 local commits are unpushed. Scraped thedigitalyes templates are ALREADY public on origin/main (PLATFORM_PLAN §2 says they must not be sold/published). A push would newly publish `platform/` code, the expanded PLATFORM_PLAN.md (pricing, margins, affiliate strategy) and `.wolf/` notes. Waiting for the owner to confirm (or make the repo private / move platform work to a private repo) before pushing.


## ✅ Platform walking skeleton (2026-10-06) — commits 35df7ae..HEAD
- Engine: intro lookup (`intro-kind.ts`), `ShuttersIntro`, `data-layout` scoping, `shell.css` split; `mashrabiya` layoutFamily
- Shared: `catalog.ts` (license gate: live needs license on every asset), TIERS feature flags, `toDbTier/fromDbTier`
- Original demo **Mashrabiya** (`/[locale]/templates/mashrabiya`, own SVGs + Google Fonts, no external assets)
- Landing + `/templates` gallery (prices from TIERS), comparison table; checkout `/[locale]/checkout/[slug]?tier=&kind=` with MOCK gateway (OTP 123456, cookie `inv_demo`, `COMMERCE_MODE=mock`, prod needs `ALLOW_DEMO_COMMERCE=1`)
- Dashboard `/[locale]/app` (sign-in, home, invitation publish + share/QR, orders, points, account) — all via `CommerceClient`
- Scraped video-open demo intentionally KEPT (user decision) but unlisted; never live/priced (PLATFORM_PLAN §2)
- agy lanes `gemini` / `debate` in ~/.config/delegate-skills/config.json

## ✅ Phase 2 batch (2026-10-07) — commits 020092a, 9f4b58e, 569fabe
- Draft-demo pipeline: `data-template` scoping, draft registry (`listDraftTemplates/getTemplateAny`), private `/[locale]/preview/[slug]` (dev or PREVIEW_DRAFTS=1), `sync:drafts` copies legacy media into gitignored `apps/web/public/assets/drafts/` (226MB, never committed); **africa** ported as proof (draft)
- NestJS commerce slice: checkout (server pricing, live templates only), HMAC mock webhook (raw body, amount check, idempotent via fulfill_paid_order), dev settle route (auth + owner only), orders/invitations/points/templates, PATCH /v1/me, migration 0004 (+ `create_pending_checkout` RPC, service_role only). 88 api tests
- Public invitation `/[locale]/i/[slug]` + RSVP/guestbook via `InvitationPublicStore` (demo file store `.demo-data/`, gitignored), tier gating, honeypot + rate limit; dashboard Guests screen + owner-only CSV export; verified owner+guest in separate browsers (ar+en)

## 🚀 Next quest
1. **Real auth + `ApiCommerceClient`** (`COMMERCE_MODE=api`): Supabase phone/email OTP login on web, bearer token to /v1, swap mock cookie state; real `InvitationPublicStore` (Supabase) replacing the demo file store. Needs a Supabase project + env (owner)
2. Demo port batch D (agy, running): citystars, excellence, elegante as drafts. Remaining 10 demos need LOCAL section components first -> design a generic `custom` section (schema `{kind, data}` + per-template component map) before batch-porting; value is limited (drafts can never be sold, PLATFORM_PLAN §2) — consider replacing with ORIGINAL designs instead
3. Original templates #2-#5 (the real product; legal blocker §2), admin dashboard (templates/affiliates/customers), Fawry provider behind `PaymentProvider`, Playwright e2e in repo (ad-hoc scripts only so far), Lighthouse/a11y pass
4. Owner decisions pending: brand name/domain ("Invitely" placeholder), Fawry merchant account, push (repo is public), Supabase project
