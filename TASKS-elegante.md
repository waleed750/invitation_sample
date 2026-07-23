# TASKS — new demo: "elegante" (premiumelegante.thedigitalyes.com)

> Implement directly in the `abdelrahman_norhan_invitation_scraped` repo via `opencode` or `codex`
> — no confirmation needed, proceed through build → verify, and report back clearly.
>
> **Ground truth source**: a real network capture of the live site already exists at
> `/Users/waleedashraf/Downloads/premiumelgante-template/`. **Use ONLY this folder as your source.**
> Do NOT attempt to fetch the live URL again, do NOT use web search to fill gaps, and do NOT borrow
> assets/colors/content from any other demo in this repo (`excellence`, or anything under
> `imports/`) — a previous attempt at this exact task failed because the agent couldn't reach the
> live site, fell back to web search, then started copying unrelated demos' assets and content as
> filler. That produced a fully fabricated result and was discarded. This time, everything you need
> is already downloaded:
> - `network/responses/premiumelegante.thedigitalyes.com/` — real images, hero video, intro video,
>   real CSS bundle (`assets/index-swSRspiq.css`), real JS bundle
> - `rendered-pages/index.html` — rendered DOM with real copy (SSR-baked, unlike `excellence` which
>   was client-only — you can read text content directly from this file)
> - `screenshots/001_file.png` — full-page screenshot (390×11071px) of the real rendered site;
>   crop it into vertical segments (~1600px tall) with ffmpeg if you need to inspect it visually
> - `videos/` — a session recording if motion/animation behavior needs checking

If anything is genuinely missing or ambiguous after checking this folder thoroughly, say so clearly
in your final report rather than inventing a value.

## Real content (already extracted — use this directly, don't re-derive)

**Couple:** Andrea Morales & Pedro Fernández (displayed as "Andrea & Pedro")
**Date:** 12 September 2026, 14:00
**Venue:** Finca El Olivar, Camino de los Olivos s/n, 29400 Ronda, Málaga – España
**Language toggle (EN/ES)**: visible on the real site, top-right — **skip, out of scope**, same
decision as `excellence`'s EN/DE toggle (this repo doesn't build i18n infrastructure yet).

**Real theme colors** (from `:root` in `assets/index-swSRspiq.css`, HSL→hex already converted):
| Token | Hex | Use |
|---|---|---|
| `--background` | `#f5f3ef` | page/section background |
| `--foreground` / `--sage-dark` | `#835d2f` | body text, headings |
| `--primary` | `#92723a` | primary accents/buttons |
| `--muted` | `#e8e4d4` | muted card backgrounds |
| `--border` / `--input` | `#d9d0bf` | borders |
| `--ivory` | `#f9f6f1` | lightest background |
| `--cream` | `#f0ebd6` | secondary background |
| `--gold` | `#c5a56d` | gold accent (countdown numerals, etc.) |
| `--gold-soft` | `#ac8b53` | softer gold accent |
| `--champagne` | `#e8e3c9` | card background variant |

**Real fonts**: `--font-body: "arek-armenian", serif` (body text), `--font-display`/`--font-script:
"sweet-fancy-script", cursive` (script headings/names). Add the Typekit `<link>`/`@import` found in
`network/responses/use.typekit.net/xoc5iak.css`'s originating URL
(`https://use.typekit.net/xoc5iak.css`) plus Georgia/Brush-Script-MT fallback stacks, same pattern
as `excellence`.

**Hero video**: `assets/hero-video-BkP1eoiB.mp4`, 5 seconds. **Already checked via `ffmpeg` frame
extraction — this video has NO baked-in text anywhere** (just an ambient watercolor illustration of
a couple walking toward a domed pergola, petals drifting) — unlike `excellence`'s hero video. This
means: **safe to loop** (`heroVideoLoop: true`, the default) and **safe to use a persistent text
overlay** (`showOverlayCopy: true`, no `overlayFadeOutAt` needed — that prop is only for the
timed-fade case `excellence` needed). Overlay copy: eyebrow "WE'RE GETTING MARRIED", script names
"Andrea" / "&" / "Pedro", date "12 September 2026", and a scroll cue "RSVP" (shorter than
`excellence`'s "Keep scrolling and RSVP" — match the real site's actual shorter label) with a
chevron-down, using `Hero.jsx`'s existing `scrollCueLabel` prop.

