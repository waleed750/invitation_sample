# TASKS — new demo "citystars": duplicate of elegante, re-themed for Ahmad & Salma

> Implement directly — no confirmation needed. Duplicate `src/sites/elegante/` into a new site
> `src/sites/citystars/`, reusing all the same shared components (already built, do not fork new
> ones unless explicitly told to below). Work fast — this is a content/config swap on an existing
> working demo, not a new build from scratch.

## Step 1 — Duplicate the site

- Copy `src/sites/elegante/data.js` → `src/sites/citystars/data.js`, `EleganteInvitation.jsx` →
  `CitystarsInvitation.jsx` (rename the exported function to `CitystarsInvitation`, update the
  import path in it from `./data.js` unchanged, just fix the component name), `styles.css` →
  `src/sites/citystars/styles.css` (update any `.elegante-shell`/`.elegante-content` class name
  references to `.citystars-shell`/`.citystars-content`).
- Copy `public/assets/elegante/` → `public/assets/citystars/` — but do NOT copy `gallery-*.jpg`
  (gallery is being removed, see Step 3) or `white-textured-paper.png` (also being removed).
- Register in `src/registry/index.js`: import `siteMeta as citystarsMeta` from
  `../sites/citystars/data.js`, add a `templates` entry with lazy `loadComponent` importing
  `CitystarsInvitation` from `../sites/citystars/CitystarsInvitation.jsx`.
- `siteMeta`: `id: "citystars"`, `title: "Citystars Wedding"`, `href: "/citystars/"`, update
  `summary`/`tags` to drop gallery/RSVP mentions, keep the rest of the shape the same as
  `elegante`'s `siteMeta`.

## Step 2 — New couple/date/venue content

Replace throughout `data.js` (couple object, event object, hero section props, credit section
props, details/venue section, countdown section — everywhere "Andrea"/"Pedro"/"12 September 2026"/
"Finca El Olivar" currently appear):

- **Names:** Ahmad & Salma
- **Date:** August 20, 2026 — Thursday, 8:00 PM ("At Eight O'Clock in the Evening" — use this exact
  phrasing somewhere prominent, e.g. the Venue/Details section's time line, matching the tone of the
  user's request). ISO date for `event.date`/countdown: `2026-08-20T20:00:00+02:00` (Cairo/Egypt
  timezone, UTC+2 in August — Egypt does not observe DST in August 2026 per current law, so +02:00
  is correct; if in doubt leave a comment noting the assumption).
- **Venue:** InterContinental Citystars Cairo by IHG. No street address was given — use "Cairo,
  Egypt" as the address line rather than inventing a fake street address.
- Countdown section: `untilLabel: "Until 20 August 2026"`.
- Welcome section body: rewrite to drop the "beautiful town of Ronda, Andalusia" reference (doesn't
  apply anymore) — something simple like "We warmly invite you to celebrate our wedding day with us.
  We look forward to sharing this unforgettable moment with our most special people."
- Details/Venue section: `venue: "InterContinental Citystars Cairo"`, `dateLine: "20 August 2026 ·
  8:00 PM"`, `addressLines: ["Cairo, Egypt"]`, `mapUrl` using the same safe pattern already used in
  `elegante` (`https://www.google.com/maps/search/?api=1&query=<urlencoded address>` — query
  `InterContinental Citystars Cairo`). **Drop the `imageUrl` prop** for this section (the current
  `venue-hedsor.png` illustration is a European-style mansion that doesn't match this venue — no
  replacement illustration is available, so omit it rather than showing a mismatched building).
- Dress Code section: **drop `illustrationUrl`** for the same reason (mismatched building photo) —
  keep the `groups` text content (Women/Men lines) as-is unless told otherwise; this wasn't flagged
  for removal, just the mismatched image.
- Credit section: `coupleNames: "Ahmad & Salma"`, `eventDate: "20 August 2026"`. Keep
  `name: "Waleed Ashraf"` / portfolio link exactly as-is (standing requirement, unchanged).

## Step 3 — Remove sections that don't fit (per explicit user request)

Remove these section entries entirely from `citystars/data.js`'s `sections[]` array, and remove
their immediately-adjacent `imageDivider` entries where removing them would leave two dividers
back-to-back with nothing between (use judgment — keep the page flow clean, don't leave orphaned
decorative dividers with no content between them):

1. **`gallery`** section (10 photo grid) — remove entirely. Do not copy `gallery-*.jpg` assets.
2. **`schedule`** section's `bgUrl` prop (`white-textured-paper.png`) — remove just this prop, KEEP
   the section itself (see Step 4 for its new content). Do not copy `white-textured-paper.png`.
