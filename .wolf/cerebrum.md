# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-07-18

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** abdelrahman-nourhan-invitation
- **Description:** Editable React/Vite invitation template lab for Abdelrahman and Nourhan.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- [2026-07-19] Decision: implementation delegated to opencode CLI (`opencode run --auto`), Claude reviews each phase against TASKS.md gates. Agent def: .claude/agents/opencode-delegate.md.
- [2026-07-19] Learning: scraped thedigitalyes demos = minified React SPAs but all copy is SSR-baked into index.html (extract via HTML, not JS); hashed asset filenames; Typekit fonts can't be bundled → fallback stacks; ignore _external/ and _screenshot.png.
- [2026-07-19] Do-not-repeat: section render keys must be `section.id ?? type-index` (plain type collides on repeated sections); intro CSS must live with the intro component, not in a site's lazy CSS chunk.
