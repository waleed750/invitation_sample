<!-- openwolf:begin -->
# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.
<!-- openwolf:end -->

# AGENTS.md — Abdelrahman & Nourhan Invitation Template Lab

## Project

Vite + React template lab for wedding/engagement invitations. Each template is a self-contained site under `src/sites/` with its own `data.js`, component, and `styles.css`. A central registry (`src/registry/index.js`) drives the gallery and routing in `src/main.jsx`.

**Templates are data-driven.** To add a template: drop a folder under `src/sites/`, define `siteMeta` + data in `data.js`, compose from shared sections/intros, register in `src/registry/index.js`.

## Commands

```bash
npm install        # install deps
npm run dev        # dev server on 0.0.0.0:5173
npm run build      # production build to dist/
npm run preview    # preview production build
```

No lint, typecheck, test, or formatter configured. No CI workflows.

## Key Files

| Path | Role |
|------|------|
| `src/main.jsx` | Gallery + SPA router (reads from registry) |
| `src/registry/index.js` | Central template array with `React.lazy` per site |
| `src/registry/schema.js` | JSDoc data schema — the contract for template data |
| `src/registry/templateTypes.js` | Enums: eventType, siteType, experienceType, introType, layoutFamily |
| `src/shared/intros/` | Reusable intro components (VideoOpenIntro, ScratchRevealIntro) |
| `src/shared/sections/` | Reusable sections (Hero, Countdown, Welcome, Schedule, Details, Map, MessageForm) |
| `src/sites/video-open-invitation/` | Full invitation: poster → tap → video intro → scrollable sections |
| `src/sites/lace-photo-scratch/` | Save-the-date: lace cover → scratch-to-reveal |
| `public/assets/` | Media (images, videos, audio) |
| `vercel.json` | SPA rewrite rules (all routes → index.html) |

## Conventions

- Each site exports `siteMeta` from `data.js` — gallery reads this for cards, filters, search, links.
- Intro logic goes in `src/shared/intros/`, never one-off in a site component.
- Adding a new intro type or section: add to `src/shared/` + new enum value in `templateTypes.js`.
- The `imports/` directory is gitignored (large scraped demo zips, not part of the app).
- Deployment target: Vercel as a Vite app (`dist/` output).
- Event date hardcoded in invitation data: June 20, 2026.
