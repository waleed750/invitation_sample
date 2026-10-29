# Template Guide: Creating Original Invitation Templates

> A new template should take hours, not days.
> This guide is the single source of truth for creating sellable, high-fidelity invitation templates on the platform.

---

## 1. Quick Start: Scaffolding a New Template

To create a new template skeleton with complete Arabic and English sample data, styles, unit test, and registry wiring:

```bash
# From platform/ or apps/web/
npm run template:new -- <slug>
```

Example:
```bash
npm run template:new -- nile-night
```

This generates:
- `apps/web/src/templates/<slug>/data.ts` — Validated sample data covering all core sections with natural Arabic and English copy.
- `apps/web/src/templates/<slug>/styles.css` — Scoped template stylesheet with logical CSS properties and reduced motion support.
- `apps/web/src/templates/<slug>/index.ts` — Template exports.
- `apps/web/src/templates/<slug>/<slug>.test.ts` — Vitest unit test asserting schema validity, bilingual completeness, CSS scoping, and asset hygiene.
- Wires the template into `apps/web/src/templates/registry.ts` with status `draft`.
- Wires the stylesheet into `apps/web/src/templates/template-styles.ts`.

---

## 2. Anatomy of a Template

A template is a self-contained module under `apps/web/src/templates/<slug>/`:

```
apps/web/src/templates/<slug>/
├── data.ts          # Sample data conforming to InvitationData schema
├── styles.css       # Scoped CSS rules (.invitation-shell[data-template="<slug>"])
├── index.ts         # Module entrypoint exporting data, metadata, and fonts
└── <slug>.test.ts   # Vitest unit test suite
```

### 2.1 `data.ts`
Exports:
1. `<slugCamel>Data: InvitationData`: The raw object containing theme, metadata, couple details, event info, media, copy, and sections.
2. `get<SlugPascal>Data(): InvitationData`: Function that validates the data through `parseInvitationData()` from `@platform/shared` and returns the parsed result.

```ts
import {parseInvitationData, type InvitationData} from '@platform/shared';

export const nileNightData: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'interactive-reveal',
    introType: 'tap-to-open',
    layoutFamily: 'classic',
  },
  theme: {
    background: '#0B132B',
    foreground: '#F0E6D2',
    muted: '#9AA5B8',
    ivory: '#FAF7F2',
  },
  couple: {
    firstName: {ar: 'طارق', en: 'Tarek'},
    secondName: {ar: 'فريدة', en: 'Farida'},
    headline: {
      ar: 'نتشرف بدعوتكم لمشاركتنا فرحة العمر',
      en: 'Together with our families, we request the pleasure of your company',
    },
  },
  // ... event, media, copy, schedule, sections
};

export function getNileNightData(): InvitationData {
  const result = parseInvitationData(nileNightData);
  if (!result.ok) {
    throw new Error(`Invalid nile-night template: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}
```

### 2.2 `styles.css`
Contains scoped styles applied to the template when rendered inside `InvitationShell`.
- Must be strictly scoped under `.invitation-shell[data-template="<slug>"]`.
- Directional styles use `[dir="rtl"]` and `[dir="ltr"]`.
- CSS logical properties only (`margin-inline`, `padding-inline`, `inset-inline-start`, `text-align: start`, etc.).
- Never use non-logical physical directions (`left`, `right`, `margin-left`).

```css
.invitation-shell[data-template="nile-night"] {
  --color-primary: #0B132B;
  --color-gold: #C19A51;
  --color-sand: #E3D8C6;
  --font-display: var(--font-amiri), serif;
  --font-body: var(--font-ibm-plex-sans-arabic), sans-serif;
  
  background-color: var(--color-primary);
  color: var(--color-sand);
}

.invitation-shell[data-template="nile-night"][dir="ltr"] {
  --font-display: var(--font-cormorant-garamond), serif;
  --font-body: var(--font-inter), sans-serif;
}

