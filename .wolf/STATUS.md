# STATUS — abdelrahman-nourhan-invitation

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Update this file at the end of every work phase so the next `/clear` resumes in 1 read.
> Last updated: 2026-07-23

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

---

## 🚀 Next phase

**Goal:** Phase 2 continued — batch-convert the remaining 9 complete demos, then Phase 3 deploy to Vercel.

### Acceptance criteria
1. Each converted demo: gallery card + working route, data conforms to schema, composed from shared presets
2. Repo media growth controlled (consider ffmpeg CRF re-encode of hero videos before batch — else ~250MB growth)

### Open decisions
- Compress videos before batch-converting? (recommended)
- Extract shared `InvitationShell` (useRevealOnScroll + audio/music toggle + intro wiring is now duplicated in AfricaInvitation.jsx and VideoOpenInvitation.jsx) before adding 9 more copies
- Visual check of `/africa/` in a browser before batch (fidelity verified structurally only)

### Remaining complete demos (imports/cloudflare-link/site-zips/)
boho, aventureros, maldives (beach), bloom, bridgerton, daynight, dolcevita, sweetlove (dulce-amor), finca — skip partial/missing ones

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