## Section-by-section content (in order, from the real screenshot)

1. **Hero** — as described above.
2. **Countdown** — script heading "Countdown", subtitle "Until 12 September 2026", **3 boxes only**
   (Days/Hours/Minutes, `showSeconds: false`) on a light cream card — reuse the same restyled
   pattern already built for `excellence` (thin vertical dividers between stats, italic serif
   numerals, no boxed tiles) but in this site's gold/tan palette instead of sage.
3. **Welcome** — script heading "Welcome!", body: "We warmly invite you to celebrate our wedding day
   with us in the beautiful town of Ronda, Andalusia. We look forward to sharing this unforgettable
   moment with our most special people." Followed by a **photo gallery grid** (`gallery-1` through
   `gallery-10` images in the assets folder) — check if an existing shared section supports an image
   grid; if not, add a small reusable `Gallery.jsx` to `src/shared/sections/` (props: `title?`,
   `images: string[]`) rendering a responsive grid/masonry of images, object-fit cover, reasonable
   gap. Keep it simple — this doesn't need a lightbox/carousel, just a tasteful grid.
4. **The Venue** — kicker "Where we celebrate", script heading "The Venue", card with the
   `venue-hedsor` illustration (filename references "Hedsor" but displays as "Finca El Olivar" —
   that's just the source site's asset filename, ignore the mismatch, use the image as-is), script
   venue name "Finca El Olivar", date/time "12 September 2026 · 14:00", address "Camino de los
   Olivos s/n, Ronda / Málaga, 29400 – España", and an "OPEN IN MAPS" link. **Do not use the page's
   embed `pb=` Google Maps string** — it contains a suspicious placeholder-looking place-id
   (repeating `0b0b0b0b` pattern, same red flag as a previously-discovered fabricated URL in this
   project) and may not be real. Instead use the plain search-link pattern already present elsewhere
   in the same page: `https://www.google.com/maps/search/?api=1&query=Finca+El+Olivar+Ronda+Malaga+Spain`
   — reuse this exact working pattern for every "map link" in this demo (Venue, Location &
   Transportation, hotel entries if applicable).
5. **Day Programme** — script heading "Day Programme", subtitle "12 September 2026", a **timeline
   with entries alternating left/right** of a central vertical line (different from `excellence`'s
   left-only-dot timeline): 14:00 Arrival, 14:30 Ceremony, 16:00 Cocktails, 18:00 Dinner, 20:00
   Cutting the Cake, 00:00 Finish. Check `Schedule.jsx`'s existing `stops[]` timeline support (added
   for `excellence`) — it currently renders left-aligned only; if alternating sides is not trivial to
   add as an optional prop, a single-side timeline is an acceptable fallback (note this clearly in
   your report as a simplification), but prefer adding an `alternate: boolean` option if it's clean.
   Background here has an embossed floral pattern — reuse or approximate with a subtle background
   texture if the asset isn't separately downloadable, otherwise just use the plain cream background.
