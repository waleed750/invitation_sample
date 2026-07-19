# STATUS — abdelrahman-nourhan-invitation

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Update this file at the end of every work phase so the next `/clear` resumes in 1 read.
> Last updated: 2026-07-18

---

## ✅ Done

<!-- Move items here from "🚀 Next phase" when finished. Group by area. -->

- (nothing yet — fill in as work completes)

---

## 🚀 Next phase

**Goal:** Phase 1 Part 2 — wire registry into main.jsx, recompose both site components from shared intros/sections.

### Acceptance criteria
1. Gallery + template routes still work from registry (no hardcoded imports in main.jsx)
2. Both templates render pixel/behavior-identical to before
3. npm run build emits separate lazy chunks per template

### Files to create / edit
| Type | File | Content |
|---|---|---|
| edit | `src/main.jsx` | Build routes/gallery from `src/registry/index.js` with Suspense |
| edit | `src/sites/video-open-invitation/data.js` | Conform to schema.js |
| edit | `src/sites/video-open-invitation/VideoOpenInvitation.jsx` | Recompose from shared intros/sections |
| edit | `src/sites/lace-photo-scratch/data.js` | Conform to schema.js |
| edit | `src/sites/lace-photo-scratch/LacePhotoScratch.jsx` | Recompose from shared intros/sections |

### Closed decisions
- Enums as frozen objects of string constants in templateTypes.js
- Schema uses JSDoc @typedef with sections[] as ordered section descriptors
- Shared intros fully data-driven via props, no hardcoded content

### Open decisions
- (none)

---

## 📁 Active architecture

- **Stack:** _<frameworks, libraries, runtime>_
- **Key tables / modules:** _<list>_
- **Patterns:** _<conventions enforced project-wide>_

---

## ⚠️ External blockers (don't block coding)

- _<env vars, secrets, external accounts, manual steps>_

---

## 🔧 Useful commands

```bash
# add the most-used commands here so the next session has them ready
```

---

## 📚 References (read IF needed)

- `.wolf/cerebrum.md` — User Preferences + Do-Not-Repeat + Decision Log
- `.wolf/anatomy.md` — token-efficient file index
- `.wolf/buglog.json` — known bugs + fixes
