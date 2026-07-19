# STATUS — abdelrahman-nourhan-invitation

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Update this file at the end of every work phase so the next `/clear` resumes in 1 read.
> Last updated: 2026-07-19

---

## ✅ Done

### Phase 0 — Repo cleanup (not yet committed)
- Old scraped export deleted, new app scaffolded (Vite + React)

### Phase 1 — Template registry refactor (committed 2519b72)
- `src/registry/templateTypes.js` — frozen enums for eventType, siteType, experienceType, introType, layoutFamily
- `src/registry/schema.js` — full JSDoc contract with sections[] descriptors
- `src/registry/index.js` — central registry: sync meta + lazy loadComponent per template
- `src/shared/intros/VideoOpenIntro.jsx` — tap-to-open poster+video, fully prop-driven
- `src/shared/intros/ScratchRevealIntro.jsx` — scratch canvas+reveal, fully prop-driven
- `src/shared/sections/` — Hero, Countdown, Welcome, Schedule, Details, Map, MessageForm
- `src/main.jsx` — routes/gallery built from registry, React.lazy + Suspense
- Both data.js files — conform to schema.js, include sections[]
- Both site components — recomposed from shared intros/sections, inline code deleted
- Build emits separate lazy chunks per template ✓

---

## 🚀 Next phase

**Goal:** Phase 2 — convert one scraped demo (africa or boho) to validate the pipeline.

### Acceptance criteria
1. New template appears in gallery and full flow works in dev + preview
2. Only needed media copied to public/assets/<product>/
3. data.js conforms to schema.js, component composed from shared intros/sections

### Files to create / edit
| Type | File | Content |
|---|---|---|
| new | `src/sites/<product>/data.js` | Conform to schema.js |
| new | `src/sites/<product>/Component.jsx` | Compose from shared intros/sections |
| new | `src/sites/<product>/styles.css` | Template-specific styles |
| edit | `src/registry/index.js` | Register new template |
| copy | `public/assets/<product>/` | Media assets (compressed) |

### Closed decisions
- Enums as frozen objects of string constants in templateTypes.js
- Schema uses JSDoc @typedef with sections[] as ordered section descriptors
- Shared intros/sections fully data-driven via props, no hardcoded content
- Registry: sync meta (for gallery) + lazy loadComponent (for routes)

### Open decisions
- Which demo to convert first: africa or boho (~27-29MB)

---

## 📁 Active architecture

- **Stack:** Vite + React, lucide-react icons, CSS custom properties per template
- **Key modules:** `src/registry/` (types + schema + registry), `src/shared/` (intros + sections), `src/sites/` (per-template glue + data + CSS)
- **Patterns:** Data-driven sections[] array; React.lazy per template; shared components with no hardcoded content; existing CSS class names preserved

---

## ⚠️ External blockers (don't block coding)

- Phase 0 not yet committed (old scraped export deletions staged but uncommitted)

---

## 🔧 Useful commands

```bash
npm run dev      # dev server at /, /video-open-invitation/, /lace-photo-scratch/
npm run build    # production build — verify separate lazy chunks
npm run preview  # preview built output
```

---

## 📚 References (read IF needed)

- `.wolf/cerebrum.md` — User Preferences + Do-Not-Repeat + Decision Log
- `.wolf/anatomy.md` — token-efficient file index
- `.wolf/buglog.json` — known bugs + fixes
