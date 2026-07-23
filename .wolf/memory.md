# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

| 2026-07-19 | Phase 1 Part 1 — created registry + shared modules | src/registry/*, src/shared/* | build passes, no existing files touched | ~8k |
| 2026-07-19 | Phase 1 Part 2 — wired registry, recomposed both templates | src/main.jsx, both data.js, both site .jsx, registry/index.js | build passes, separate lazy chunks, committed 2519b72 | ~10k |
| 2026-07-19 | Phase 2 done via opencode: review fixes (13965e2) + africa demo converted (03a66b7); .wolf STATUS updated by Claude | .wolf/STATUS.md, src/sites/africa/* | ok | ~1k |
| 2026-07-19 | Extracted shared InvitationShell, recomposed both sites, compressed africa media 26.6→13.2MB, added pipeline docs | src/shared/InvitationShell.jsx, both site .jsx, public/assets/africa/*, TASKS.md | build passes, 50% media reduction | ~8k |

## Session: 2026-07-20 13:07

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-20 15:10

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-22 00:05

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-23 00:25

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 00:25 | excellence demo converted: VideoOpenIntro + 10 sections + shared Credit footer | src/sites/excellence/, src/shared/sections/Credit.jsx, src/registry/ | completed | ~8k |
| 01:15 | fixed unwired media (video/music never connected to data.js) + fabricated map embed URL; verified full flow with Playwright (video, audio, all sections, real map, credit link) | src/sites/excellence/data.js, public/assets/excellence/*.mp4,*.mp3, .wolf/buglog.json, .wolf/cerebrum.md | fixed + verified | ~6k |
| 02:00 | fixed mobile overflow (524px overflow at 390px viewport) — shared Details.jsx img had no CSS class/constraint; added className + .badge-frame CSS to excellence, redesigned badge as small accent since monogram.png is a solid glyph not a hollow frame; verified 0px overflow at 390px + 1280px | src/shared/sections/Details.jsx, src/sites/excellence/styles.css, .wolf/buglog.json, .wolf/cerebrum.md | fixed + verified | ~5k |
| 02:30 | fixed hero duplicate/overlapping text + looping video — hero-video.mp4 is a self-contained one-shot animated card with its own baked-in couple names/date/venue text, not an ambient loop backdrop; added heroVideoLoop/showOverlayCopy props to shared Hero.jsx, disabled both for excellence; verified via Playwright (video.ended===true, frozen at 10.04s, zero .hero-copy elements, screenshot matches source design) | src/shared/sections/Hero.jsx, src/sites/excellence/data.js, .wolf/buglog.json, .wolf/cerebrum.md | fixed + verified | ~6k |
| 02:25 | implemented TASKS-excellence-fixes: sage palette, Typekit fonts, HotelList, celebration/dress cards, hero scroll cue, 3-unit countdown, RSVP field shape, and credit closing stack; build and Brave viewport checks passed for excellence | src/sites/excellence/*, src/shared/sections/*, src/registry/schema.js | fixed + verified; noted unrelated boho 12px decorative-image overflow | ~10k |
| 03:48 | implemented TASKS-excellence-fixes-2: Mohamad/Salma + 20 Aug 2026 data swap, timed white hero overlay with deferred hero-video playback, schedule timeline stops, and script hotel names | src/sites/excellence/data.js, src/sites/excellence/styles.css, src/shared/sections/Hero.jsx, src/shared/sections/Schedule.jsx | build + Brave checks passed; hero opacity 1 at t~1s and 0 at t~6s; excellence overflow 0px | ~8k |
| 12:33 | implemented TASKS-excellence-additions + pending removals: wired countdown flowering columns and removed Excellence hotel section usage/metadata | src/shared/sections/Countdown.jsx, src/sites/excellence/data.js, src/sites/excellence/ExcellenceInvitation.jsx, src/sites/excellence/styles.css | npm run build passes; dev-server live viewport checks blocked by sandbox listen EPERM | ~5k |
| 12:45 | implemented TASKS-excellence-countdown-style: replaced Excellence dark countdown panel with ivory card styling, sage text, italic serif numerals, and divider-separated stats | src/sites/excellence/styles.css | npm run build passes; dev/preview browser checks blocked by sandbox listen EPERM | ~3k |
| 13:28 | implemented TASKS-excellence-hero-fade: removed Excellence hero video bottom mask and broad cream scrim, added scroll-cue text shadow | src/sites/excellence/styles.css, .wolf/buglog.json | npm run build passes; dev/preview browser checks blocked by sandbox listen EPERM | ~3k |
| 21:06 | Implemented TASKS-elegante.md from local capture only; added route, shared section extensions, copied/compressed assets, ran build, dev server blocked by sandbox EPERM | src/sites/elegante/*, src/shared/sections/*, src/shared/InvitationShell.jsx, src/registry/index.js, public/assets/elegante/ | npm run build passed; visual localhost verification unavailable | ~32000 |
