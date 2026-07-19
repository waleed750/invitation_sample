# STATUS — abdelrahman-nourhan-invitation

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Update this file at the end of every work phase so the next `/clear` resumes in 1 read.
> Last updated: 2026-07-19

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
