# TASKS.md — Invitation Template Lab

> Self-contained task list for the `abdelrahman_norhan_invitation_scraped` repo.
> Execute phases in order. Each phase has tasks (checkboxes) and a "Done when" gate.
> Repo protocol: read `.wolf/STATUS.md` first each session; after each phase update `.wolf/STATUS.md`, append to `.wolf/memory.md`, and log decisions in `.wolf/cerebrum.md` (see `.wolf/OPENWOLF.md`).

## Background (read once)

- The repo started as a scraped static export and was converted into a **Vite + React invitation template lab**. The old static files are deleted in the working tree but not yet committed.
- 2 finished templates exist under `src/sites/`: `video-open-invitation` (poster → tap → intro video + music → scrollable invitation) and `lace-photo-scratch` (lace cover → scratch-to-reveal save-the-date). Each exports `siteMeta` and a data object from its `data.js`.
- `src/main.jsx` hardcodes both templates in a `templates` array and a `routes` map, and renders a searchable gallery at `/`.
- `imports/cloudflare-link/site-zips/` holds 13 scraped thedigitalyes.com demo zips (668MB total; folder is gitignored). `imports/cloudflare-link/demo-manifest.json` and `current-download-status.json` describe them; 10 are complete downloads.
- **End goal:** a client platform where each couple's invitation is generated from a template and content is editable via admin data. Everything below must keep templates **data-driven**: a template = intro preset + ordered sections + theme + assets, all specified in data conforming to one schema.

Commands: `npm install`, `npm run dev` (test at `/`, `/video-open-invitation/`, `/lace-photo-scratch/`), `npm run build`, `npm run preview`.

---

## Phase 0 — Repo cleanup + baseline commit

- [ ] Stage deletions of the old scraped export (`_next/`, `af/`, stray html, the WhatsApp `.mp4`) and the modified `.gitignore`, `.vercelignore`, `README.md`.
- [ ] Add the new app: `src/`, `public/` (8.6MB, fine for git), `index.html`, `package.json`, `package-lock.json`, `vercel.json`, `CLAUDE.md`, `AGENTS.md`, `.wolf/`. Leave `.claude/` and `.codex/` untracked.
- [ ] Verify `imports/` remains untracked (covered by new `.gitignore`).
- [ ] Commit: `convert scraped export to Vite/React template lab`.

**Done when:** `git status` is clean except `.claude/`/`.codex/`, and `npm run dev` still serves the gallery and both templates.

## Phase 1 — Template registry refactor

Goal: adding a template = drop a folder + register one entry; invitation content becomes a documented schema an admin UI can edit later.

- [ ] Create `src/registry/templateTypes.js` — enums for `eventType`, `siteType`, `experienceType`, `introType`, `layoutFamily` (use the values already present in both `data.js` files: `video-open`, `scratch-reveal`, `full-invitation`, `save-the-date`, `cinematic-story`, `interactive-reveal`, `ornate`, `minimal-interactive`, …).
- [ ] Create `src/registry/schema.js` — documented invitation data shape: `template`, `theme`, `couple`, `event`, `media`, `copy`, `sections[]`. Normalize the union of `src/sites/video-open-invitation/data.js` and `src/sites/lace-photo-scratch/data.js`. This is the contract future admin-edited JSON must satisfy.
- [ ] Create `src/registry/index.js` — central `templates` array of `{ meta, loadComponent }` per template using `React.lazy` for code splitting.
- [ ] Extract intro presets to `src/shared/intros/`: `VideoOpenIntro.jsx` (tap-to-open + video + music + fade, from `VideoOpenInvitation.jsx`) and `ScratchRevealIntro.jsx` (scratch canvas + reveal, from `LacePhotoScratch.jsx`).
- [ ] Extract reusable sections to `src/shared/sections/` from `VideoOpenInvitation.jsx`: Hero, Countdown, Welcome, Schedule, Details/Venue, Map, MessageForm — each driven by schema data, no hardcoded content.
- [ ] Rewrite `src/main.jsx` to build routes and the gallery from `src/registry/index.js` (remove hardcoded imports/`routes`), with a `Suspense` fallback.
- [ ] Update both `src/sites/*/data.js` to conform to `schema.js`, and recompose both site components from shared intros/sections (site files keep only layout-family glue + `styles.css`).

