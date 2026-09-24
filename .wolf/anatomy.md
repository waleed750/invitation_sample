# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-19
> Files: 46 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.DS_Store` (~1640 tok)
- `.gitignore` — Git ignore rules (~118 tok)
- `.vercelignore` (~39 tok)
- `AGENTS.md` — OpenWolf (~68 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)
- `index.html` — You're invited - Abdelrahman & Nourhan (~264 tok)
- `package-lock.json` — npm lock file (~16695 tok)
- `package.json` — Node.js package manifest (~130 tok)
- `PLATFORM_PLAN.md` — SaaS launch plan: inventory, legal blocker, stack, auth, pricing, dashboards, DDoS/rate limits, AI Theme Spec + reels, roadmap (~6500 tok)
- `README.md` — Project documentation (~840 tok)
- `vercel.json` (~41 tok)

## .claude/

- `settings.json` (~514 tok)

## .claude/commands/

- `reframe.md` — Mode: migrate [framework] (~551 tok)
- `security-audit.md` — Layer 1 — Dependencies (~510 tok)

## .claude/rules/

- `openwolf.md` (~328 tok)

## .codex/

- `config.toml` (~7 tok)
- `hooks.json` (~727 tok)

## .codex/prompts/

- `reframe.md` — Mode: migrate [framework] (~551 tok)
- `security-audit.md` — Layer 1 — Dependencies (~510 tok)

## imports/cloudflare-link/

- `batch-report.json` (~9076 tok)
- `current-download-status.json` (~776 tok)
- `demo-manifest.json` (~2231 tok)
- `digitalyes_all_sites_index.html` — Directory listing for /digitalyes_all_sites/ (~110 tok)
- `index.html` — Directory listing for / (~116 tok)
- `reports-index.html` — Directory listing for /digitalyes_all_sites/reports/ (~155 tok)
- `sample_data_index.html` — Directory listing for /sample_data/ (~156 tok)
- `site-zips-index.html` — Directory listing for /digitalyes_all_sites/site-zips/ (~543 tok)

## public/maps/embed/

- `index.html` — onEmbedLoad: onApiLoad (~768 tok)

## src/

- `app.css` — Styles: 57 rules, 2 media queries (~2238 tok)
- `main.jsx` — templates — uses useState, useMemo (~2079 tok)
  - fn `AppRouter` L17-21 (~36 tok)
  - fn `normalizePath` L22-27 (~60 tok)
  - fn `TemplateIndex` L28-151 (~1347 tok)
  - fn `TemplateCard` L152-200 (~435 tok)

## src/shared/

- `InvitationShell.jsx` — Shared invitation shell: useRevealOnScroll, audio/music toggle, body bg, theme CSS vars, intro wiring, sections.map render loop (~500 tok)

## src/shared/intros/

- `VideoOpenIntro.jsx` — Tap-to-open poster + video intro, fully data-driven (~310 tok)
- `ScratchRevealIntro.jsx` — Scratch canvas + reveal intro, fully data-driven (~640 tok)

## src/shared/sections/

- `Hero.jsx` — Hero section: names, headline, background video (~170 tok)
- `Countdown.jsx` — Live countdown to event date (~220 tok)
- `Welcome.jsx` — Heading + body paragraph (~90 tok)
- `Schedule.jsx` — Ordered schedule items (~170 tok)
- `Details.jsx` — Venue details, time, map link (~240 tok)
- `Map.jsx` — Embedded Google Maps iframe (~100 tok)
- `MessageForm.jsx` — Guestbook/message form (~260 tok)
- `Credit.jsx` — Reusable credit footer with portfolio link (~120 tok)
- `HotelList.jsx` — Recommended hotel cards with image, price, note, booking status (~180 tok)
- `Gallery.jsx` — Responsive image grid for invitation photo galleries (~120 tok)
- `ImageDivider.jsx` — Centered decorative divider image with optional horizontal rule (~60 tok)
- `index.js` — Barrel export for all sections (~90 tok)

## src/registry/

- `templateTypes.js` — Frozen enum objects for eventType, siteType, experienceType, introType, layoutFamily (~260 tok)
- `schema.js` — JSDoc invitation data schema + Section type definitions (~900 tok)
- `index.js` — Central templates array with React.lazy per site (~200 tok)

## src/sites/lace-photo-scratch/

- `data.js` — Exports laceScratchData, siteMeta (~342 tok)
- `LacePhotoScratch.jsx` — LacePhotoScratch — renders chart — uses useRef, useState, useEffect (~1632 tok)
  - fn `LacePhotoScratch` L6-85 (~671 tok)
  - fn `ScratchCanvas` L86-145 (~496 tok)
  - fn `paintCover` L146-178 (~326 tok)
  - fn `calculateCleared` L179-189 (~88 tok)
- `styles.css` — Styles: 32 rules, 1 media queries, 1 animations (~1525 tok)

## src/sites/video-open-invitation/

- `data.js` — Exports invitationData, siteMeta (~727 tok)
- `styles.css` — Styles: 82 rules, 1 media queries, 1 animations (~3087 tok)
- `VideoOpenInvitation.jsx` — Thin wrapper: local section components + InvitationShell render (~100 tok)

## src/sites/africa/

- `data.js` — Exports invitationData, siteMeta (10 sections, safari-editorial) (~800 tok)
- `styles.css` — Styles: safari-editorial theme, ~600 lines (~2200 tok)
- `AfricaInvitation.jsx` — Thin wrapper: AfricaFooter + sectionComponents map + InvitationShell render (~80 tok)

## src/sites/excellence/

- `data.js` — Exports invitationData, siteMeta (10 sections, luxury-floral) (~750 tok)
- `styles.css` — Styles: luxury-floral theme, ~500 lines (~1800 tok)
- `ExcellenceInvitation.jsx` — Thin wrapper: sectionComponents map + InvitationShell render (~70 tok)

## src/sites/elegante/

- `data.js` — Exports invitationData, siteMeta for Andrea & Pedro Elegante wedding route (~1000 tok)
- `styles.css` — Gold/tan Elegante theme, gallery, venue, alternating timeline, hotel/gifts/RSVP styling (~2600 tok)
- `EleganteInvitation.jsx` — Thin wrapper plus local Location & Transportation section (~220 tok)

## src/sites/floral/

- `data.js` — Exports invitationData, siteMeta for Carla & Miguel Ángel floral route (hero/video intro, countdown with kicker, venue map, program, gifts accordion, RSVP, footer) (~650 tok)
- `FloralInvitation.jsx` — Thin wrapper: local FloralHero/Venue/Schedule/Gifts/Divider/Footer + shared Countdown(kicker) & Rsvp, side floral border decorations via decor wrapper (~280 tok)
- `styles.css` — Dusty rose floral-romantic theme, side decor absolute images (11 variants), hero video overlay, countdown cards, venue map card, schedule grid, gifts accordion, rsvp, footer (~550 tok)

## src/sites/finca/

- `data.js` — Exports invitationData, siteMeta for Mar & Jaume finca route (hero loop + intro mov, countdown, venue photo+map, 7-step schedule, 2 hotels, gifts IBAN, RSVP allergies, footer) (~650 tok)
- `FincaInvitation.jsx` — Thin wrapper: local FincaHero/Venue/Schedule/Hotels/Gifts/Rsvp/Divider/Footer + shared Countdown, InvitationShell with sage palette (~450 tok)
- `styles.css` — Sage finca-rustic theme, hero scrim + diamond divider, countdown dark panel, venue card with map, schedule desktop-grid+mobile-timeline, hotel grid, gifts accordion with confetti, rsvp with companions/allergies, footer (~650 tok)

## public/assets/finca/

- `intro-video.mp4` — Intro tap video (mov→mp4 4.8→0.48M, 2.55s h264 crf26 1080p)
- `hero-video.mp4` — Hero loop video (webm→mp4 4.4→0.94M, 5.04s h264 crf26 1080p, verified duration)
- `background-music.mp3` — Background music (2.7→1.1M, 320→128k)
- `intro-poster.jpg` — Intro poster (PNG 2.8M→122K JPEG q4)
- `hero-poster.jpg` — Hero poster (PNG 2.6M→365K JPEG q4)
- `finca-biniagual.webp` — Venue aerial photo (358K)
- `champagne-illustration.png` — Champagne illustration RGBA (88K, left alone)
- `party-illustration.png` — Schedule illustration RGBA (1.8M, left alone)
- `rings-illustration.png` — Rings illustration RGBA (322K, left alone)
- `confetti.gif` — Gifts confetti (499K)

## src/registry/

- `templateTypes.js` — Added FINCA_RUSTIC to layoutFamily
- `index.js` — Added finca import + lazy loadComponent entry (own chunk)

## src/shared/sections/

- `Countdown.jsx` — Live countdown + kicker eyebrow prop (added for floral "Cuenta atrás") (~230 tok)

## src/sites/sweetlove/

- `data.js` — Exports invitationData, siteMeta for Laura & Javier sweetlove route (hero loop + intro envelope, countdown, venue map, 7-step schedule, gifts IBAN, RSVP allergies/companions + confirmation video, footer) (~750 tok)
- `SweetloveInvitation.jsx` — Thin wrapper: local SweetloveHero/Venue/Schedule/Gifts/Rsvp/Divider/Footer + shared Countdown, InvitationShell with ivory palette (~450 tok)
- `styles.css` — Ivory sweetlove-romantic theme, hero loop zoom, countdown cream panel, venue card with map, schedule desktop-grid+mobile-timeline, gifts accordion with confetti, rsvp with companions/allergies + confirmation video fade, footer (~650 tok)

## public/assets/sweetlove/

- `intro-video.mp4` — Intro tap video (mp4 8.7→0.42M, 2.96s h264 crf26 1080p, verified duration)
- `hero-video.mp4` — Hero loop video (mp4 10→1.2M, 10.04s h264 crf26 1080p, verified ambient loop via ffmpeg frames, loop:true overlay:true)
- `hero-poster.jpg` — Hero poster (51K, extracted from hero video q4)
- `intro-poster.jpg` — Intro poster (JPG 1.3M→121K q4)
- `background-music.mp3` — Background music (5.8→2.3M, 320→128k)
- `confetti.gif` — Gifts confetti (499K)
- `rsvp-confirmation.mp4` — RSVP success video (webm→mp4 9.0→1.5M, 5.04s h264 crf26 1080p)
- `watermark-logo.png` — Decorative watermark logo RGBA (358K, optional)

## src/registry/

- `templateTypes.js` — Added SWEETLOVE_ROMANTIC to layoutFamily
- `index.js` — Added sweetlove import + lazy loadComponent entry (own chunk)

## src/sites/dolcevita/

- `data.js` — Exports invitationData, siteMeta for Marco & Sofia Lake Como route (hero loop 7.04s + intro hevc 3.33s, countdown with bg, dual-venue location with maps, 8-step schedule image, dress code fan/parasol, accommodation Grand Hotel Tremezzo, boat transport, gifts Bank/Satispay/WWF, RSVP dinner/transport/accommodation + confirmation video, footer kiss+manor) (~900 tok)
- `DolceVitaInvitation.jsx` — Thin wrapper: local DolceHero/Location/Schedule/DressCode/Accommodation/Transport/Gifts/Rsvp/PetsDivider/Footer + shared Countdown, InvitationShell ivory/navy palette (~550 tok)
- `styles.css` — Ivory lake-romantic theme, hero full-screen loop, countdown bg overlay, location blue-bow ribbons + church/villa maps, schedule image, dress code, accommodation, transport bus/birds, gifts globe/balloons, RSVP ribbon + swans + confirmation video fade, footer kiss+manor overlay, overflow hidden (~650 tok)

## public/assets/dolcevita/

- `hero-video.mp4` — Hero loop video (h264 597K, 7.04s, verified ambient loop via ffmpeg frames distinct hashes, loop:true overlay:true, kept original as compressed was larger)
- `hero-poster.jpg` — Hero poster (192K, extracted from hero video q4)
- `intro-video.mp4` — Intro tap video (hevc→h264 1.4→0.58M, 3.33s crf26 1080p, verified duration)
- `intro-poster.jpg` — Intro poster (JPG 967→127K q4)
- `countdown-bg.jpg` — Countdown background (JPG 864→72K q4)
- `background-music.mp3` — Background music (10→4.1M, 320→128k)
- `rsvp-confirmation.mp4` — RSVP success video (webm→mp4 9.0→1.5M, 5.04s h264 crf26 1080p, verified duration)
- `pets-bouquet.png` — Decorative pets bouquet RGBA (849K, left alone)
- `church-illustration.png` / `villa-illustration.png` — Venue illustrations RGBA (1.8M each, left alone)
- `day-schedule.png` — Schedule image RGBA (176K)
- `dress-code-illustration.png` — Dress code illustration RGBA (443K)
- `accommodation-manor.png` / `footer-manor.png` — Manor illustrations RGBA (1.7M/1.9M, left alone)
- `transport-bus.png` — Bus illustration RGBA (718K)
- `+ 14 decorative RGBA PNGs` — blue-bow ribbons, balloons, wildflower, globe, swans, couple-kiss, cocktail-glass, rings, lemon, saxophone, violin, floaty-ring, fan, parasol, beach-chair, birds-envelope, cherub-logo (all RGBA, left alone)

## src/registry/

- `templateTypes.js` — Added DOLCE_VITA_LAKE to layoutFamily
- `index.js` — Added dolcevita import + lazy loadComponent entry (own chunk)

## src/sites/daynight/

- `data.js` — Exports invitationData, siteMeta for Lucía & Felipe daynight route (hero scrub 3.04s + intro mov 1.70s, day/night toggle, countdown, framed venue, 5-step schedule, dress code, 2 hotels, transport, gifts, framed couple photo, RSVP companions/transport + confirmation video, footer) (~750 tok)
- `DayNightInvitation.jsx` — Thin wrapper: local DayNightHero (raf scrub forward/backward, isDark toggle) + Venue/Schedule/Dress/Hotels/Transport/Gifts/PhotoDivider/Rsvp/Footer + shared Countdown, InvitationShell with ivory/sage palette (~550 tok)
- `styles.css` — Ivory daynight theme, hero day-night scrub video + toggle, monogram countdown dark panel, framed venue with ornate border, schedule venue entrance overlay, dress code, hotel cards + quick tips, transport, gifts accordion with bouquet, photo divider, rsvp with companions, footer cover + credit, overflow hidden (~700 tok)

## public/assets/daynight/

- `hero-video.mp4` — Hero scrub video (h264 4.4→0.40M crf26 716x1284 3.04s, verified one-shot scrub, loop false overlay true)
- `hero-poster.jpg` — Hero poster (PNG 2.6M→365K JPEG q4)
- `intro-video.mp4` — Intro tap video (mov→mp4 651→485K 1.70s h264 crf26 1080p, verified duration)
- `intro-poster.jpg` — Intro poster (JPG 1039→176K q4)
- `background-music.mp3` — Background music (2.7→1.1M, 320→128k 71.5s)
- `rsvp-confirmation.mp4` — RSVP success video (webm→mp4 9.0→1.5M 5.04s h264 crf26 1080p, verified duration)
- `framed-couple-photo.jpg` — Photo divider (PNG 1.6M→98K JPEG q4, rgb24)
- `monogram-ornate.png` — Monogram RGBA (925K, left alone)
- `ornate-frame.png` — Frame rgb24 (584K, left alone)
- `venue-illustration.png` — Venue watercolour RGBA (1.9M, left alone)
- `venue-entrance.png` — Venue entrance RGBA (259K)
- `dog-bouquet.png` — Dog bouquet RGBA (1.9M, left alone)
- `couple-dancing.png` — Dancing RGBA (159K)
- `dress-code-illustration.png` — Dress code RGBA (540K)
- `accommodation-icon.png` — Accommodation RGBA (632K)
- `bus-illustration.png` — Bus RGBA (559K)
- `flower-bouquet.png` — Gifts bouquet RGBA (565K)
- `footer-bg.png` — Footer cover RGBA (2.9M, left alone)
- `rings-illustration.png` — Rings RGBA (322K)

## src/registry/

- `templateTypes.js` — Added DAYNIGHT_DUAL to layoutFamily
- `index.js` — Added daynight import + lazy loadComponent entry (own chunk)

## src/sites/bridgerton/

- `data.js` — Exports invitationData, siteMeta for Lucia & Matteo bridgerton route (hero loop 7.04s + intro envelope 4.0s, countdown with drapes, dress code portrait, 3 hotels, discover Nouvelle-Aquitaine guide, gifts cake + bank accordion, RSVP, footer) (~800 tok)
- `BridgertonInvitation.jsx` — Thin wrapper: local BridgertonHero/Welcome/Countdown/Dress/Hotels/Discover/Gifts/Rsvp/Footer + shared Countdown, InvitationShell ivory/plum regency palette (~600 tok)
- `styles.css` — Ivory regency theme, hero loop scrim, chateau welcome frame, countdown drape, dress portrait, hotel grid, discover categories + fountain/balustrade/pools decor, gifts tassels + cake, RSVP floral frame, footer, overflow hidden (~750 tok)

## public/assets/bridgerton/

- `hero-video.mp4` — Hero loop video (h264 17→1.8M crf26 1080x1916 7.04s, verified ambient loop distinct hashes, loop:true overlay:true)
- `hero-poster.jpg` — Hero poster (337K, original <500K left)
- `intro-video.mp4` — Intro envelope video (hevc→h264 2.2→0.86M 4.0s crf26 1080p, verified duration)
- `intro-poster.jpg` — Intro envelope poster (JPG 943→144K q4)
- `background-music.mp3` — Background music (2.8→1.1M, 320→128k 71.5s)
- `welcome-chateau.png` — Chateau illustration RGBA (326K)
- `venue-frame-bg.jpg` — Venue frame (PNG rgb24 1.8M→88K JPEG q4)
- `floral-frame-bg.jpg` — Floral frame (PNG rgb24 2.1M→142K JPEG q4)
- `countdown-drape-left.png` / `countdown-drape-right.png` — Countdown drapes RGBA (409/414K, left alone)
- `dress-portrait.png` — Dress portrait RGBA (841K)
- `fan.png` — Fan illustration RGBA (86K)
- `gifts-cake.png` — Gifts cake RGBA (265K)
- `tassel-gold.png` / `tassel-pink.png` — Tassels RGBA (133/130K)
- `balustrade-florals.png` / `pools-urn.png` / `column-vase.png` / `fountain-urns.png` — Discover decor RGBA (1.3-1.5M each, left alone)
- `rsvp-chandelier.png` / `rsvp-chandelier-2.png` — Chandeliers RGBA (1.5/1.6M, left alone)

## src/registry/

- `templateTypes.js` — Added BRIDGERTON_REGENCY to layoutFamily
- `index.js` — Added bridgerton import + lazy loadComponent entry (own chunk)

## src/sites/bloom/

- `data.js` — Exports invitationData, siteMeta for Martina & Javier bloom route (hero SVG arch + hero-bg image 941×1672, countdown framed, welcome with flowers, ceremony oval + venue illust, black-tie dress code, 4-step programme, story expandable + butterflies + 19-image marquee, weekend Restaurant César, 2 hotels, transport shuttle/valet, RSVP, footer checkered frame) (~900 tok)
- `BloomInvitation.jsx` — Thin wrapper: local BloomHero/Countdown/Welcome/Ceremony/Dress/Programme/Story/Weekend/Hotels/Transport/Rsvp/Footer + shared Countdown, InvitationShell ivory/sage garden palette (~650 tok)
- `styles.css` — Ivory bloom garden theme, hero arch SVG, countdown oval frame, welcome floral absolute, ceremony oval with venue illust, dress frame + illustration, programme frame, story butterfly pair + gallery marquee, weekend church/flower/hummingbird/starfish/oranges, hotels archway/bellhop/key/pool, transport palms/surf/shell/bus/car, RSVP portrait mask + floral, footer checkered border-image, overflow hidden (~750 tok)

## public/assets/bloom/

- `hero-bg.jpg` — Hero background (PNG rgb24 2.5M→333K JPEG q4)
- `ceremony-oval-bg.jpg` — Ceremony oval (PNG rgb24 2.0M→117K JPEG q4)
- `rsvp-portrait.jpg` — RSVP portrait (PNG rgb24 1.3M→62K JPEG q4)
- `intro-poster.jpg` — Intro poster (JPG 918→93K q4)
- `intro-video.mp4` — Intro merged video (hevc 5.48s 2.5M + h264 7.04s 19M → crf26 932K+3.1M concat 12.54s 4.0M, verified duration)
- `background-music.mp3` — Background music (5.2→2.1M, 320→128k)
- `countdown-frame.png` — Countdown oval frame RGBA (736K, left alone)
- `welcome-flowers.png` / `welcome-flowers-bottom.png` — Welcome florals RGBA (908K/575K)
- `venue-illustration.png` — Hotel watercolour RGBA (2.2M)
- `programme-frame.png` — Programme frame RGBA (1.3M)
- `black-tie-illustration.png` — Dress code RGBA (1.3M)
- `weekend-church-oval.png` / `weekend-oranges-oval.png` — Weekend ovals RGBA (387/377K)
- `weekend-flower.png` / `weekend-hummingbird.png` / `weekend-starfish.png` — Weekend decor RGBA (111/73/53K)
- `accommodation-archway.png` / `accommodation-bellhop.png` / `accommodation-key.png` / `accommodation-pool.png` — Hotel decor RGBA (501/401/159/434K)
- `transport-palms.png` / `transport-surfboard-bag.png` / `transport-shell.png` / `transport-butterfly.png` / `transport-car.png` — Transport decor RGBA (436/199/47/60/392K)
- `floral-top-right.png` / `floral-bottom-left.png` — RSVP florals RGBA (367/409K)
- `checkered-frame.png` — Footer frame RGBA (372K)
- `butterfly-1.png` … `butterfly-7.png` — Butterflies RGBA (46-60K each)
- `gallery-1.jpg` … `gallery-19.jpg` — Gallery photos (<212K each, left alone)

## src/registry/

- `templateTypes.js` — Added BLOOM_GARDEN to layoutFamily
- `index.js` — Added bloom import + lazy loadComponent entry (own chunk)

