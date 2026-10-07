# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-09-30T22:13:01.342Z
> Files: 162 tracked | Anatomy hits: 0 | Misses: 0

## ../../../../tmp/

- `sign-test-jwt.cjs` — Declares secret (~188 tok)

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

## platform/

- `.dockerignore` (~42 tok)
- `.gitignore` — Git ignore rules (~18 tok)
- `package.json` — Node.js package manifest (~200 tok)
- `README.md` — Project documentation (~2152 tok)
- `tsconfig.base.json` (~110 tok)

## platform/apps/api/

- `Dockerfile` (~322 tok)
- `eslint.config.mjs` (~418 tok)
- `jest.config.js` (~266 tok)
- `nest-cli.json` (~62 tok)
- `package.json` — Node.js package manifest (~394 tok)
- `tsconfig.build.json` (~53 tok)
- `tsconfig.json` — TypeScript configuration (~189 tok)

## platform/apps/api/src/

- `app.e2e.spec.ts` — Declares HttpClient (~698 tok)
- `app.module.ts` — Exports AppModule (~465 tok)
- `jest.setup.ts` — Declares originalFetch (~341 tok)
- `main.ts` — Declares bootstrap (~335 tok)
- `scratch-debug.spec.ts` — Declares start (~314 tok)
- `setup-app.ts` — Exports GLOBAL_PREFIX_EXCLUDES, setupApp (~409 tok)
- `test-helpers.ts` — Exports TestTokenOptions, signTestToken, MockSingleResult, StubSupabaseClient + 4 more (~992 tok)

## platform/apps/api/src/auth/

- `auth.e2e.spec.ts` — Declares HttpClient (~992 tok)
- `auth.guard.ts` — Exports AuthGuard (~889 tok)
- `auth.module.ts` — Exports AuthModule (~94 tok)
- `index.ts` (~36 tok)
- `roles.e2e.spec.ts` — Declares INestApplication (~722 tok)
- `roles.guard.ts` — Exports RolesGuard (~727 tok)

## platform/apps/api/src/common/

- `app-logger.ts` — Exports AppLogger (~414 tok)
- `clock.ts` — Exports CLOCK, Clock, SystemClock (~125 tok)
- `decorators.ts` — Exports IS_PUBLIC_KEY, Public, UserRole, ROLES_KEY + 4 more (~446 tok)
- `http-exception.filter.spec.ts` — Declares CapturedResponse (~1096 tok)
- `http-exception.filter.ts` — Exports ErrorEnvelope, HttpExceptionFilter (~938 tok)
- `request-context.ts` — Exports RequestContext, runWithRequestContext, getRequestId (~171 tok)
- `request-id.middleware.ts` — Exports REQUEST_ID_HEADER, RequestWithId, RequestIdMiddleware (~438 tok)
- `type-guards.ts` — Exports isRecord (~66 tok)

## platform/apps/api/src/config/

- `app-config.module.ts` — Exports AppConfigModule (~151 tok)
- `app-config.service.ts` — Exports AppConfigService (~490 tok)
- `env.schema.spec.ts` — Declares validEnv (~779 tok)
- `env.schema.ts` — Exports AppEnv, validateEnv (~720 tok)

## platform/apps/api/src/entitlements/

- `entitlements.controller.spec.ts` — Declares Clock (~590 tok)
- `entitlements.controller.ts` — Exports EntitlementsController (~169 tok)
- `entitlements.module.ts` — Exports EntitlementsModule (~127 tok)
- `entitlements.service.spec.ts` — Declares Clock (~1385 tok)
- `entitlements.service.ts` — Exports InvitationIdParams, CanPublishResult, EntitlementResponse, EntitlementsService (~1494 tok)

## platform/apps/api/src/health/

- `health.controller.ts` — Exports HealthResponse, HealthController (~264 tok)
- `health.module.ts` — Exports HealthModule (~48 tok)

## platform/apps/api/src/me/

- `me.controller.spec.ts` — Declares ROW (~491 tok)
- `me.controller.ts` — Exports MeController (~110 tok)
- `me.module.ts` — Exports MeModule (~78 tok)
- `me.service.ts` — Exports MeResponse, MeService (~874 tok)

## platform/apps/api/src/rate-limit/

- `rate-limit-storage.ts` — Exports RATE_LIMIT_STORAGE, RateLimitStorage, InMemoryRateLimitStorage (~232 tok)
- `rate-limit.module.ts` — Exports RateLimitStorageModule, RateLimitModule (~362 tok)
- `throttle.e2e.spec.ts` — Declares res (~639 tok)

## platform/apps/api/src/supabase/

