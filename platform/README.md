# Invitation platform — Phase 1

npm-workspaces monorepo. `apps/web` is the standalone Next.js 15 App Router website (React 19, strict TypeScript, plain CSS — no dependency on the Vite lab). `packages/shared` is framework-free TypeScript (Zod contracts) used by web and the future NestJS API. `supabase/` holds SQL migrations + tests. The NestJS app (`apps/api`) does not exist yet.

## Layout

```
platform/
  package.json            root workspace (private, workspaces: apps/* + packages/*, delegating scripts)
  tsconfig.base.json      shared strict compiler options
  apps/web/               the Next.js website (@platform/web)
  packages/shared/        framework-free Zod contracts (@platform/shared, source-only, no build step)
  supabase/               SQL migrations + tests (unchanged)
  docs/                   notes (ARABIC_ENGINE_REVIEW.md)
```

## Run

Use Node.js 22 LTS and npm. From `platform/` (one lockfile for the whole workspace):

```sh
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```

Open http://localhost:3000/ar or /en. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin for SEO; the local default is http://localhost:3000. Google fonts are downloaded by Next.js at build time, so the build needs access to Google Fonts.

```sh
npm run check:i18n
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` / `npm run typecheck` run in every workspace; the rest delegate to `@platform/web`. To target one workspace directly: `npm run <script> --workspace @platform/web` (or `@platform/shared` for `test` / `typecheck`).

## Languages and strings

`apps/web/src/i18n/routing.ts` defines Arabic (default) and English. On unprefixed requests, middleware selects the saved `NEXT_LOCALE` cookie, then Accept-Language, then Arabic. An explicit URL locale wins. The header switcher keeps the pathname, query and fragment and saves the preference for one year. API and asset paths bypass middleware.

All pages live below `apps/web/src/app/[locale]`. The root locale layout sets language, direction, fonts and the translation provider. Both landing pages are statically generated. Metadata includes canonical and hreflang alternates. Next.js 15 uses `apps/web/src/middleware.ts`, not `proxy.ts`.

Add the same nested key with a non-empty string to **both** `apps/web/messages/ar.json` and `apps/web/messages/en.json`, then read it with `getTranslations` on the server or `useTranslations` in a client component. Run `npm run check:i18n` (also required by the build). All landing copy and accessible labels are in these files.

Use CSS logical properties for spacing, positioning and sizes. Arabic uses Cairo; English uses Cormorant Garamond for headings and Inter for body text. Use `Bidi` for phone numbers, emails and codes. Money uses whole EGP and Western digits; dates use UTC, Western digits, Arabic month names or British English month names.

Pricing reflects plan §4. Legal links point to an explicitly labeled placeholder; this scaffold has no legal policies, template editor or checkout. `/api/health` returns `{ "ok": true }`.

## Engine

`apps/web/src/engine/InvitationShell.tsx` owns intro → content, reveal-on-scroll, theme variables and music. `registry.tsx` maps section types to components; `section-key.ts` uses `id ?? type-index`. To add a section, add its discriminant and Zod props in `packages/shared/src/invitation.ts`, infer props with `SectionProps<'type'>`, implement it under `engine/sections/`, and add the narrowing registry wrapper. Schema types are the source of truth, including optional legacy section features.

`InvitationLocaleContext` carries the shell's locale. Render data through `useInvitationText` (which calls `resolveText`); default interface copy lives in the matching `engine` namespaces of `apps/web/messages/ar.json` and `apps/web/messages/en.json`. Data copy takes precedence. Phone numbers, emails and bank/promo codes use `Bidi`. Styling lives in `engine/styles/`: logical properties, direction-aware centering, and RTL chevron overrides; never mirror photos, logos or videos. Reference theme CSS is scoped to `.invitation-shell`. The demo uses the platform fonts because only the eight requested media assets are bundled.

The statically generated `/ar/demo/video-open` and `/en/demo/video-open` pages validate `apps/web/src/data/demo/video-open.ts` with `parseInvitationData`, include localized OG text and are `noindex`. The original local map capture is replaced by a Google embed using the coordinates in that capture. This external map has not been visually verified. Both forms still simulate submissions in component state only; no storage or network submission is implemented. The legacy success wording is retained, but no message/RSVP survives a reload.

Countdown renders a stable dash placeholder until mount. No media plays before a guest opens the invitation; hero playback starts after the intro ends. Video failure or a 5.2-second timeout releases the intro. Scratch uses pointer capture and reveals at 42% cleared; its completion releases the sections below. Pure engine tests are in `apps/web/src/engine/__tests__/`, contract tests in `packages/shared/src/__tests__/`. Arabic copy for native review is collected in `docs/ARABIC_ENGINE_REVIEW.md`.
