# Invitation platform — Phase 1

Standalone Next.js 15 App Router app with React 19, strict TypeScript and plain CSS. No dependency on the Vite lab.

## Run

Use Node.js 22 LTS and npm. From `platform/`:

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000/ar or /en. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin for SEO; the local default is http://localhost:3000. Google fonts are downloaded by Next.js at build time, so the build needs access to Google Fonts.

```sh
npm run check:i18n
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

## Languages and strings

`src/i18n/routing.ts` defines Arabic (default) and English. On unprefixed requests, middleware selects the saved `NEXT_LOCALE` cookie, then Accept-Language, then Arabic. An explicit URL locale wins. The header switcher keeps the pathname, query and fragment and saves the preference for one year. API and asset paths bypass middleware.

All pages live below `src/app/[locale]`. The root locale layout sets language, direction, fonts and the translation provider. Both landing pages are statically generated. Metadata includes canonical and hreflang alternates. Next.js 15 uses `src/middleware.ts`, not `proxy.ts`.

Add the same nested key with a non-empty string to **both** `messages/ar.json` and `messages/en.json`, then read it with `getTranslations` on the server or `useTranslations` in a client component. Run `npm run check:i18n` (also required by the build). All landing copy and accessible labels are in these files.

Use CSS logical properties for spacing, positioning and sizes. Arabic uses Cairo; English uses Cormorant Garamond for headings and Inter for body text. Use `Bidi` for phone numbers, emails and codes. Money uses whole EGP and Western digits; dates use UTC, Western digits, Arabic month names or British English month names.

Pricing reflects plan §4. Legal links point to an explicitly labeled placeholder; this scaffold has no legal policies, template editor or checkout. `/api/health` returns `{ "ok": true }`.

## Engine

`src/engine/InvitationShell.tsx` owns intro → content, reveal-on-scroll, theme variables and music. `registry.tsx` maps section types to components; `section-key.ts` uses `id ?? type-index`. To add a section, add its discriminant and Zod props in `src/lib/schemas/invitation.ts`, infer props with `SectionProps<'type'>`, implement it under `engine/sections/`, and add the narrowing registry wrapper. Schema types are the source of truth, including optional legacy section features.

`InvitationLocaleContext` carries the shell's locale. Render data through `useInvitationText` (which calls `resolveText`); default interface copy lives in the matching `engine` namespaces of `messages/ar.json` and `messages/en.json`. Data copy takes precedence. Phone numbers, emails and bank/promo codes use `Bidi`. Styling lives in `engine/styles/`: logical properties, direction-aware centering, and RTL chevron overrides; never mirror photos, logos or videos. Reference theme CSS is scoped to `.invitation-shell`. The demo uses the platform fonts because only the eight requested media assets are bundled.

The statically generated `/ar/demo/video-open` and `/en/demo/video-open` pages validate `src/data/demo/video-open.ts` with `parseInvitationData`, include localized OG text and are `noindex`. The original local map capture is replaced by a Google embed using the coordinates in that capture. This external map has not been visually verified. Both forms still simulate submissions in component state only; no storage or network submission is implemented. The legacy success wording is retained, but no message/RSVP survives a reload.

Countdown renders a stable dash placeholder until mount. No media plays before a guest opens the invitation; hero playback starts after the intro ends. Video failure or a 5.2-second timeout releases the intro. Scratch uses pointer capture and reveals at 42% cleared; its completion releases the sections below. Pure engine tests are in `engine/__tests__/`. Arabic copy for native review is collected in `ARABIC_ENGINE_REVIEW.md`.
