# TASKS — excellence demo: additions

> Self-contained task list for implementation in the `abdelrahman_norhan_invitation_scraped` repo.

---

## Task 1 — Add the decorative flowering columns to the Countdown section

The real source site's Countdown section shows two tall decorative stone columns wrapped in white
flowers, flanking the countdown card (one on the left edge, one on the right edge, both bleeding
off the top/bottom of the section). The image assets already exist at
`public/assets/excellence/column-left.png` and `public/assets/excellence/column-right.png` but are
currently unused anywhere in the codebase — they were copied during the original asset scrape but
never wired into any section.

- `src/shared/sections/Countdown.jsx` currently supports `bgImage` (full background) and
  `overlayImage` (single foreground decoration) props, but nothing for two independent side
  decorations. Add two new optional props: `columnLeftUrl` and `columnRightUrl`. When present,
  render each as an `<img>` positioned absolutely at the left/right edge of `.countdown-section`,
  tall enough to bleed off the top and bottom of the section (matching the reference: the columns
  extend above the cream card into the section above and below it slightly), `pointer-events: none`,
  `user-select: none`, similar treatment to how `overlayImage`/`bgImage` are already handled.
- Add corresponding CSS in `src/sites/excellence/styles.css`: `.countdown-column-left` /
  `.countdown-column-right` — `position: absolute`, pinned to `left: 0` / `right: 0`, vertically
  centered or spanning most of the section height, `z-index` above `.countdown-bg` but below
  `.countdown-panel`'s content (so the columns sit behind the countdown text but in front of any
  background), `width` sized so the column reads clearly without dominating the layout (check the
  reference image proportions — roughly 15-20% of viewport width on mobile). Ensure this does not
  cause horizontal overflow at 390px viewport — constrain with `max-width`/`object-fit: contain` and
  verify with a scrollWidth check.
- In `src/sites/excellence/data.js`, add to the `countdown` section's `props`:
  `columnLeftUrl: "/assets/excellence/column-left.png"`,
  `columnRightUrl: "/assets/excellence/column-right.png"`.

**Done when:** `/excellence/` Countdown section shows both flowering columns flanking the countdown
card, matching the reference screenshot; `npm run build` succeeds; no horizontal overflow at 390px
or 1280px viewports (`document.documentElement.scrollWidth === clientWidth` at both); other sites
using `Countdown` without these new props render unchanged (they default to `undefined`, so nothing
renders — verify by checking `/africa/` or another site using Countdown still looks identical).

---

## Verification

1. `npm run build` — must succeed.
2. `npm run dev`, visit `/excellence/`, scroll to Countdown — confirm both columns visible, flanking
   the countdown card, not overlapping the numbers/text.
3. Mobile (390px) and desktop (1280px) overflow check — must stay 0px.
4. Spot-check one other site using `Countdown` (e.g. `/africa/`) to confirm no regression.