- `supabase-timeout.spec.ts` — Declares Server (~936 tok)
- `supabase.module.ts` — Exports SupabaseModule (~88 tok)
- `supabase.service.ts` — Exports SupabaseService (~709 tok)

## platform/apps/api/src/testing/

- `env.ts` — Exports TEST_JWT_SECRET, BASE_ENV, setTestEnv (~284 tok)

## platform/apps/web/

- `next.config.ts` — Declares withNextIntl (~79 tok)
- `package.json` — Node.js package manifest (~228 tok)
- `tsconfig.json` — TypeScript configuration (~102 tok)

## platform/apps/web/src/app/[locale]/demo/video-open/

- `page.tsx` — Next.js page component (~452 tok)

## platform/apps/web/src/data/demo/

- `video-open.ts` — Exports videoOpenData, getVideoOpenData (~1639 tok)

## platform/apps/web/src/engine/

- `InvitationLocaleContext.tsx` — Exports InvitationLocaleContext, useInvitationText (~117 tok)
- `InvitationShell.tsx` — Declares CSSProperties (~1341 tok)
- `registry.tsx` — Exports sectionComponents (~742 tok)
- `section-key.ts` — Exports sectionKey (~55 tok)
- `types.ts` — Exports SectionProps (~43 tok)

## platform/apps/web/src/engine/__tests__/

- `engine.test.ts` — Declares now (~646 tok)

## platform/apps/web/src/engine/intros/

- `VideoOpenIntro.tsx` — Declares Props (~546 tok)

## platform/packages/shared/

- `package.json` — Node.js package manifest (~154 tok)
- `tsconfig.json` — TypeScript configuration (~100 tok)
- `tsup.config.ts` (~173 tok)
- `vitest.config.ts` (~37 tok)

## platform/packages/shared/src/__tests__/

- `contracts.test.ts` — Declares InvitationData (~2646 tok)

## platform/supabase/

- `README.md` — Project documentation (~1653 tok)

## platform/supabase/migrations/

- `0001_core.sql` — Declares public (~4551 tok)
- `0002_functions.sql` — Declares pins (~5435 tok)
- `0003_rls.sql` — Declares public (~4599 tok)

## platform/supabase/tests/

- `rls_and_fulfillment.sql` — Declares auth (~3826 tok)

## public/maps/embed/

- `index.html` — onEmbedLoad: onApiLoad (~768 tok)

## src/

- `app.css` — Styles: 57 rules, 2 media queries (~2238 tok)
- `main.jsx` — templates — uses useState, useMemo (~2079 tok)
  - fn `AppRouter` L17-21 (~36 tok)
  - fn `normalizePath` L22-27 (~60 tok)
  - fn `TemplateIndex` L28-151 (~1347 tok)
  - fn `TemplateCard` L152-200 (~435 tok)

## src/registry/

- `index.js` — Central templates array with React.lazy per site (~200 tok)
- `schema.js` — JSDoc invitation data schema + Section type definitions (~900 tok)
- `templateTypes.js` — Frozen enum objects for eventType, siteType, experienceType, introType, layoutFamily (~260 tok)

## src/shared/

- `InvitationShell.jsx` — Shared invitation shell: useRevealOnScroll, audio/music toggle, body bg, theme CSS vars, intro wiring, sections.map render loop (~500 tok)

## src/shared/intros/

- `ScratchRevealIntro.jsx` — Scratch canvas + reveal intro, fully data-driven (~640 tok)
- `VideoOpenIntro.jsx` — Tap-to-open poster + video intro, fully data-driven (~310 tok)

## src/shared/sections/

- `Countdown.jsx` — Live countdown + kicker eyebrow prop (added for floral "Cuenta atrás") (~230 tok)
- `Credit.jsx` — Reusable credit footer with portfolio link (~120 tok)
- `Details.jsx` — Venue details, time, map link (~240 tok)
- `Gallery.jsx` — Responsive image grid for invitation photo galleries (~120 tok)
- `Hero.jsx` — Hero section: names, headline, background video (~170 tok)
- `HotelList.jsx` — Recommended hotel cards with image, price, note, booking status (~180 tok)
- `ImageDivider.jsx` — Centered decorative divider image with optional horizontal rule (~60 tok)
- `index.js` — Barrel export for all sections (~90 tok)
- `Map.jsx` — Embedded Google Maps iframe (~100 tok)
- `MessageForm.jsx` — Guestbook/message form (~260 tok)
- `Schedule.jsx` — Ordered schedule items (~170 tok)
- `Welcome.jsx` — Heading + body paragraph (~90 tok)

## src/sites/africa/

