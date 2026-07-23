# TASKS — excellence demo: real-site fidelity fixes

> Self-contained task list for `codex` to execute in the `abdelrahman_norhan_invitation_scraped` repo.
> Target site being matched: `src/sites/excellence/` (route `/excellence/`), a converted demo of
> `https://tdy-excellence-template.thedigitalyes.com/?embed=1` ("Diana & Richard" wedding).
>
> A full network capture of the real production build (JS, CSS, source, rendered DOM, full-page
> screenshot) is available at `/Users/waleedashraf/Downloads/tdy-excellence-template/`. Use it as
> ground truth instead of re-fetching the live URL:
> - `mirror/assets/index-B32MlQA-.css` — real production CSS (colors, fonts, layout)
> - `beautified/tdy-excellence-template.thedigitalyes.com/assets/index-CqO5qALc.pretty.js` — real
>   beautified JS (copy strings, component structure)
> - `screenshots/home.png` — full-page screenshot of the real rendered site (780×15926px) — the
>   single most useful reference for section order/content/layout
> - `rendered-pages/home.html` — rendered DOM snapshot
> - `mirror/assets/*.png` — real image assets, already matching what's in
>   `public/assets/excellence/` (same filenames minus content-hash suffixes)

Read `src/sites/excellence/data.js`, `src/sites/excellence/styles.css`, and
`src/sites/excellence/ExcellenceInvitation.jsx` first to see current state before making changes.
Also read `src/shared/sections/*.jsx` for the shared components being customized (Hero, Countdown,
Welcome, Schedule, DressCode, Details, Map, Gifts, Rsvp, Credit) — prefer extending these with new
optional props (backward-compatible, default = current behavior) over forking one-off components,
per this repo's existing convention (see `TASKS.md`).

After every task, run `npm run build` to confirm no breakage, and re-check the OTHER sites that use
the same shared component (`grep -rl "sectionComponents" src/sites/*/`) still build/render correctly
— several of these fixes touch shared components, not just `src/sites/excellence/`.

---

## Task 1 — Fix color palette (CRITICAL)

`src/sites/excellence/data.js` `theme` and `src/sites/excellence/styles.css` currently use a
near-black foreground (`#2c2c2c`). The real site's foreground/primary/sage color is a muted deep
sage green, not black. Real CSS custom properties (from `mirror/assets/index-B32MlQA-.css`,
converted from HSL to hex):

| Real token | HSL | Hex | Use for |
|---|---|---|---|
| `--foreground` / `--primary` / `--sage` / `--olive` / `--gold` / `--countdown` | `137 19% 28%` | `#3a5542` | body text, headings, icons, primary buttons |
| `--sage-dark` / `--burgundy-dark` / `--carbon` | `137 19% 22%` | `#2d4333` | darker accents, hover states |
| `--sage-light` / `--gold-soft` / `--burgundy-light` | `137 19% 35%` | `#486a52` | lighter accents |
| `--background` / `--ivory` / `--champagne` / `--cream` | `40 33% 95%` | `#f6f4ee` | page/section background |
| `--muted` / `--champagne-beige` / `--champagne-dark` | `40 20% 88%` | `#e7e2da` | muted backgrounds/cards |
| `--champagne-light` | `40 25% 91%` | `#eeeae2` | secondary background |
| `--border` / `--input` | `40 15% 82%` | `#d8d3ca` | borders, input outlines |

Update `theme` in `src/sites/excellence/data.js`:
```js
theme: {
  background: "#f6f4ee",
  foreground: "#3a5542",
  muted: "#e7e2da",
  ivory: "#f6f4ee",
},
```
Then grep `src/sites/excellence/styles.css` for any hardcoded `#2c2c2c`, `#8a8a8a`, or similar
grey/black values and replace with the sage tokens above (via the CSS custom properties already
wired through `InvitationShell` — `var(--foreground)`, `var(--background)`, etc. — plus new custom
properties for `--sage-dark` / `--sage-light` / `--border` if the stylesheet needs them; add those
as additional CSS vars set on `.excellence-shell` in `ExcellenceInvitation.jsx`'s inline style or
in `styles.css` `:root`/`.excellence-shell` block, sourced from `theme` the same way background/
foreground/muted/ivory already are).

**Done when:** no near-black (`#2c2c2c`-family) colors remain in excellence's rendered output;
visually compare against `screenshots/home.png` — text should read as dark sage, not charcoal.

---

## Task 2 — Load and apply the real fonts

Real site `<head>` loads `https://use.typekit.net/jzm0juw.css` and defines:
```css
--font-body: "mrs-eaves", serif;
--font-display: "parfumerie-script", cursive;
--font-script: "parfumerie-script", cursive;
```

