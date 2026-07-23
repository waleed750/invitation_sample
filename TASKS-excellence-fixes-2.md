# TASKS — excellence demo: round 2 fixes (from screen-recording review)

> Self-contained task list for `codex` to execute in the `abdelrahman_norhan_invitation_scraped`
> repo. Follow-up to `TASKS-excellence-fixes.md` (already implemented and verified — see
> `.wolf/buglog.json` bug-005 and `.wolf/cerebrum.md` for that round's context).
>
> These findings come from reviewing a screen recording of the real production site
> (`https://tdy-excellence-template.thedigitalyes.com/?embed=1`) frame-by-frame and comparing
> against the current `/excellence/` build. Read `src/sites/excellence/data.js`,
> `src/sites/excellence/styles.css`, `src/shared/sections/Hero.jsx`, `src/shared/sections/
> Schedule.jsx`, and `src/shared/sections/HotelList.jsx` first to see current state.

As with round 1: prefer extending shared components with new optional props (backward-compatible,
default = current behavior) over one-off forks. After changes, run `npm run build` and re-check
other sites using the same shared components still render unchanged.

---

## Task 0 — Swap in the real couple names and date (DO THIS FIRST)

Replace the placeholder "Diana & Richard" content with the real couple:

- **Names (English, for now):** "Mohamad" and "Salma" — `Mohamad & Salma`
- **Date:** `20/8` — read as **20 August**. The existing data uses year **2026**
  (`2026-07-23T18:00:00+03:00` etc.) with no year specified for the new date; assume **2026**
  unless told otherwise, i.e. `20 August 2026`. Flag this assumption back if it turns out wrong —
  don't silently guess further.

This touches every place `"Diana"`, `"Richard"`, `"Diana & Richard"`, `"23 July 2026"`, and the ISO
date string `2026-07-23T18:00:00+03:00` currently appear in `src/sites/excellence/data.js` —
grep for all four and update consistently, including:
- `couple.firstName` / `couple.secondName` / `couple.headline`
- `event.date` / `event.displayDate`
- Every `sections[]` entry that repeats the date/names in its own `props` (hero, countdown, welcome
  cards, schedule items, dress-code cards, rsvp subtitle if it references a date, credit section's
  `coupleNames`/`eventDate`)
- Task 1 below (hero overlay) also references "Diana"/"Richard" explicitly — use the real names
  there too.

**Do not** touch venue/hotel names, times, or any other content — only the couple identity and
event date change.

### Important limitation: the hero video's baked-in card still says "Diana & Richard"

`public/assets/excellence/hero-video.mp4` is a pre-rendered video file — "Diana & Richard", the
date, and the venue text visible in its final seconds (the card-reveal frame, per this project's
earlier `ffmpeg` frame extraction) are baked into the video pixels themselves and **cannot** be
changed by editing `data.js` or any React code. Swapping in "Mohamad & Salma" there would require
re-creating that video asset from scratch (source design file, not available here) — **out of scope
for this task**. Flag this clearly back to the user/Claude rather than attempting a code workaround
(e.g. don't try to mask it with an HTML overlay patch covering the video's own text — that would
look broken). Every other instance of the names/date (the HTML overlay in Task 1, countdown,
schedule, all card content, credit footer, etc.) should use the real names/date; only the video's
own baked-in final-card text will still show the placeholder names until someone produces a new
video asset.

### Future: bilingual English/Arabic (groundwork note, no implementation yet)

The user plans to add a second language (Arabic) later, alongside English. **Do not build
translation/i18n infrastructure now** — keep everything English-only for this round, exactly as the
rest of this repo's sites work today (no i18n system exists anywhere in the codebase yet). Just be
aware of this direction so upcoming naming/structure choices don't paint the project into a corner:
prefer keeping copy strings as plain data-driven props in `data.js` (already the pattern everywhere
in this repo) rather than hardcoding text inside components, since that's what will make adding a
language switch straightforward later. No other action needed this round.

For reference when Arabic is added later (not now): the couple's names in Arabic are **محمد و سلمى**
("Mohamad and Salma"). Not used anywhere in this round's implementation — noted here only so it
isn't lost before the bilingual work starts.

**Done when:** every visible instance of the couple's name and event date on `/excellence/` reads
"Mohamad & Salma" and "20 August 2026" (English), with no leftover "Diana"/"Richard"/"23 July 2026"
anywhere — grep the built site or `data.js` to confirm zero matches.

---

## Task 1 — Hero: restore the text overlay, but timed to fade out before the video's own card (MODERATE)

Last round removed the hero's text overlay entirely (`showOverlayCopy: false`) to fix a bug where
bold duplicate text was permanently overlapping the video's own baked-in "Diana & Richard" card
design. That fixed the overlap, but the real site doesn't omit the overlay — it times it:

- Real site shows a **white** overlay — eyebrow "WE ARE GETTING MARRIED" + script names stacked
  each on its own line (originally "Diana" / "&" / "Richard" on the source site — use the real
  couple's names from Task 0 instead: "Mohamad" / "&" / "Salma", `--font-script` cursive font) —
  visible during the **first ~4 seconds** of the hero video (while it's still showing the
  floral-arch scene, before the video's own text-bearing card frame appears around ~6s in, per this
  project's earlier frame extraction of `hero-video.mp4` at `t≈6.29s`).
- The overlay **fades out** (opacity transition) before the video's own card becomes legible, so
  there is never simultaneous overlapping text — confirmed by reviewing the real recording
  frame-by-frame.

Implementation:
- `src/shared/sections/Hero.jsx` currently has a `showOverlayCopy` boolean (all-or-nothing for the
  whole video duration). Add a new optional prop `overlayFadeOutAt` (seconds, e.g. `4`) — when set
  together with `showOverlayCopy: true`, the overlay `<div className="hero-copy">` should get a CSS
  transition/class toggle that fades its opacity to 0 at that timestamp into video playback. Use
  the existing `<video>` ref's `timeupdate` event (or a simple `setTimeout` keyed off when the video
  starts playing, matching the pattern already used in `src/shared/intros/VideoOpenIntro.jsx`'s
  `fallbackTimer` for consistency) — do not add a new dependency for this.
- Style: `.hero-copy` text should be **white** (`color: #fff` or `rgba(255,255,255,0.92)`), not the
  sage foreground color used elsewhere — this section sits directly on the video, not on the cream
  background, so it needs the light variant. The eyebrow line is small-caps letter-spaced (matches
  existing `.eyebrow` styling already in the shared CSS, just needs a white color override scoped to
  `.hero-copy` when it renders over video). Names render one per line in `--font-script` (see
  Task 2's font notes in `TASKS-excellence-fixes.md` round 1 — Typekit `parfumerie-script` is
  already wired up).
- In `src/sites/excellence/data.js`, set on the hero section props: `showOverlayCopy: true`,
  `headline: "We are getting married"`, `firstName: "Diana"`, `secondName: "Richard"`,
  `overlayFadeOutAt: 4`. Keep `heroVideoLoop: false` and `scrollCueLabel` as they are — those are
  already correct.
- **Do not** re-add `displayDate`/`ctaLabel` to the overlay — the real site's early overlay is only
  the eyebrow + names, nothing else (the date/venue/RSVP-cue text only appears baked into the
  video's own later card frame, and separately as the persistent scroll cue already implemented).

**Done when:** loading `/excellence/`, tapping to open, the white "WE ARE GETTING MARRIED / Diana /
& / Richard" text is visible for the first ~4 seconds over the video, then fades out smoothly before
the video's own card design (with its script "Diana & Richard" in dark sage) becomes the focal
content — no frame where both are simultaneously legible and overlapping. Verify with Playwright by
checking `.hero-copy` opacity at t=1s (should be ~1) and t=6s (should be ~0) after tap.

---

## Task 2 — Schedule: real vertical timeline with dot markers (MODERATE)

Real site's "Wedding Weekend Itinerary" section is a **connected vertical timeline**: a vertical
line runs down the left side with a dot marker per stop, each stop showing a bold time (e.g.
"6:30 PM") and a description below it (e.g. "Departure from The Peninsula Private Quay"). Our
current `src/shared/sections/Schedule.jsx` renders each `items[]` entry as a flat
title/time/description paragraph block — same content, no timeline visual.

- Extend `src/shared/sections/Schedule.jsx`: change `items[]` entries from the current
  `{ title, time, description }` single-paragraph shape to support a richer shape where
  `description` can be pre-split into individual timeline stops. Add a new optional prop shape:
  `items: [{ title, subtitle, stops: [{ time, text }] }]` — when `stops` is present, render a
  timeline (vertical line + dot per stop, bold `time`, plain `text` below it, matching the real
  site's visual). Fall back to the current flat rendering when `stops` is absent, so other sites
  using `Schedule` with the old shape are unaffected.
- Timeline CSS: a thin vertical line (`border-left` or a pseudo-element) with small circular dot
  markers (`::before` on each stop, sage-colored, ~8px), matching the reference screenshot look
  (subtle, not heavy).
- Update `src/sites/excellence/data.js`'s `schedule` section to use the new `stops` shape. Exact
  copy per stop, from the real site (already partially captured in this project's existing
  `description` strings — split them out):

  **Welcome Cruise on the Bosphorus** (22 July 2026):
  - `6:30 PM` — "Departure from The Peninsula Private Quay"
  - `6:30 – 9:30 PM` — "Sunset Cocktails & Hors d'Œuvres"
  - `10:00 PM` — "Arrival at The Peninsula Private Quay"

  **Wedding** (23 July 2026 · The Peninsula Hotel Istanbul):
  - `6:00 PM` — "Arrival & Welcome Drinks"
  - (unlabeled/no-time stops, rendered as plain timeline entries without a bold time prefix, per
    the real site's crop 3 screenshot) — "Ceremony", "Banquet", "Party", "After Party"

  Do **not** include the literal string "PROGRAM.CRUISESUBDESC" anywhere — that's a leaked i18n key
  bug on the real site's own build, not real content; the "Please join us for cocktails and hors
  d'œuvres as we sail the Bosphorus" line above it *is* real copy and should be kept as a `subtitle`
  on the Welcome Cruise item, just without the broken key string that follows it in the source.

**Done when:** `/excellence/` schedule section shows a vertical timeline with dot markers, bold
times, and per-stop text, matching the real site's structure; other sites using `Schedule` with the
old flat shape render unchanged (check `/africa/`, `/boho/`, etc.).

---

## Task 3 — Hotel names: use script font, not bold serif (MINOR)

`src/shared/sections/HotelList.jsx` (added last round) currently renders each hotel's `name` in
bold serif (`<h3>` with default heading weight). Real site renders hotel names in the same
script/cursive font (`--font-script`, "parfumerie-script") used for every other venue/heading name
across the site (couple names, "The Peninsula Hotel Istanbul" in the Celebrations cards, etc.) —
currently inconsistent.

- Update the CSS rule for the hotel name heading in `src/sites/excellence/styles.css` (find the
  `.hotel-list-section`/`.hotel-card h3`-equivalent selector — check `HotelList.jsx` for the actual
  class names used) to use `font-family: var(--font-script)` at a large size, matching the styling
  already applied to `.celebrations-card h3`/equivalent script headings elsewhere in the same
  stylesheet (reuse that exact rule if one already exists, don't duplicate values).

**Done when:** "The Peninsula Istanbul", "JW Marriott Istanbul", "Novotel Istanbul" render in the
same script font as other venue names on the page, not bold serif.

---

## Verification (all tasks)

1. `npm run build` — must succeed.
2. `npm run dev`, visit `/excellence/` — tap to open, watch the hero overlay fade timing with the
   video, confirm no overlap with the video's own card text.
3. Scroll to the Schedule section — confirm timeline/dot layout renders correctly on both mobile
   (390px) and desktop (1280px) with no horizontal overflow (`document.documentElement.scrollWidth
   === clientWidth` at both).
4. Confirm hotel names render in script font.
5. Re-check `/africa/`, `/boho/`, `/maldives/`, `/aventureros/` for any regression from the
   `Schedule.jsx`/`Hero.jsx` prop additions — all new props must default to current behavior.
6. Do not reintroduce prior bugs: no permanent hero text/video overlap (bug-004), no mobile overflow
   from unstyled images (bug-003), no fabricated map URLs (bug-002). See `.wolf/buglog.json` for
   full history.