3. **`rsvp`** section — remove entirely.
4. **`welcome` section with `id: "pre-wedding-events"`** (the "Come Say Hello... / Welcome Drinks /
   Farewell Brunch" cards referencing Ronda venues like "Bodega García Hidalgo" and "Parador de
   Ronda") — remove entirely, none of it applies to a Cairo venue and no replacement content was
   given.
5. **`locationTransport`** section (the Spain driving-directions text — "From Málaga...", "From
   Seville...", "From Marbella...") — remove entirely, replaced by the new Map section in Step 5.
6. **`hotelList`** section (Accommodation — Parador de Ronda, Hotel Catalonia Ronda, Hotel
   Montelirio) — remove entirely, none of these Spain hotels apply.
7. **`gifts`** section — KEEP the section but remove the `bankAccounts` array (CaixaBank/Banco
   Santander with Andrea/Pedro's names — not applicable, and no real Egyptian bank details were
   provided). Fall back to the plain-text-only rendering (just `title`/`body`, no bank cards) — do
   NOT invent fake Egyptian bank account details. Body copy: "Your presence is our greatest gift."
   is sufficient; bank details can be added later when the user provides real ones.

After removals, `sections[]` should read roughly: hero → countdown → welcome → (divider) → details
(venue) → (divider) → schedule (reworked) → (divider) → dressCode → (divider) → gifts (plain) →
map (new, see Step 5) → credit.

## Step 4 — Rework the Day Programme (schedule) content

Replace the `stops[]` array with Muslim-wedding-appropriate evening programme items, anchored on
the two explicit cues the user gave — entrance at 8:00 PM, dancing starting at 9:00 PM, with a break
worked in — fill in the rest sensibly for a Cairo hotel reception:

```js
stops: [
  { time: "8:00 PM", text: "Entrance" },
  { time: "8:30 PM", text: "Dinner" },
  { time: "9:00 PM", text: "Dancing" },
  { time: "10:00 PM", text: "Break" },
  { time: "10:30 PM", text: "Cake Cutting" },
  { time: "11:30 PM", text: "Farewell" },
]
```

Keep `title: "Day Programme"`, update `subtitle` to `"20 August 2026"`. Keep the `alternate: true`
timeline layout as-is (already built and working).

## Step 5 — Add an end-of-page Map section

Per the user's request for "a section for maps" near the end of the page: add a new section using
the existing shared `Map` component (`src/shared/sections/Map.jsx`, already imported/used in other
demos like `excellence`) to `citystars/data.js`'s `sections[]`, positioned after `gifts` and before
`credit`:

```js
{
  type: "map",
  props: {
    title: "InterContinental Citystars Cairo",
    src: "https://www.google.com/maps?q=InterContinental+Citystars+Cairo&output=embed",
  },
},
```

Add `map: Map` to `CitystarsInvitation.jsx`'s `sectionComponents` map (import `Map` from
`../../shared/sections/Map.jsx`) if not already imported via the duplicate from Step 1.

## Step 6 — Background music

The user provided a real music file at
`/Users/waleedashraf/Downloads/wedding-background-music-yxy0nS2O (1).mp3` (5.2MB, 2:17 duration).
`elegante` had no music; this demo should have it:

- Copy it to `public/assets/citystars/background-music.mp3`.
- Compress per this repo's pipeline rule: `ffmpeg -i "<in>" -b:a 128k <out>` (source is already
  320kbps per prior inspection of this same file in an earlier session — compress down to 128k).
- Add `musicUrl: asset("background-music.mp3")` to `citystars/data.js`'s `media{}` object.
- `InvitationShell.jsx` already conditionally renders the music button/audio element based on
  `media.musicUrl` being truthy (built for `elegante`'s no-music case) — no code change needed here,
  it will just start showing the music button automatically once `musicUrl` is set.

## Verification

1. `npm run build` — must succeed, separate lazy chunk for `citystars`.
2. If a live browser check is possible in your environment: visit `/citystars/`, confirm Ahmad &
   Salma / 20 August 2026 / InterContinental Citystars Cairo appear correctly throughout, gallery/
   RSVP/pre-wedding-events/location-transport/hotel-list are all gone, schedule shows the new
   programme with no background photo, music button appears and plays, new Map section renders near
   the end before the credit footer. If your sandbox can't bind a dev server, say so plainly rather
   than treating `npm run build` alone as proof.
3. Mobile (390px) and desktop (1280px) viewport overflow check if a browser check is possible.
4. Confirm `/elegante/` itself is completely untouched (this task only adds a new site, never
   modifies the original).
5. Report back clearly what was done, and flag the address/timezone assumptions made in Step 2 so
   the user can correct them if wrong.
