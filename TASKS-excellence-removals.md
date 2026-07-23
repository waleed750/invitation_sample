# TASKS — excellence demo: content removals

> Self-contained task list for `codex` to execute in the `abdelrahman_norhan_invitation_scraped`
> repo. This is a running list of sections the user wants removed from `/excellence/` after
> reviewing the current build — more items may be appended after this first one, so re-read this
> file for the latest version before starting if there's a chance it changed since you last saw it.

---

## Task 1 — Remove the "Where to Stay" hotel section entirely

The user wants the whole "Where to Stay" section removed from `/excellence/` — this is the section
showing "Recommended hotels near the venue" with three cards (The Peninsula Istanbul €735, JW
Marriott Istanbul €314, Novotel Istanbul €192), each with an illustration, price, and "Booking link
coming soon" note.

- In `src/sites/excellence/data.js`, delete the `{ type: "hotelList", props: {...} }` entry from the
  `sections` array entirely (it currently sits between the `dressCode` and `map` sections).
- In `src/sites/excellence/ExcellenceInvitation.jsx`, remove the `hotelList: HotelList` entry from
  the `sectionComponents` map and the now-unused `import HotelList from "..."` line.
- **Do not delete** `src/shared/sections/HotelList.jsx` itself, its export in
  `src/shared/sections/index.js`, or the `'hotelList'` entry in `SECTION_TYPES`
  (`src/registry/schema.js`) — this was built as a reusable shared component and may be used by a
  future demo; only stop using it in excellence's own `data.js`/`sectionComponents`.
- Leave `public/assets/excellence/hotel-peninsula.png`, `hotel-marriott.png`, `hotel-novotel.png` in
  place (unused assets in `public/` don't get bundled into the JS output, so no cleanup needed there
  — removing them risks breaking something if they're reused elsewhere later).
- Check the section immediately after the removed one (`map`, showing the Peninsula Hotel Istanbul
  venue location) still flows correctly directly after `dressCode` with no leftover spacing/margin
  gap where the hotel section used to be — the `dressCode` section's bottom margin and `map`
  section's top margin/padding should read naturally once the hotel section is gone (visually
  compare before/after screenshots at 390px and 1280px viewports).

**Done when:** `/excellence/` no longer shows "Where to Stay" or any hotel cards anywhere in the
scroll flow; `npm run build` succeeds with no orphaned imports/unused-variable warnings for
`HotelList` in `ExcellenceInvitation.jsx`; no visual gap or double-spacing where the section used to
sit between Dress Code and the Map section.

---

## Verification

1. `npm run build` — must succeed.
2. `npm run dev`, visit `/excellence/` — scroll from Dress Code straight to the Map section, confirm
   no hotel content and no layout gap.
3. Mobile (390px) and desktop (1280px) viewport check for overflow — should remain 0px, as in prior
   rounds.
