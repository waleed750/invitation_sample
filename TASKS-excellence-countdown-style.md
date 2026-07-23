# TASKS — excellence demo: Countdown card restyle

> Implement directly in the `abdelrahman_norhan_invitation_scraped` repo — no confirmation needed,
> proceed and verify with `npm run build` + a live browser check.

## Task 1 — Restyle the Countdown card to match the real site's light card, not a dark panel

Current `/excellence/` Countdown section renders a **dark sage gradient panel**
(`.countdown-panel { background: linear-gradient(#2d4333 0%, #486a52 60%, #2d4333 100%); }`) with
white/cream numbers in individually-boxed `.time-box` tiles. The user wants it to instead match the
real reference site's **light cream card** style (screenshot provided, "Until 23 July 2026" example
— ignore the specific date/names in the reference, only copy the visual style):

- Card background: **cream/ivory** (`var(--background)`), matching the rest of the page — not a
  dark gradient. The flowering columns (`columnLeftUrl`/`columnRightUrl`, added last round) sit
  directly on this cream background in the reference, overlapping it at the edges — keep the
  columns exactly as they are positioned now, only change the panel background/text colors behind
  them.
- Heading "Countdown" and "Until [date]" subtitle: switch from white/cream (`var(--primary-fg)`) to
  **sage** (`var(--foreground)` / `var(--sage-dark)`) text color, since the background is now light
  instead of dark.
- Countdown numbers: replace the current boxed `.time-box` tile style (bold sans digits in
  individual cards) with the reference's style — large **italic serif** numerals (use
  `var(--font-body)` with `font-style: italic`, matching the elegant serif used elsewhere on the
  site) with **thin vertical divider lines** between each stat (Days | Hours | Minutes) instead of
  separate boxed cards — a simple `border-left: 1px solid var(--border)` (or similar) on all but the
  first `.time-box`, no box background/border around each individual tile.
- Labels ("DAYS", "HOURS", "MINUTES"): small-caps, letter-spaced, sage-colored — consistent with the
  reference and the rest of the site's label styling (reuse the existing pattern from
  `.event-card-date`/`.event-card-time` in `src/sites/excellence/styles.css` line ~285 for the
  letter-spacing/text-transform/font-size approach, adapted for this context).
- Remove or adjust the `.countdown-panel`'s `mask-image` vignette rule — it was there to blend a
  differently-colored dark panel into the cream page; if the panel is now the same cream as the
  page background, this masking is likely unnecessary. Check visually and remove if it causes any
  odd fade/vignette artifact against the now-matching background.

This only affects `src/sites/excellence/styles.css` (site-specific styling) — `Countdown.jsx` itself
(shared component, `src/shared/sections/Countdown.jsx`) does not need structural changes, this is a
CSS-only restyle scoped to the excellence site. Do not touch other sites using `Countdown` (e.g.
`/africa/`) — their dark-panel style (if any) stays as-is; only excellence's `styles.css` changes.

**Done when:** `/excellence/` Countdown section shows a cream/ivory card (not dark green) with the
flowering columns overlapping it, sage-colored heading/subtitle/labels, and large italic serif
numbers separated by thin vertical dividers instead of boxed tiles — matching the provided reference
screenshot's visual style (with our own real date "Until 20 August 2026", not the reference's
placeholder date).

## Verification

1. `npm run build` — must succeed.
2. `npm run dev`, visit `/excellence/`, scroll to Countdown — confirm cream background, sage text,
   italic numerals with dividers, columns still correctly positioned with no overlap/overflow.
3. Mobile (390px) and desktop (1280px) viewport overflow check — must stay 0px.
4. Confirm `/africa/` (or another site using `Countdown`) is visually unchanged.
