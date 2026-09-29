# Invitation platform — Phase 1

npm-workspaces monorepo. `apps/web` is the standalone Next.js 15 App Router website (React 19, strict TypeScript, plain CSS — no dependency on the Vite lab). `apps/api` is the NestJS 11 REST API (`/v1`, Supabase Auth guard, entitlements slice, OpenAPI). `packages/shared` is framework-free TypeScript (Zod contracts + pure functions) used by web and api. `supabase/` holds SQL migrations + tests.

## Layout

```
platform/
  package.json            root workspace (private, workspaces: apps/* + packages/*, delegating scripts)
  tsconfig.base.json      shared strict compiler options
  apps/web/               the Next.js website (@platform/web)
  apps/api/               the NestJS API (@platform/api, REST under /v1, Dockerfile included)
  packages/shared/        framework-free Zod contracts + pure functions (@platform/shared, tsup-built CJS for the api)
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

`npm test` / `npm run typecheck` run in every workspace; `lint` runs in web + api; the rest delegate to `@platform/web`. To target one workspace directly: `npm run <script> --workspace @platform/web` (or `@platform/api` / `@platform/shared` for `test` / `typecheck`).

## Languages and strings

`apps/web/src/i18n/routing.ts` defines Arabic (default) and English. On unprefixed requests, middleware selects the saved `NEXT_LOCALE` cookie, then Accept-Language, then Arabic. An explicit URL locale wins. The header switcher keeps the pathname, query and fragment and saves the preference for one year. API and asset paths bypass middleware.

All pages live below `apps/web/src/app/[locale]`. The root locale layout sets language, direction, fonts and the translation provider. Both landing pages are statically generated. Metadata includes canonical and hreflang alternates. Next.js 15 uses `apps/web/src/middleware.ts`, not `proxy.ts`.

Add the same nested key with a non-empty string to **both** `apps/web/messages/ar.json` and `apps/web/messages/en.json`, then read it with `getTranslations` on the server or `useTranslations` in a client component. Run `npm run check:i18n` (also required by the build). All landing copy and accessible labels are in these files.

Use CSS logical properties for spacing, positioning and sizes. Arabic uses Cairo; English uses Cormorant Garamond for headings and Inter for body text. Use `Bidi` for phone numbers, emails and codes. Money uses whole EGP and Western digits; dates use UTC, Western digits, Arabic month names or British English month names.

Pricing reflects plan §4. Legal links point to an explicitly labeled placeholder; this scaffold has no legal policies, template editor or checkout. `/api/health` returns `{ "ok": true }`.

## API (`apps/api`)

NestJS 11 (CommonJS, strict TS, Express), all REST under the `/v1` prefix. Skeleton with one real vertical slice — no payments, OTP, queues or admin endpoints yet.

```sh
cp apps/api/.env.example apps/api/.env   # placeholders only — fill in real values, never commit
npm run dev:api                            # watch mode on :3001 (PORT in .env)
npm run build:api                          # builds @platform/shared first, then the api to apps/api/dist
node apps/api/dist/main.js                 # run the build (NODE_ENV=production in Docker)
```

Docker (build context must be `platform/`): `docker build -f apps/api/Dockerfile -t platform-api .` — multi-stage, non-root user, `CMD ["node","apps/api/dist/main.js"]`.

| Env var | Purpose |
|---|---|
| `PORT` | listen port (default 3001) |
| `NODE_ENV` | `development` \| `production` \| `test` (stack traces hidden in production) |
| `WEB_ORIGINS` | comma-separated browser origins for strict CORS (no wildcards) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | project URL + anon key (user-scoped client, RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server only — never returned or logged |
| `SUPABASE_JWT_SECRET` | optional; when set, JWTs verify locally (HS256), else via the project's JWKS |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | global limit per IP (in-memory store; a `RateLimitStorage` seam exists for a future Redis backend — Redis is not added) |
| `SWAGGER_ENABLED` | `true` serves OpenAPI at unprefixed `/docs` (+ `/docs-json`); otherwise 404 |

The process refuses to boot when a variable is missing or invalid (`validateEnv` prints every offender).

Routes: `GET /v1/health` (public, unthrottled liveness: `{ ok, version, uptimeSeconds }`), `GET /v1/me` (caller's `profiles` row), `GET /v1/invitations/:id/entitlement` (`:id` is a Zod-validated UUID; RLS decides access, 404 when invisible; meters computed with `remainingEdits`/`daysOnlineLeft`/`canPublish` from `@platform/shared`). Everything is auth-guarded unless `@Public()`; `@Roles('admin')` reads `profiles.role` through the caller's own client (cached per request). Failures all return `{ error: { code, message, requestId } }`; `x-request-id` is echoed and logged (tokens, keys, bodies never are).

## CJS/ESM note (`packages/shared`)

The web app (ESM, Next.js) consumes `@platform/shared` as TypeScript source (`import`/`types` conditions + `transpilePackages`), while the api (CommonJS Nest build) cannot. So `packages/shared` ships both: `npm run build --workspace @platform/shared` (tsup) emits `dist/index.cjs` + `dist/index.js` + `dist/index.d.ts`, and the `exports` map points `require` at the CJS build while `import`/`types` keep pointing at `src/index.ts`. Tests in both workspaces consume the source directly (api jest maps `@platform/shared` to the source), so no build is needed before `npm test` — but `npm run build:api` always builds shared first. `dist/` is gitignored.

## Engine

`apps/web/src/engine/InvitationShell.tsx` owns intro → content, reveal-on-scroll, theme variables and music. `registry.tsx` maps section types to components; `section-key.ts` uses `id ?? type-index`. To add a section, add its discriminant and Zod props in `packages/shared/src/invitation.ts`, infer props with `SectionProps<'type'>`, implement it under `engine/sections/`, and add the narrowing registry wrapper. Schema types are the source of truth, including optional legacy section features.

`InvitationLocaleContext` carries the shell's locale. Render data through `useInvitationText` (which calls `resolveText`); default interface copy lives in the matching `engine` namespaces of `apps/web/messages/ar.json` and `apps/web/messages/en.json`. Data copy takes precedence. Phone numbers, emails and bank/promo codes use `Bidi`. Styling lives in `engine/styles/`: logical properties, direction-aware centering, and RTL chevron overrides; never mirror photos, logos or videos. Reference theme CSS is scoped to `.invitation-shell`. The demo uses the platform fonts because only the eight requested media assets are bundled.

The statically generated `/ar/demo/video-open` and `/en/demo/video-open` pages validate `apps/web/src/data/demo/video-open.ts` with `parseInvitationData`, include localized OG text and are `noindex`. The original local map capture is replaced by a Google embed using the coordinates in that capture. This external map has not been visually verified. Both forms still simulate submissions in component state only; no storage or network submission is implemented. The legacy success wording is retained, but no message/RSVP survives a reload.

Countdown renders a stable dash placeholder until mount. No media plays before a guest opens the invitation; hero playback starts after the intro ends. Video failure or a 5.2-second timeout releases the intro. Scratch uses pointer capture and reveals at 42% cleared; its completion releases the sections below. Pure engine tests are in `apps/web/src/engine/__tests__/`, contract tests in `packages/shared/src/__tests__/`. Arabic copy for native review is collected in `docs/ARABIC_ENGINE_REVIEW.md`.
