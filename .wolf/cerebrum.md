# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-07-18

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** abdelrahman-nourhan-invitation
- **Description:** Editable React/Vite invitation template lab for Abdelrahman and Nourhan.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-07-23] After any opencode-delegate media/asset scrape, verify every downloaded video/audio file is actually wired into data.js media{}/section props — InvitationShell and Hero silently render with no video/audio when a URL prop is undefined (no error, no build failure). Always test with Playwright (tap intro, check `<video>` count and `audio.paused === false`) not just `npm run build`.
- [2026-07-23] Never trust an opencode-delegate-generated Google Maps embed `pb=` string without visually verifying the map loads — it will fabricate a plausible-looking but non-functional pb= parameter rather than flagging missing data. Prefer the no-API-key `https://www.google.com/maps?q=<address>&output=embed` pattern when the real pb= string isn't available from the source site.
- [2026-07-23] Always test new demos at a mobile viewport (e.g. 390×844) with Playwright, checking `document.documentElement.scrollWidth` for horizontal overflow — `npm run build` and a 1280px desktop check do NOT catch this. Found on excellence: a shared section (`Details.jsx`'s `ornateBadgeUrl` image) had no CSS class at all, so it rendered at native image width (~890px) with zero responsive constraint, blowing out the whole page on every viewport including desktop-but-unnoticed-until-mobile-diffed. Fixed the shared component (added `className="badge-image"` so any site CAN target it) and added the missing `.badge-frame` CSS to excellence/styles.css. Any *future* site using `Details` + `ornateBadgeUrl` still needs its own `.badge-frame` CSS — the shared component only guarantees the image is class-targetable, not styled.
- [2026-07-23] Before wiring a scraped hero/background video into the shared `Hero` section, always extract a few frames (`ffmpeg -vf select=eq(n\,N) -vframes 1`) and check whether the video is (a) a self-contained one-shot animated card with its own baked-in couple names/date/venue text, or (b) a generic ambient loop backdrop. Only case (b) should get Hero's text overlay + `loop`. Added `Hero.jsx` props `heroVideoLoop` (default true) and `showOverlayCopy` (default true) precisely for this — set both false when the video already IS the designed invitation card, otherwise you get duplicated/overlapping text and a jarring restart every N seconds. This must be checked for the second demo too.
- [2026-07-23] Excellence Typekit kit `https://use.typekit.net/jzm0juw.css` loads successfully on localhost/Brave (200 responses; `mrs-eaves` and `parfumerie-script` available via `document.fonts.check`). Keep Georgia/Brush Script fallbacks in CSS because Typekit may still be domain-sensitive in other deploy environments.
- [2026-07-23] `/boho/` currently has a small pre-existing mobile horizontal overflow at 390px (scrollWidth 402) from boho-local decorative images `.bw-rsvp__frame` and `.bw-travel__airport-ill--single`; not caused by excellence shared-section prop additions.
- [2026-07-23] Timed hero overlays need hero-video playback synchronized to post-intro content visibility. In InvitationShell, site content is mounted but opacity-hidden while VideoOpenIntro plays, so a normal `autoPlay` hero video can finish behind the intro before the guest sees it. `Hero.jsx` now disables autoplay and restarts playback from 0 only when the parent content wrapper gets `.is-visible`, but only for callers that pass `overlayFadeOutAt`.
- [2026-07-23] Shared section removals for a single demo should only unwire that demo's `data.js`/section map and any demo metadata; keep reusable shared components, schema entries, exports, and public assets unless the task explicitly asks for deletion. Applied to Excellence `hotelList` removal.
- [2026-07-23] The current Codex sandbox may block local Vite server binding with `listen EPERM` even after a successful production build; do not treat this as an app build failure. Record the limitation and ask the user to run live viewport checks locally if browser verification is required.
- [2026-07-23] Premium Elegante local capture lists `wedding-background-music-yxy0nS2O.mp3` in `network/manifest.json`, but `local_path` is null because the body was not saved. For local-only conversions, omit `musicUrl` when the actual media file is missing; `InvitationShell` now hides the music button when no music URL is provided.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- [2026-07-19] Decision: implementation delegated to opencode CLI (`opencode run --auto`), Claude reviews each phase against TASKS.md gates. Agent def: .claude/agents/opencode-delegate.md.
- [2026-07-19] Learning: scraped thedigitalyes demos = minified React SPAs but all copy is SSR-baked into index.html (extract via HTML, not JS); hashed asset filenames; Typekit fonts can't be bundled → fallback stacks; ignore _external/ and _screenshot.png.
- [2026-07-19] Do-not-repeat: section render keys must be `section.id ?? type-index` (plain type collides on repeated sections); intro CSS must live with the intro component, not in a site's lazy CSS chunk.
- [2026-07-23] Decision: Credit footer promoted to shared component (type 'credit' in schema) by explicit standing user instruction — will be reused across all current and future demos.
- [2026-07-23] Decision: excellence's new wedding date is treated as 20 August 2026; the Welcome Cruise was shifted to the prior day, 19 August 2026, to preserve the existing two-day weekend structure while updating the wedding date.