@media (prefers-reduced-motion: reduce) {
  .invitation-shell[data-template="nile-night"] * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.3 `registry.ts` Entry
Every template is declared in `apps/web/src/templates/registry.ts`:

```ts
const nileNightEntry: CatalogEntry = catalogEntry.parse({
  slug: 'nile-night',
  name: {ar: 'ليالي النيل', en: 'Nile Night'},
  tagline: {
    ar: 'أمسية نيلية ساحرة مع انعكاسات الذهب وضوء الفوانيس',
    en: 'A magical Nile evening with golden reflections and warm lantern glow',
  },
  tier: 'classic',
  status: 'draft', // 'draft' until owner approves for 'live'
  featured: false,
  assets: [
    {path: '/assets/demo/nile-night/lantern.svg', source: 'original', license: 'original, © Invitely'},
  ],
});
```

And registered in the `templates` dictionary:
```ts
export const templates: Record<string, TemplateDefinition> = {
  // ...
  'nile-night': {
    entry: nileNightEntry,
    getData: getNileNightData,
    fontClassName: '',
  },
};
```

---

## 3. Section Types and Their Props

The section schema is defined in `packages/shared/src/invitation.ts`. Each section has a `type: string`, optional `id: string`, and a typed `props` object.

### Core Sections (Mandatory in every new sellable template)

| Section Type | Required Props | Key Optional Props | Description |
|---|---|---|---|
| `hero` | `firstName`, `secondName`, `displayDate` | `headline`, `heroVideoUrl`, `heroPosterUrl`, `scrollCueLabel`, `overlayFadeOutAt` | Top invitation card with couple names, date, and scroll cue. |
| `countdown` | `date` (ISO-8601 with offset) | `title`, `untilLabel`, `kicker`, `labels` (`days`, `hours`, `minutes`, `seconds`), `showSeconds` | Live ticking countdown to the wedding date. |
| `welcome` | `title`, `body` | `kicker`, `cards`, `bgUrl` | Heartfelt welcome message to guests. |
| `schedule` | `title`, `subtitle`, `items` (`title`, `time`) | `stops` (`time`, `text`), `coupleDancingUrl`, `alternate` | Order of events (Zaffa, dinner, dancing). |
| `details` | `title`, `subtitle`, `venue`, `startTime`, `endTime`, `mapUrl` | `dateLine`, `addressLines`, `mapLabel`, `locationLabel`, `ornateBadgeUrl`, `imageUrl` | Venue location, timings, and map link. |
| `dressCode` | `title`, `body` | `illustrationUrl`, `cards`, `groups` | Attire guidance (Black Tie, Formal, Cocktail). |
| `gallery` | (none) | `title`, `images` (string URLs or `{src, alt}`) | Photo showcase of the couple. |
| `rsvp` | `title`, `subtitle` | `attendingLabel`, `attendanceOptions` (`yes`, `no`), `guestCountMode` (`'stepper' \| 'select'`), `nameFieldLabel`, `submitLabel`, `successMessage` | RSVP form with guest attendance and headcount. |
| `messageForm` | `title`, `subtitle` | `nameFieldLabel`, `messageLabel`, `messagePlaceholder`, `submitLabel`, `successMessage` | Guestbook / warm wishes form. |
| `footer` | `ornamentUrl` | (none) | Decorative closing ornament / monogram. |

### Additional Section Types Available in the Schema

- `story`: Multi-chapter romance story (`chapters`: `[{ quote, prose, photos }]`).
- `map`: Embedded interactive map iframe (`src: httpsUrl`).
- `imageDivider`: Decorative visual break between sections (`imageUrl`, `alt`, `line: boolean`).
- `faq`: Collapsible questions and answers (`items`: `[{ question, answer }]`).
- `gifts`: Gift registry and bank account details (`buttonLabel`, `buttonUrl`, `bankAccounts`).
- `hotelList`: Recommended accommodations for traveling guests (`hotels`: `[{ name, imageUrl, pricePerNight, websiteUrl }]`).
- `weddingWeekend`: Multi-day celebration schedule (`eyebrow`, `title`, `body`, `events`).
- `travelInfo`: Airport and transport recommendations (`airports: [{ code, name, location }]`).
- `credit`: Footer showing the invitation maker credits and portfolio link.
- `scratchReveal`: Interactive scratch-off save-the-date card.
- `bohoFooter`: Special footer frame with monogram and starfish motif.

---

## 4. Theme Tokens & Styling Architecture

### 4.1 Base Tokens
`InvitationData.theme` defines 4 semantic color tokens:
```ts
theme: {
  background: '#0B132B', // CSS --background: main canvas color
  foreground: '#F0E6D2', // CSS --foreground: default text color
  muted:      '#9AA5B8', // CSS --muted: secondary labels, borders, subtle text
  ivory:      '#FAF7F2', // CSS --ivory: light card background or contrast accent
}
```
`InvitationShell` injects these as CSS custom properties on `<main className="invitation-shell">`:
- `var(--background)`
- `var(--foreground)`
- `var(--muted)`
- `var(--ivory)`

### 4.2 Intro Types
The `template.introType` field determines the initial guest interaction:
1. `'tap-to-open'`: Clean button prompt ("اضغط للفتح" / "Tap to Open") that triggers background music and fades in the invitation.
2. `'envelope'`: Animated wax seal and envelope opening sequence.
3. `'shutters'`: Traditional mashrabiya wooden shutters that swing open upon tap.
4. `'scratch-reveal'`: Canvas-based scratch-to-reveal interaction (used in Save the Dates).
5. `'video-open'`: Full-screen cinematic video intro clip.
6. `'none'`: Instant direct scroll without an opening gate.

---

## 5. How Personalisation Works (Pick-Preview Injection)

When customers customize a template on `/app/new` or view `/pick-preview/<slug>?first=...&second=...&date=...`:
`apps/web/src/pick/personalize.ts` (`personalizeData`) dynamically injects their names and date into the template's sample data before rendering:

1. **Couple Names:**
   - Injected into `couple.firstName` and `couple.secondName`.
   - Injected into `hero` props `firstName` and `secondName`.
   - Injected into `scratchReveal` props `firstName` and `secondName`.
   - Injected into `credit.coupleNames` and `bohoFooter.names`.

2. **Event Date:**
   - Injected into `event.date` (ISO-8601 string) and `event.displayDate` (formatted date string).
   - Injected into `hero.displayDate`.
   - Injected into `countdown.date`.
   - Injected into `details.dateLine`.

**Rule for template authors:** Always populate `hero.firstName`, `hero.secondName`, `hero.displayDate`, `countdown.date`, and `details.dateLine` with standard format strings so personalized preview injection works seamlessly.

---

## 6. Asset & Licensing Rules

### 6.1 Original Art Only
- **Strictly forbidden:** Copying SVGs, PNGs, MP3s, or MP4s from third-party template demo sites (such as `thedigitalyes` or scraped dumps).
- **Allowed sources:**
  1. Hand-crafted CSS/SVG art drawn from scratch.
  2. Owner-generated AI media (OpenAI, Midjourney, Figma AI) created with written prompts and commercial license terms.
  3. Commercially licensed photography from Unsplash, Pexels, or paid stock libraries with proof of license.
  4. Self-hosted OFL fonts in `apps/web/src/fonts/`.

### 6.2 Recording in `ASSET_LICENSES.md`
Every non-code asset added under `apps/web/public/assets/demo/<slug>/` MUST have a corresponding entry in `apps/web/ASSET_LICENSES.md`:

```markdown
| `/assets/demo/nile-night/lantern.svg` | original | original SVG illustration, © Invitely |
```

---

## 7. Mobile-First & Responsive Rules

1. **390px Baseline:** Test at **390px width** (iPhone 12/13/14/15 size). The page must look elegant and balanced.
2. **Zero Horizontal Overflow:**
   - `document.documentElement.scrollWidth <= window.innerWidth` is strictly asserted at 390px, 768px, and 1280px in both `ar` and `en`.
   - Never use static pixel widths wider than 300px on cards or containers.
   - Use `max-inline-size: 100%`, `overflow-x: hidden`, and relative sizing (`rem`, `%`, `cqw`).
3. **CSS Logical Properties:**
   - Always use `margin-inline`, `padding-inline`, `border-inline-start`, `text-align: start`.
   - Never use `margin-left`, `padding-right`, `left: 0`, `float: left`.
4. **Image Budget:**
   - Format: **WebP** preferred (or optimized SVG/JPEG).
   - Size limit: **Under 250 KB per image**.
   - Lazy loading: `loading="lazy"` on all images below the hero fold.
5. **Reduced Motion:**
   - Respect `prefers-reduced-motion: reduce`.
   - Disable continuous drifting, pulse rings, floating animations, and heavy transitions for users with motion sensitivity.

---

## 8. Arabic & English Sample Data Checklist

Every template must provide natural, culturally authentic sample data in both languages:

- [ ] **Couple Names:** Natural Arabic names (e.g. يوسف وليلى, طارق وفريدة) and Latin equivalents (Youssef & Laila, Tarek & Farida).
- [ ] **Headline:** Elegant invitation phrasing (e.g. "بكل حب وسرور ندعوكم لمشاركتنا فرحة العمر").
- [ ] **Event Venue:** Recognizable, authentic venue in Egypt/Arab region (e.g. "حديقة الياسمين — الزمالك، القاهرة").
- [ ] **Order of Events:** Authentic Egyptian wedding milestones:
  - استقبال الضيوف (Welcome / Guest Reception)
  - الزفة (Zaffa)
  - العشاء (Dinner)
  - الرقص وتقطيع الكيك (Celebration & Cake Cutting)
- [ ] **Dress Code:** Clear guidance (e.g. "الملابس الرسمية الأنيقة (Black Tie)").
- [ ] **RSVP Copy:** Clear acceptance/regret phrasing ("بكل سرور سأحضر" / "للأسف لا أستطيع الحضور").
- [ ] **Symmetry:** Every localized field has non-empty strings for both `ar` and `en`.

---

## 9. Final Acceptance Checklist for New Templates

Before opening a pull request for a new template (Tasks C5–C14 / T31–T40):

1. [ ] Ran `npm run template:new -- <slug>` to scaffold files.
2. [ ] Replaced placeholders in `data.ts` with original concept copy (both Arabic and English).
3. [ ] Customized `styles.css` with template palette, decorative borders, and typography.
4. [ ] All non-code assets exist under `public/assets/demo/<slug>/` and are listed in `ASSET_LICENSES.md`.
5. [ ] Images are under 250 KB each (WebP or optimized SVG).
6. [ ] Template unit test passes: `npx vitest run src/templates/<slug>/<slug>.test.ts`.
7. [ ] Central registry test passes: `npx vitest run src/templates/__tests__/registry.test.ts`.
8. [ ] Document roundtrip test passes: `npx vitest run src/templates/__tests__/document-roundtrip.test.ts`.
9. [ ] Playwright visual test passes at 390, 768, 1280 in `ar` and `en` with 0px horizontal overflow.
10. [ ] `npm run typecheck` and `npm run lint` pass with zero warnings.