- `AfricaInvitation.jsx` — Thin wrapper: AfricaFooter + sectionComponents map + InvitationShell render (~80 tok)
- `data.js` — Exports invitationData, siteMeta (10 sections, safari-editorial) (~800 tok)
- `styles.css` — Styles: safari-editorial theme, ~600 lines (~2200 tok)

## src/sites/bloom/

- `BloomInvitation.jsx` — Thin wrapper: local BloomHero/Countdown/Welcome/Ceremony/Dress/Programme/Story/Weekend/Hotels/Transport/Rsvp/Footer + shared Countdown, InvitationShell ivory/sage garden palette (~650 tok)
- `data.js` — Exports invitationData, siteMeta for Martina & Javier bloom route (hero SVG arch + hero-bg image 941×1672, countdown framed, welcome with flowers, ceremony oval + venue illust, black-tie dress code, 4-step programme, story expandable + butterflies + 19-image marquee, weekend Restaurant César, 2 hotels, transport shuttle/valet, RSVP, footer checkered frame) (~900 tok)
- `styles.css` — Ivory bloom garden theme, hero arch SVG, countdown oval frame, welcome floral absolute, ceremony oval with venue illust, dress frame + illustration, programme frame, story butterfly pair + gallery marquee, weekend church/flower/hummingbird/starfish/oranges, hotels archway/bellhop/key/pool, transport palms/surf/shell/bus/car, RSVP portrait mask + floral, footer checkered border-image, overflow hidden (~750 tok)

## src/sites/bridgerton/

- `BridgertonInvitation.jsx` — Thin wrapper: local BridgertonHero/Welcome/Countdown/Dress/Hotels/Discover/Gifts/Rsvp/Footer + shared Countdown, InvitationShell ivory/plum regency palette (~600 tok)
- `data.js` — Exports invitationData, siteMeta for Lucia & Matteo bridgerton route (hero loop 7.04s + intro envelope 4.0s, countdown with drapes, dress code portrait, 3 hotels, discover Nouvelle-Aquitaine guide, gifts cake + bank accordion, RSVP, footer) (~800 tok)
- `styles.css` — Ivory regency theme, hero loop scrim, chateau welcome frame, countdown drape, dress portrait, hotel grid, discover categories + fountain/balustrade/pools decor, gifts tassels + cake, RSVP floral frame, footer, overflow hidden (~750 tok)

## src/sites/daynight/

- `data.js` — Exports invitationData, siteMeta for Lucía & Felipe daynight route (hero scrub 3.04s + intro mov 1.70s, day/night toggle, countdown, framed venue, 5-step schedule, dress code, 2 hotels, transport, gifts, framed couple photo, RSVP companions/transport + confirmation video, footer) (~750 tok)
- `DayNightInvitation.jsx` — Thin wrapper: local DayNightHero (raf scrub forward/backward, isDark toggle) + Venue/Schedule/Dress/Hotels/Transport/Gifts/PhotoDivider/Rsvp/Footer + shared Countdown, InvitationShell with ivory/sage palette (~550 tok)
- `styles.css` — Ivory daynight theme, hero day-night scrub video + toggle, monogram countdown dark panel, framed venue with ornate border, schedule venue entrance overlay, dress code, hotel cards + quick tips, transport, gifts accordion with bouquet, photo divider, rsvp with companions, footer cover + credit, overflow hidden (~700 tok)

## src/sites/dolcevita/

- `data.js` — Exports invitationData, siteMeta for Marco & Sofia Lake Como route (hero loop 7.04s + intro hevc 3.33s, countdown with bg, dual-venue location with maps, 8-step schedule image, dress code fan/parasol, accommodation Grand Hotel Tremezzo, boat transport, gifts Bank/Satispay/WWF, RSVP dinner/transport/accommodation + confirmation video, footer kiss+manor) (~900 tok)
- `DolceVitaInvitation.jsx` — Thin wrapper: local DolceHero/Location/Schedule/DressCode/Accommodation/Transport/Gifts/Rsvp/PetsDivider/Footer + shared Countdown, InvitationShell ivory/navy palette (~550 tok)
- `styles.css` — Ivory lake-romantic theme, hero full-screen loop, countdown bg overlay, location blue-bow ribbons + church/villa maps, schedule image, dress code, accommodation, transport bus/birds, gifts globe/balloons, RSVP ribbon + swans + confirmation video fade, footer kiss+manor overlay, overflow hidden (~650 tok)

## src/sites/elegante/