6. **Dress Code** — single card (not per-event split, unlike `excellence`) overlaid on a blurred
   venue photo background: script heading "Dress Code", "Women" (script) / "Cocktail or formal
   dress", divider, "Men" (script) / "Dark suit and tie". `DressCode.jsx`'s existing flat `body`
   prop (not the `cards[]` array added for `excellence`, since this isn't per-event) is the right
   fit here — or pass a single-item `cards` array if that renders equivalently; use judgment.
7. **Pre-Wedding Events** — kicker "PRE-WEDDING EVENTS", script heading "Come Say Hello…", subtitle
   "These are informal gatherings, so feel free to join us if you're in the area." Two illustrated
   cards (reuse `Welcome.jsx`'s `cards[]` pattern built for `excellence`):
   - Welcome Drinks — Friday, September 11th, 2026 · 8:00 PM · Bodega García Hidalgo, Ronda
   - Farewell Brunch — Sunday, September 13th, 2026 · 12:00 PM · Parador de Ronda (terrace)
8. **Location & Transportation** — script heading, address card (pin icon, "Finca El Olivar, Camino
   de los Olivos s/n, 29400 Ronda, Málaga – Spain", "GOOGLE MAPS" link using the same safe
   search-link pattern from step 4), then transportation directions (car icon): "From Málaga: ~1h
   30min via A-357 and A-367", "From Seville: ~2h via A-376", "From Marbella: ~1h via A-397".
9. **Accommodation** — script heading "Accommodation", body "Finca El Olivar does not offer lodging.
   Here are some recommended options nearby." Three hotel entries with richer fields than
   `excellence`'s `HotelList` (name, city, distance, phone, email, website link, optional promo
   code) — extend `HotelList.jsx`'s `hotels[]` item shape with optional `city`, `distanceNote`,
   `phone`, `email`, `websiteUrl`, `promoCode` fields (all optional, backward-compatible with
   `excellence`'s simpler usage which only used `name`/`imageUrl`/`pricePerNight`/`priceNote`/
   `bookingNote`):
   - Parador de Ronda — Ronda · 2 km de la finca · +34 952 877 500 · ronda@parador.es · Visit Website
   - Hotel Catalonia Ronda — Ronda · 1.5 km · +34 952 872 315 · ronda@hoteles-catalonia.es · Visit
     Website · Promo Code: BODA2026
   - Hotel Montelirio — Ronda · Boutique | Sobre el Tajo · +34 952 873 855 ·
     reservas@hotelmontelirio.com · Visit Website
   Closing italic note: "For hotels without direct agreements, please mention 'Wedding at Finca El
   Olivar' to access preferential rates."
10. **Gifts** — script heading "Gifts" overlaid on a blurred photo background, body: "Your presence
    is our greatest gift. If you wish to give us something, please find our bank account information
    below:" — two bank-account cards (this is a NEW content shape not present in `excellence`'s
    plain-text `Gifts.jsx` — extend `Gifts.jsx` with an optional `bankAccounts: [{ bankLabel,
    accountName, iban, bic }]` prop, falls back to current plain-`body`-only rendering when absent):
    - CaixaBank – Andrea Morales — IBAN: ES00 0000 0000 0000 0000 0000 · BIC/SWIFT: XXXXXXXXXXX
    - Banco Santander – Pedro Fernández — IBAN: ES00 0000 0000 0000 0000 0000 · BIC/SWIFT:
      XXXXXXXXXXX
    (These IBAN/BIC values are already placeholder/dummy on the real source site itself — not real
    financial data — keep them exactly as shown, they're intentionally fake demo values.)
11. **RSVP** — script heading "RSVP", subtitle "Let us know if you can make it". Fields (extend
    `Rsvp.jsx` with new optional props, backward-compatible with `excellence`'s usage):
    - Attending radios: "Yes, I'll be there" / "Unfortunately, I can't make it" (this site's own
      wording differs from `excellence`'s "Delighted to accept" — use `attendanceOptions` prop
      already supported)
    - Guest count: `guestCountMode: "stepper"` (already supported)
    - "Person 1 (Main contact)" full name + email (use `nameFieldLabel: "Person 1 (Main contact)"`)
    - **New field**: "Dietary requirements" free-text input, placeholder "e.g. vegetarian,
      allergies, etc." — add an optional `dietaryFieldLabel`/`showDietaryField` prop to `Rsvp.jsx`
    - Children: Yes/No radios (`childrenMode: "radios"`, already supported), label "Will any
      children be attending?"
    - **Do NOT add a "message for the couple" field** — even though the real site has one, this
      repo has a standing decision to never import/build guest message fields (see prior session
      notes) — this is intentional, not an oversight, keep the RSVP form exactly as scoped here.
    - Submit button: "Send RSVP" (with the send/paper-plane icon, already the shared default).
12. **Credit (footer)** — mandatory shared `Credit` section, monogram/couple/date stack like
    `excellence`'s: use `coupleNames: "Andrea & Pedro"`, `eventDate: "12 September 2026"`, and (since
    this site has no monogram image of its own visible in the captured assets — check the assets
    folder for one before assuming; if none exists, omit `monogramUrl` rather than reusing
    `excellence`'s), then the standing credit line `name: "Waleed Ashraf"`,
    `portfolioUrl: "https://waleed-ashraf.vercel.app/"`, `portfolioLabel: "Portfolio"` — replacing
    the real site's own "Made with love by The Digital Yes" credit, same as every other demo in this
    repo.

## Decorative divider illustrations

The real site uses small illustration dividers between sections (floral vase, champagne tower, bow,
cupid, matchbox, locket, swans-framed, wedding-rings — all present as downloaded assets in
`network/responses/premiumelegante.thedigitalyes.com/assets/`). Use them as simple centered
decorative images between sections where they appear in the reference screenshot, following
whatever divider pattern this repo's shared sections already support (check `Welcome.jsx`,
`DressCode.jsx`, etc. for an existing `illustrationUrl`/divider prop before inventing a new one).

## Media handling

- Copy only used assets to `public/assets/elegante/`, kebab-case filenames, no hash suffixes.
- Compress per `TASKS.md` pipeline rules: video via `ffmpeg -i <in> -c:v libx264 -crf 26 -preset
  slow -c:a aac -b:a 128k -vf "scale='min(1080,iw)':-2" -movflags +faststart <out>`, audio >160k via
  `ffmpeg -i <in> -b:a 128k <out>`, JPEGs >500KB via `ffmpeg -i <in> -q:v 4 <out>` (keep only if
  smaller). The hero video note: if `ffmpeg` frame extraction hits a "non-standard YUV range" error
  on this particular file, add `-vf format=yuv420p` and `-strict unofficial` to the ffmpeg command
  (already confirmed necessary for this specific video during investigation).
- There's also `assets/intro-video-new-XmwQeafK.mp4` and `assets/intro-poster-new-BU7qGwfU.jpg` for
  the tap-to-open intro (reuse `VideoOpenIntro`, same as every other demo).
- Background music: check `network/manifest.json` / the CSS or HTML for an audio asset URL — if none
  is present in this capture (the crawl report shows only 2 "media" resources, likely the two hero
  video formats, not separate audio), this demo may simply have no background music; don't fabricate
  one, just omit `musicUrl` from `media{}`.

## Reuse-first reminders (same lessons as `excellence`, condensed)

- Reuse shared components with their existing optional props before adding new ones; when a genuinely
  new shape is needed (Gallery grid, bank-account Gifts variant, richer HotelList fields, RSVP
  dietary field), extend the shared component with backward-compatible optional props, never fork a
  one-off in the site file.
- Every downloaded video/audio file MUST be wired into `data.js` `media{}`/section props — verify,
  don't just download and forget.
- Every new/reused `<img>` needs a CSS class with a responsive width constraint — test 390px viewport
  for zero horizontal overflow, not just `npm run build`.
- Standing footer requirement: Credit section with Waleed Ashraf's portfolio link, always last.
- No guest message wall / public comment feature, ever.
- If your sandbox can't bind a local dev server to self-verify visually, say so plainly in your
  report rather than treating `npm run build` alone as proof of correctness.

## Acceptance criteria ("Done when")

- New route `/elegante/` renders: intro → hero → countdown → welcome+gallery → venue → day
  programme → dress code → pre-wedding events → location/transportation → accommodation → gifts →
  rsvp → credit footer, matching the real site's actual order and content transcribed above.
- Real colors/fonts applied (gold/tan palette, `arek-armenian`/`sweet-fancy-script`), not
  placeholders.
- `npm run build` succeeds with a separate lazy chunk for the new site; gallery card appears
  automatically at `/` from `siteMeta`.
- Report back: what was built faithfully from the captured data, what had to be simplified/
  approximated (e.g. alternating timeline → single-side fallback, if that ends up being the case),
  and what could not be visually self-verified.
