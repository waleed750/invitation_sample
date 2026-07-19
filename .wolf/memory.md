# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

| 2026-07-19 | Phase 1 Part 1 — created registry + shared modules | src/registry/*, src/shared/* | build passes, no existing files touched | ~8k |
| 2026-07-19 | Phase 1 Part 2 — wired registry, recomposed both templates | src/main.jsx, both data.js, both site .jsx, registry/index.js | build passes, separate lazy chunks, committed 2519b72 | ~10k |
| 2026-07-19 | Phase 2 done via opencode: review fixes (13965e2) + africa demo converted (03a66b7); .wolf STATUS updated by Claude | .wolf/STATUS.md, src/sites/africa/* | ok | ~1k |
| 2026-07-19 | Extracted shared InvitationShell, recomposed both sites, compressed africa media 26.6→13.2MB, added pipeline docs | src/shared/InvitationShell.jsx, both site .jsx, public/assets/africa/*, TASKS.md | build passes, 50% media reduction | ~8k |
