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

## Session: 2026-07-23 01:40

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-24 11:47

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-08-14 16:11

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-09-24 11:54

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:03 | Wrote PLATFORM_PLAN.md (SaaS launch plan; debated decisions with opencode) | PLATFORM_PLAN.md, .wolf/STATUS.md | done | ~9000 |
| 12:17 | Floral demo converted — unzipped, SSR copy extracted, 5 assets compressed (hero HEVC 9.3→1.0M h264 crf26, intro 2.2→0.51M, music 320→128k 2.7→1.1M, poster 710→70K q4), hero verified as ambient loop via ffmpeg frames (distinct hashes, loop true, overlay rendered), local FloralHero/Venue/Schedule/Gifts/Divider/Footer + shared Countdown(kicker) & Rsvp, no pb= map (q&output=embed), responsive safe | src/sites/floral/*, public/assets/floral/*, src/registry/index.js, src/registry/templateTypes.js, src/shared/sections/Countdown.jsx | build passes, FloralInvitation-DwN5nRok.css+FloralInvitation-fypxyZ3Y.js own lazy chunk, all 6 media URLs wired | ~3500 |
| 12:31 | Finca demo converted — unzipped finca-demo.zip, SSR copy extracted (Mar & Jaume, 8 May 2027, 17:00-01:00 Finca Biniagual, 7-step programme, 2 hotels, gifts IBAN, RSVP allergies), 10 assets compressed (hero webm 4.4→0.94M h264 crf26 1080p, intro mov 4.8→0.48M, music 320→128k 2.7→1.1M, hero-illust 2.6M→365K + intro-poster 2.8M→122K JPEG q4, RGBA PNGs left alone), hero verified as ambient loop via ffmpeg frames (black scrim + overlay, loop true), local FincaHero/Venue/Schedule/Hotels/Gifts/Rsvp/Divider/Footer + shared Countdown, map q&output=embed, responsive safe | src/sites/finca/*, public/assets/finca/*, src/registry/index.js, src/registry/templateTypes.js | build passes, FincaInvitation-CGeGgyD3.css+FincaInvitation-CtuJsqo5.js own lazy chunk, all media URLs wired, durations verified | ~4000 |
| 12:35 | Finca template verified independently (build + lazy chunk confirmed) | src/sites/finca/, public/assets/finca/ | build passes | ~300 |
| 12:45 | Sweetlove demo converted — unzipped sweetlove-demo.zip (Laura & Javier, 18 May 2026 Masia Can Cortada), SSR copy extracted (7-step programme, countdown, gifts accordion, RSVP allergies/companions, rsvp confirmation video), 7 assets compressed (hero 10→1.2M h264 crf26 1080p 10.04s loop verified via ffmpeg frames distinct hashes, intro 8.7→0.42M 2.96s, rsvp webm 9.0→1.5M 5.04s, music 320→128k 5.8→2.3M, poster 1.3M→121K q4, hero poster 51K), hero verified ambient loop loop:true overlay:true, local SweetloveHero/Venue/Schedule/Gifts/Rsvp/Divider/Footer + shared Countdown, map q&output=embed, responsive safe | src/sites/sweetlove/*, public/assets/sweetlove/*, src/registry/index.js, src/registry/templateTypes.js | build passes, SweetloveInvitation-DT9xhe3F.css+SweetloveInvitation-BWEymUEL.js own lazy chunk, all 7 media URLs wired, durations verified | ~3800 |
| 12:51 | Sweetlove (dulce-amor) template verified independently (build + lazy chunk + href confirmed) | src/sites/sweetlove/, public/assets/sweetlove/ | build passes | ~300 |
| 13:30 | Dolce Vita demo converted — unzipped dolcevita-demo.zip (Marco & Sofia, 12 Sep 2026 Lake Como, Chiesa di Santa Maria Maddalena 16:00 + Villa del Balbianello 18:30, 8-step schedule, dress code, Grand Hotel Tremezzo €420, boat 17:15/23:00/01:30, gifts Bank/Satispay/WWF, RSVP dinner/transport/accommodation + confirmation video), 33 assets (hero 0.6M h264 7.04s loop verified distinct hashes, intro hevc 1.4→0.58M h264 3.33s, rsvp webm 9.0→1.5M 5.04s, music 320→128k 10→4.1M, posters 967→127K + 864→72K q4, hero-poster 192K, 25 RGBA PNGs left alone), hero verified ambient loop loop:true overlay:true, local DolceHero/Location/Schedule/Dress/Accommodation/Transport/Gifts/Rsvp/Footer + shared Countdown, maps q&output=embed no pb=, responsive safe | src/sites/dolcevita/*, public/assets/dolcevita/*, src/registry/index.js, src/registry/templateTypes.js | build passes, DolceVitaInvitation-BDgxxfkf.css+DolceVitaInvitation-qHBLRiOp.js own lazy chunk, all 33 media URLs wired, durations verified; dev server binding may be blocked by sandbox EPERM | ~4200 |
| 13:33 | Dolce Vita template verified independently (build + lazy chunk confirmed) | src/sites/dolcevita/, public/assets/dolcevita/ | build passes | ~300 |
| 13:45 | DayNight demo converted — unzipped daynight-template.zip (Lucía & Felipe, 18 Sep 2027 Villa Montalcino, day/night dual hero 3.04s scrub, countdown, framed venue, 5-step schedule, dress code, 2 hotels, transport, gifts, RSVP companions/transport), 19 assets (hero 4.4→0.40M h264 crf26 716x1284, intro mov 651→485K 1.70s, rsvp webm 9.0→1.5M 5.04s, music 320→128k 2.7→1.1M, intro-poster 1039→176K q4 + hero 2.6M PNG→365K JPG, framed 1.6M PNG→98K JPG, RGBA PNGs left), hero verified one-shot scrub (distinct hashes, loop false overlay true, raf rewind), local DayNightHero/Venue/Schedule/Dress/Hotels/Transport/Gifts/PhotoDivider/Rsvp/Footer + shared Countdown, map q&output=embed, responsive safe | src/sites/daynight/*, public/assets/daynight/*, src/registry/index.js, src/registry/templateTypes.js | build passes, DayNightInvitation-L1zhYknw.css+DayNightInvitation-ByR-yKE9.js own lazy chunk, all 19 media URLs wired, durations verified; dev server binds ok (no EPERM) | ~4500 |
| 13:44 | DayNight template verified independently (build + lazy chunk confirmed) | src/sites/daynight/, public/assets/daynight/ | build passes | ~300 |
| 13:50 | Bridgerton demo converted — unzipped bridgerton-template.zip (Lucia & Matteo, 27 July 2027 Château de la Couronne 19:00, envelope intro 4.0s hevc→h264 860K + hero loop 7.04s h264 1.8M loop verified distinct hashes), 21 assets (hero 17→1.8M crf26 1080p, intro hevc 2.2→0.86M, music 320→128k 2.8→1.1M, intro-poster 943→144K q4, venue/floral frame PNG rgb24 1.8/2.1M→88/142K JPG, RGBA PNGs left), hero verified ambient loop loop:true overlay:true, local BridgertonHero/Welcome/Countdown/Dress/Hotels/Discover/Gifts/Rsvp/Footer + shared Countdown, map q&output=embed no pb=, responsive safe | src/sites/bridgerton/*, public/assets/bridgerton/*, src/registry/index.js, src/registry/templateTypes.js | build passes, BridgertonInvitation-_o7hu05S.css+BridgertonInvitation-BenxQu_U.js own lazy chunk, all 23 media URLs wired, durations verified; dev server binds ok | ~4200 |
| 13:51 | Bridgerton template verified independently (build + lazy chunk confirmed) | src/sites/bridgerton/, public/assets/bridgerton/ | build passes | ~300 |
| 14:00 | Bloom demo converted — unzipped bloom-template.zip (Martina & Javier, 27 Sep 2026 Hotel du Cap-Eden-Roc 17:30-01:30, welcome party Restaurant César 26 Sep, 19-gallery marquee, 2 hotels + shuttle/valet, black-tie, programme 4 steps), 52 assets (intro 2-videos hevc 5.48s 2.5M + h264 7.04s 19M → crf26 932K+3.1M concat 12.54s 4.0M, music 5.2→2.1M 320→128k, hero-bg 2.5M→333K + ceremony-oval 2.0M→117K + rsvp-portrait 1.3M→62K JPG q4, intro-poster 918→93K q4, 26 RGBA PNGs left, galleries <500K left), hero static image + SVG arch overlay (ambient, no loop needed), local BloomHero/Welcome/Ceremony/Dress/Programme/StoryGallery/Weekend/Hotels/Transport/Rsvp/Footer + shared Countdown, maps q&output=embed no pb=, responsive safe | src/sites/bloom/*, public/assets/bloom/*, src/registry/index.js, src/registry/templateTypes.js | build passes, BloomInvitation-DOdZ4Ol7.css+BloomInvitation-6acB5jT5.js own lazy chunk, all 57 media URLs wired, durations verified; dev server binds ok (no EPERM) | ~4500 |
| 14:01 | ALL 7 templates verified in final combined build (floral, finca, sweetlove, dolcevita, daynight, bridgerton, bloom) | src/sites/*, public/assets/* | build passes, 16 total templates | ~500 |
