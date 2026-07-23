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