- `data.js` — Exports invitationData, siteMeta for Andrea & Pedro Elegante wedding route (~1000 tok)
- `EleganteInvitation.jsx` — Thin wrapper plus local Location & Transportation section (~220 tok)
- `styles.css` — Gold/tan Elegante theme, gallery, venue, alternating timeline, hotel/gifts/RSVP styling (~2600 tok)

## src/sites/excellence/

- `data.js` — Exports invitationData, siteMeta (10 sections, luxury-floral) (~750 tok)
- `ExcellenceInvitation.jsx` — Thin wrapper: sectionComponents map + InvitationShell render (~70 tok)
- `styles.css` — Styles: luxury-floral theme, ~500 lines (~1800 tok)

## src/sites/finca/

- `data.js` — Exports invitationData, siteMeta for Mar & Jaume finca route (hero loop + intro mov, countdown, venue photo+map, 7-step schedule, 2 hotels, gifts IBAN, RSVP allergies, footer) (~650 tok)
- `FincaInvitation.jsx` — Thin wrapper: local FincaHero/Venue/Schedule/Hotels/Gifts/Rsvp/Divider/Footer + shared Countdown, InvitationShell with sage palette (~450 tok)
- `styles.css` — Sage finca-rustic theme, hero scrim + diamond divider, countdown dark panel, venue card with map, schedule desktop-grid+mobile-timeline, hotel grid, gifts accordion with confetti, rsvp with companions/allergies, footer (~650 tok)

## src/sites/floral/

- `data.js` — Exports invitationData, siteMeta for Carla & Miguel Ángel floral route (hero/video intro, countdown with kicker, venue map, program, gifts accordion, RSVP, footer) (~650 tok)
- `FloralInvitation.jsx` — Thin wrapper: local FloralHero/Venue/Schedule/Gifts/Divider/Footer + shared Countdown(kicker) & Rsvp, side floral border decorations via decor wrapper (~280 tok)
- `styles.css` — Dusty rose floral-romantic theme, side decor absolute images (11 variants), hero video overlay, countdown cards, venue map card, schedule grid, gifts accordion, rsvp, footer (~550 tok)

## src/sites/lace-photo-scratch/

- `data.js` — Exports laceScratchData, siteMeta (~342 tok)
- `LacePhotoScratch.jsx` — LacePhotoScratch — renders chart — uses useRef, useState, useEffect (~1632 tok)
  - fn `LacePhotoScratch` L6-85 (~671 tok)
  - fn `ScratchCanvas` L86-145 (~496 tok)
  - fn `paintCover` L146-178 (~326 tok)
  - fn `calculateCleared` L179-189 (~88 tok)
- `styles.css` — Styles: 32 rules, 1 media queries, 1 animations (~1525 tok)

## src/sites/sweetlove/

- `data.js` — Exports invitationData, siteMeta for Laura & Javier sweetlove route (hero loop + intro envelope, countdown, venue map, 7-step schedule, gifts IBAN, RSVP allergies/companions + confirmation video, footer) (~750 tok)
- `styles.css` — Ivory sweetlove-romantic theme, hero loop zoom, countdown cream panel, venue card with map, schedule desktop-grid+mobile-timeline, gifts accordion with confetti, rsvp with companions/allergies + confirmation video fade, footer (~650 tok)
- `SweetloveInvitation.jsx` — Thin wrapper: local SweetloveHero/Venue/Schedule/Gifts/Rsvp/Divider/Footer + shared Countdown, InvitationShell with ivory palette (~450 tok)

## src/sites/video-open-invitation/

- `data.js` — Exports invitationData, siteMeta (~727 tok)
- `styles.css` — Styles: 82 rules, 1 media queries, 1 animations (~3087 tok)
- `VideoOpenInvitation.jsx` — Thin wrapper: local section components + InvitationShell render (~100 tok)
  - fn `useCountdown` L6-17 (~102 tok)
  - fn `getTimeLeft` L18-28 (~89 tok)
  - fn `useRevealOnScroll` L29-50 (~182 tok)
  - fn `VideoOpenInvitation` L51-139 (~626 tok)
  - fn `PosterVideoIntro` L140-186 (~325 tok)
  - fn `HeroVideoSection` L187-204 (~170 tok)
  - fn `CountdownSection` L205-223 (~189 tok)
  - fn `TimeBox` L224-234 (~66 tok)
  - fn `ImageDivider` L235-242 (~50 tok)
  - fn `WelcomeSection` L243-255 (~94 tok)
  - fn `ScheduleSection` L256-277 (~212 tok)
  - fn `VenueDetailsSection` L278-305 (~272 tok)
  - fn `MapSection` L306-321 (~110 tok)
  - fn `MessageSection` L322-355 (~338 tok)
  - fn `FooterSection` L356-363 (~53 tok)