**Done when:** both templates render pixel/behavior-identical to before (intro flow, music, scratch, all sections); gallery search/filters still work; `npm run build` emits separate lazy chunks per template.

## Phase 2 — Convert scraped demos

Validate the pipeline on ONE demo first — start with `africa` or `boho` (smallest, ~27–29MB) — then repeat for the other complete zips. Skip the 2 partial and 6 never-downloaded demos.

Per demo:
- [ ] Unzip `imports/cloudflare-link/site-zips/<name>.zip` to a temp dir; inspect the flow (all demos have tap intros per `demo-manifest.json`).
- [ ] Copy only needed media to `public/assets/<product>/`; compress large video/images.
- [ ] Create `src/sites/<product>/` with `data.js` (conforming to `src/registry/schema.js`), a component composed from `src/shared/` intros/sections, and `styles.css`.
- [ ] Register it in `src/registry/index.js` — the gallery card must appear automatically from `siteMeta`.
- [ ] If the demo needs a new intro type or section, add it as a reusable preset in `src/shared/` (and a new enum value in `templateTypes.js`), never as a one-off.

**Done when (first demo):** new template appears in the gallery and its full flow works in dev and `npm run preview`.

### Demo conversion pipeline (learned from africa)

Per demo, execute in this order:

1. **Extract copy from `index.html`** — demo content is SSR-baked into the HTML, not in JS bundles. Regex-extract headings, body text, schedule items, FAQ, etc.
2. **Copy only used assets** to `public/assets/<product>/` with kebab-case names. Ignore `_external/` (scraper resource pages) and `_screenshot.png` (promo screenshots).
3. **Compress media BEFORE committing:**
   - Videos: `/opt/homebrew/bin/ffmpeg -i <in> -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -vf "scale='min(1080,iw)':-2" -movflags +faststart <out>` — keep only if meaningfully smaller; verify duration with `ffprobe`.
   - Audio (> ~160k bitrate): `/opt/homebrew/bin/ffmpeg -i <in> -b:a 128k <out>`.
   - JPEGs > 500KB: `/opt/homebrew/bin/ffmpeg -i <in> -q:v 4 <out>` — keep only if smaller.
   - PNGs with transparency: leave alone (ffmpeg JPEG conversion loses alpha).
4. **Compose from shared primitives:** each site component renders `<InvitationShell>` (from `src/shared/InvitationShell.jsx`) passing `theme`, `media`, `copy`, `sections`, `sectionComponents`, `shellClassName`, `contentClassName`. Local section components (footer, dividers, etc.) stay in the site file and are passed via the `sectionComponents` map.
5. **New section types:** add as reusable presets in `src/shared/sections/` plus a new enum value in `templateTypes.js` — never one-offs in a site file.
6. **Typekit fonts:** can't be bundled; use fallback stacks in `styles.css`.
7. **Register** in `src/registry/index.js` — gallery card appears automatically from `siteMeta`.

## Phase 3 — Deploy to Vercel

- [ ] Deploy with: framework `Vite`, install `npm install`, build `npm run build`, output `dist`. (`vercel.json` SPA rewrite + `cleanUrls` already present.)
- [ ] Verify on the deployed URL: `/` gallery, each template route, video/audio playback on mobile.

**Done when:** live URL serves the gallery and all registered templates.

## Later (do NOT build now — but don't design against it)

- Per-client invitation instances: client JSON (matching `schema.js`) + template id → rendered site.
- Admin UI for editing that JSON; backend/storage decision deferred.