- Add the same Typekit `<link>` to `index.html` (or conditionally scope it if it must not affect
  other templates — check whether `index.html` is shared across all routes first; if so, load it
  via a `<link>` injected from `ExcellenceInvitation.jsx`/`styles.css` `@import` instead, scoped so
  it doesn't regress other sites' fonts).
- Update `src/sites/excellence/styles.css` font-family declarations to use `"mrs-eaves", Georgia,
  serif` for body text and `"parfumerie-script", "Brush Script MT", cursive` for script/display
  headings (couple names, section script headings like "The Celebrations", "Wedding Weekend"),
  keeping the existing fallback-stack convention from `TASKS.md` ("Typekit fonts can't be bundled →
  fallback stacks") since the Typekit kit may be domain-restricted to thedigitalyes.com and fail to
  load for this project's domain — verify by loading the dev server and checking the Network tab /
  console for a 401/403 on the Typekit request; if it fails, keep fallback-only and note it in
  `.wolf/buglog.json`.

**Done when:** heading font in the browser matches the elegant script style in
`screenshots/home.png` (or gracefully falls back if Typekit is domain-restricted, without console
errors breaking the page).

---

## Task 3 — Rebuild "Where to Stay" as a real hotel list (MAJOR)

Current `src/sites/excellence/data.js` `details` section shows the Peninsula's own event address —
wrong content. The real "Where to Stay" section is a list of **3 recommended hotels**, each with an
illustration, name, per-night price, and a "Booking link coming soon" note. Exact copy from the real
site (`screenshots/home.png`, `beautified/.../index-CqO5qALc.pretty.js`):

1. **The Peninsula Istanbul** — €735 — "per night · double standard room · incl. taxes & breakfast" — "Booking link coming soon"
2. **JW Marriott Istanbul** — €314 — same per-night line — "Booking link coming soon"
3. **Novotel Istanbul** — €192 — same per-night line — "Booking link coming soon"

Images already exist at `public/assets/excellence/hotel-peninsula.png`,
`public/assets/excellence/hotel-marriott.png`, `public/assets/excellence/hotel-novotel.png` (unused
currently — verify they still exist, they were part of the original asset copy).

This needs a new shared section type since no existing component renders a repeating
image+name+price+note list:
- Add `src/shared/sections/HotelList.jsx` — props `{ title, subtitle, hotels: [{ name, imageUrl,
  pricePerNight, priceNote, bookingNote }] }`. Follow the JSDoc-prop-comment convention used by
  other shared sections (see `Details.jsx` for the pattern).
- Export from `src/shared/sections/index.js`.
- Add `'hotelList'` (or similar) to `SECTION_TYPES` in `src/registry/schema.js` and
  `templateTypes.js` if section types are enumerated there (follow the pattern used for `'credit'`
  in the last session — see `.wolf/cerebrum.md` decision log entry dated 2026-07-23).
- Replace excellence's current `details` section entry in `data.js` with a `hotelList` section using
  the 3 hotels above; keep the existing `title: "Where to Stay"` / `subtitle: "Recommended hotels
  near the venue"` copy.
- Register `hotelList: HotelList` in `ExcellenceInvitation.jsx`'s `sectionComponents` map.
- **Do not delete** the actual Wedding-venue "Location" content (Peninsula Hotel Istanbul + map) —
  it still needs a home. See Task 5 below for where that content actually belongs on the real site.

**Done when:** `/excellence/` shows 3 hotels with images, prices, and booking notes matching the
list above; `npm run build` succeeds with no orphaned imports.

---

## Task 4 — Split "The Celebrations" and "Dress Code" into per-event cards (MAJOR)

Real site presents both sections as **two distinct illustrated cards** — one per event (Welcome
Cruise, Wedding) — not a single paragraph. Exact structure from `screenshots/home.png`:

### "The Celebrations" (currently the `welcome` section type)
Card 1 (yacht illustration):
- Kicker: "WELCOME CRUISE ON THE BOSPHORUS"
- Script heading: "The Peninsula Private Quay"
- Body: "Departing from The Peninsula Private Quay"
- Divider
- "22 July 2026" / "6:30 PM"
- Link: "VIEW ON MAP" (Peninsula Private Quay location — same domain as the venue map already used
  elsewhere; if no distinct quay coordinates are available, reuse the Peninsula Hotel Istanbul map
  URL already in `data.js`)

Card 2 (Peninsula Hotel Istanbul illustration):
- Kicker: "WEDDING"
- Script heading: "The Peninsula Hotel Istanbul"
- Divider
- "23 July 2026" / "6:00 PM"
- Link: "VIEW ON MAP" (real Peninsula Hotel Istanbul map URL, already correct in current `data.js`
  `event.mapUrl`)

This is the natural home for the venue/location content currently misplaced in Task 3's old
`details` section — **the real site does not have a separate flat "Location" section at all**; the
map link lives inside this Wedding card instead. Decide whether to keep the existing shared `Map`
section (iframe embed) as an *additional* section after these cards (nice-to-have, real site doesn't
have an embedded iframe map, only "View on Map" links out to Google Maps) or remove it to match the
real site exactly — **prefer keeping the Map iframe as a bonus enhancement** since it's already
built and working, just don't treat "Details"/"Location" as the primary way this content is
presented; add the two-card layout as the primary content.

Component work: `src/shared/sections/Welcome.jsx` currently takes a flat `body` string. Either:
(a) extend it with an optional `cards: [{ kicker, heading, body, date, time, mapUrl, imageUrl }]`
prop that renders the card layout when present (falls back to current flat-`body` rendering for
other sites), or (b) create a new shared `EventCards.jsx` section if extending `Welcome` gets
awkward. Prefer (a) if it stays clean — check how much of `Welcome.css`/`.welcome-section` styling
can be reused first.

### "Dress Code" (currently the `dressCode` section type)
Same two-card pattern, simpler content:
- Card 1: bouquet illustration, script "Welcome Cruise", "22ND JULY", "White Cocktail Attire"
- Card 2: cypress-trees illustration, script "Wedding", "23RD JULY", "Black Tie"

Extend `src/shared/sections/DressCode.jsx` the same way as `Welcome.jsx` (optional `cards` prop,
same fallback rule), or reuse whatever card primitive Task 4's Welcome solution produces if it's
generic enough to share.

**Done when:** both sections show two visually distinct cards each, matching
`screenshots/home.png` crop 1–4 (available in this session's scratchpad if needed — otherwise
re-derive from the full screenshot at the path above); existing sites using `Welcome`/`DressCode`
with the old flat-`body` prop shape still render unchanged (verify by loading `/africa/`,
`/boho/`, etc. after the change).

---

## Task 5 — Hero: add back the scroll cue (MINOR, do last)

`src/shared/sections/Hero.jsx` currently has `showOverlayCopy` (added in the last session to stop
duplicate text from overlapping the video's own baked-in design — keep that fix). The real site
still shows a persistent **"KEEP SCROLLING AND RSVP"** label with a chevron-down icon, overlaid
separately from the video (confirmed not baked into the video pixels — it's still visible at
different scroll/video-progress states in the capture). Add this back:

- Add a `scrollCueLabel` prop to `Hero.jsx` (optional, independent of `showOverlayCopy` — it should
  render even when `showOverlayCopy` is false, since it's not part of the duplicated
  headline/name/date copy).
- Position it near the bottom of the hero viewport with a subtle pulse/fade animation (reuse the
  `pulseLabel` keyframe pattern already in `src/shared/intros/video-open-intro.css`'s `.tap-label`
  if convenient) and a chevron-down icon (lucide-react `ChevronDown`, already a project dependency
  per other sections' icon usage).
- In `src/sites/excellence/data.js`, set `scrollCueLabel: "Keep scrolling and RSVP"` on the hero
  section props.

**Done when:** hero shows the video (no duplicate couple-name text, no loop — unchanged from last
session's fix) plus a small pulsing "KEEP SCROLLING AND RSVP" + chevron near the bottom, matching
`screenshots/home.png` crop 0.

---

## Task 6 — Countdown: match real unit set and labels (MINOR)

Real site shows only **Days / Hours / Minutes** (no Seconds box), full-word labels ("DAYS",
"HOURS", "MINUTES" — not "Mins"/"Secs").

- `src/shared/sections/Countdown.jsx` currently always renders a Seconds box with abbreviated
  labels ("Mins", "Secs"). Add a `showSeconds` prop (default `true`, so other sites using this
  component are unaffected) and change the `pad`-based label rendering so callers can pass full
  words via `label` overrides, or simplest: change the hardcoded labels to `"Days"`, `"Hours"`,
  `"Minutes"`, `"Seconds"` (full words) and only gate the Seconds `<TimeBox>` behind `showSeconds`.
- In `src/sites/excellence/data.js`, set `showSeconds: false` on the countdown section props.

**Done when:** `/excellence/` countdown shows exactly 3 boxes (Days/Hours/Minutes, full-word
labels); other sites using `Countdown` still show their existing 4-box layout unchanged (default
`showSeconds: true` preserves current behavior).

---

## Task 7 — RSVP: match real copy and field shape (MINOR)

Real site RSVP form (from `screenshots/home.png` crop 6–7):
- Attendance radios: **"Delighted to accept"** / **"Regretfully unable to attend"** (ours currently
  says "Yes, I'll be there" / "Unfortunately, I can't make it")
- A second required question: **"Which events will you be attending? *"** with checkboxes:
  "Welcome Cruise – 22nd July" / "Wedding Ceremony & Reception – 23rd July"
- Guest count: **+/− stepper** with a number input in the middle (ours is currently a `<select>`
  dropdown 1–8)
- Name field labeled **"Principal guest"** → "Full name" (ours: just "Full name *")
- Children question uses **Yes/No radios** (ours: a single checkbox) — label: "Will any children be
  accompanying you?"
- **Do NOT add** a public message/guestbook wall or a "message for the couple" field — per explicit
  prior instruction in this project, guest messages are intentionally not imported/implemented. The
  real site does have a private "message for the couple" textarea; skip it, this was a deliberate
  scope decision already made.
- Submit button label: **"SUBMIT RESPONSE"** (ours: "Send RSVP") with a paper-plane icon (already
  using `lucide-react`'s `Send`, matches).

`src/shared/sections/Rsvp.jsx` is shared — decide whether to add these as new optional props (event
checkboxes list, stepper vs. dropdown toggle, custom radio labels) with defaults matching current
behavior for other sites, following the same backward-compatible-prop pattern as Tasks 4–6. This is
the most invasive shared-component change in this list — if it gets too complex to keep clean,
flag it back to Claude/the user rather than forking a one-off `ExcellenceRsvp` component (this repo's
convention per `TASKS.md` step 5 is reusable presets in `src/shared/`, never one-off site-local
sections for anything that isn't truly site-specific decoration like a footer image).

**Done when:** RSVP wording/fields match the list above on `/excellence/`; other sites using `Rsvp`
unaffected by default prop values.

---

## Task 8 — Footer/Credit: match the real site's closing stack (MINOR)

Real site's own footer (crop 7 of `screenshots/home.png`) is: large monogram icon → script couple
names ("Diana & Richard") → date ("23 July 2026") → "Made with love by The Digital Yes" (their own
agency credit, as a link). Our `src/shared/sections/Credit.jsx` currently only renders the "Made
with love by [name] / Portfolio link" line, standalone.

- Extend `Credit.jsx` with optional props `monogramUrl`, `coupleNames`, `eventDate` — when present,
  render them stacked above the existing "Made with love by" line (monogram image, then script
  couple names, then date, then the credit line — same visual rhythm as the real site, but the
  credit line itself stays **"Made with love by Waleed Ashraf"** linking to
  `https://waleed-ashraf.vercel.app/`, per the explicit standing instruction from the prior session
  — do not restore "The Digital Yes" branding).
- In `src/sites/excellence/data.js`, pass `monogramUrl: "/assets/excellence/monogram.png"`,
  `coupleNames: "Diana & Richard"`, `eventDate: "23 July 2026"` on the credit section props.

**Done when:** the closing section on `/excellence/` shows monogram → "Diana & Richard" (script) →
"23 July 2026" → "Made with love by Waleed Ashraf" / "Portfolio" (linking to
`https://waleed-ashraf.vercel.app/`), matching the real site's visual structure with our own credit
line.

---

## Verification (all tasks)

1. `npm run build` — must succeed, separate lazy chunk for `ExcellenceInvitation` still present.
2. `npm run dev`, visit `/excellence/` — visually compare each section against
   `/Users/waleedashraf/Downloads/tdy-excellence-template/screenshots/home.png` top to bottom.
3. Re-check `/africa/`, `/boho/`, `/maldives/`, `/aventureros/` (or `npm run build` output listing
   all site chunks) to confirm shared-component prop additions didn't change their default
   rendering — every new prop added in Tasks 4/6/7/8 must default to current behavior.
4. Mobile-viewport check (390×844) for horizontal overflow on every new/changed section — this repo
   had a real overflow bug last session (`.wolf/buglog.json` bug-003) from an unstyled image in a
   shared component; don't repeat it. `document.documentElement.scrollWidth` must equal
   `clientWidth` at both 390px and 1280px.
5. Do not re-introduce the duplicate hero-text bug (bug-004) — `showOverlayCopy: false` and
   `heroVideoLoop: false` on excellence's hero section must remain unless intentionally revisited.
