# TASKS — excellence demo: remove hero video fade/wash

> Implement directly in the `abdelrahman_norhan_invitation_scraped` repo — no confirmation needed,
> proceed and verify with `npm run build` + a live browser check.

## Task 1 — Remove the white wash/fade over the bottom of the hero video

User feedback (with screenshot): the bottom portion of the hero video looks washed out / faded to
white, obscuring the image (visible around "TO BE HELD AT", the venue name, "AT SIX O'CLOCK IN THE
EVENING", and the "KEEP SCROLLING AND RSVP" area). They want the video to read as fully visible
there, not faded.

This comes from two stacked effects in `src/sites/excellence/styles.css` (around line 100-119):

```css
.hero-video {
  ...
  mask-image: linear-gradient(black 0%, black 88%, transparent 100%);
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(246, 244, 238, 0) 0%,
    rgba(246, 244, 238, 0.65) 60%,
    rgb(246, 244, 238) 100%
  );
  z-index: 2;
  pointer-events: none;
}
```

Good news: every site that uses the shared `Hero` component (`africa`, `aventureros`, `boho`,
`excellence`, `video-open-invitation`) defines its **own** `.hero-scrim` rule in its own
`styles.css` — it's not a shared/global style, so this can be a **CSS-only change scoped entirely
to `src/sites/excellence/styles.css`**. Do not touch `src/shared/sections/Hero.jsx` at all (the
`<div className="hero-scrim" />` markup stays; only excellence's own CSS for that class changes).

- **Remove the `mask-image` rule from `.hero-video`** in `src/sites/excellence/styles.css` (around
  line 106) entirely — the video should render at full opacity/visibility across its whole height,
  no fade-to-transparent at the bottom.
- **Remove (or drastically reduce) `.hero-scrim`'s gradient wash** in the same file (around line
  108-119). It currently fades from transparent at 0% to fully opaque cream at 100%, covering most
  of the lower half of the video. Since the user wants the video to read as solid/fully visible, do
  one of:
  (a) delete the gradient background from `.hero-scrim` (set it to `background: none` or remove the
      rule's background entirely, keeping the element inert), and instead give `.hero-scroll-cue`
      (the "KEEP SCROLLING AND RSVP" element, in the same stylesheet) its own `text-shadow` for
      legibility against the video (e.g. `text-shadow: 0 1px 12px rgba(45, 67, 51, 0.4), 0 1px 2px
      rgba(0,0,0,0.3)` or similar — check what `.hero-copy` already uses for its text-shadow and
      reuse a similar approach), **or**
  (b) keep a much smaller/subtler scrim confined to just the last ~10-15% of the section height
      (not 0-100% as it is now) so it doesn't wash out most of the video, only smooths the exact
      transition into the next section.
  Prefer option (a) (full removal + text-shadow on the scroll cue) unless it turns out the section
  boundary looks visually broken without any transition — use judgment and check the live result.
- Confirm the hero video's own baked-in card design (visible in the final ~4 seconds, per prior
  session work — "Diana & Richard" era text baked into the video pixels, not part of our data) is
  now clearly, fully visible with no wash-out, matching the user's expectation from their reference
  screenshot.
- Do not touch `.hero-copy`'s existing `text-shadow`/color (the "WE ARE GETTING MARRIED / Mohamad &
  Salma" overlay from earlier work) — that part already reads correctly. This task is scoped to the
  wash/fade effect over the video itself and the scroll cue's legibility, not the name overlay.

**Done when:** the hero video renders at full visibility top to bottom with no white fade/wash
obscuring any part of it, the "KEEP SCROLLING AND RSVP" scroll cue remains legible against the video
(via text-shadow or a much subtler localized transition, not a broad wash), and the section-to-
section transition into Countdown still looks intentional, not abruptly clipped.

## Verification

1. `npm run build` — must succeed.
2. Visually confirm in a live browser: hero video fully visible, no fade/wash at the bottom, scroll
   cue text still readable.
3. Mobile (390px) and desktop (1280px) viewport overflow check — must stay 0px.
4. Do not modify `src/shared/sections/Hero.jsx` — this change is entirely scoped to
   `src/sites/excellence/styles.css`, so other sites (`africa`, `aventureros`, `boho`,
   `video-open-invitation`) are unaffected by construction. Spot-check one of them anyway (e.g.
   `/africa/`) to confirm nothing changed there.
