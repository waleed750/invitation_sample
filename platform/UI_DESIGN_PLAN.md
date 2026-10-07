# UI Design Plan — Dawati (دعوتي) Wedding Invitation Platform

Arabic-first (RTL) with full English (LTR). Web only (responsive, mobile-first at 390px). Light theme only. WCAG 2.2 AA.
Audience: Egyptian couples (mostly the bride or groom, on a phone, often in the evening), plus their guests who open the invitation from WhatsApp.
Brand personality: **ceremonial, warm, unhurried**. Think candlelit hall, gold hairlines, ivory paper. Not "startup SaaS".

This document is a design brief. It describes what to build and how it should look and behave. It contains no implementation instructions.

---

## 0. Audit Summary and Priorities

### 0.1 What was audited

All public and signed-in screens were reviewed in Arabic at 390 × 844 (phone) and 1440 × 900 (desktop): landing, pricing, template gallery, template demo, checkout, payment, result, dashboard (sign-in, home, invitation, guests, orders, points, account) and the public invitation's RSVP and guestbook area.

### 0.2 Cross-cutting problems (affect every screen)

1. **Three visual languages in one product.** The landing uses Amiri headings, IBM Plex Sans Arabic body, square 4px cards and 16px buttons. The template gallery, checkout and dashboard use a different, older system: a geometric sans for Arabic headings, fully rounded pill buttons, 16–20px rounded cards, a cream background and a different green and gold. A couple who moves from the landing to "Use this design" sees a different brand. This is the single biggest trust leak.
2. **Two different headers and footers.** The landing has the full header (logo, nav, language, account, CTA). The gallery has a stacked, centered nav with a separate footer. Checkout has a bare logo with "secure demo payment" text. The dashboard has a logo and language switch only.
3. **The 8-point star is used everywhere**: list bullets, facts strip, FAQ toggles, feature titles, pricing ticks, steps, final banner and the logo. When an ornament appears 40+ times, it stops reading as an ornament and the page looks busy.
4. **Icons are text characters** in the dashboard nav, empty states, guests link and result page (house, box, sparkle, circle, pawn, arrow, check, cross, ellipsis glyphs). They render differently on each device, and the arrow glyph points the wrong way in RTL.
5. **Copy register is mixed.** The landing hero speaks Egyptian colloquial; checkout, dashboard and gallery speak formal MSA; plan names are transliterated English ("سيف ذا ديت", "كلاسيك", "بريميوم"); the gallery shows an uppercase Latin "CLASSIC" badge on an Arabic page.
6. **Pure gold (#c19a51) is used as text in places** but measures about 2.5:1 on ivory. It fails AA for text and may only be used for lines and ornaments on light backgrounds.
7. **Dates are shown as raw "dd/mm/yyyy" fields** in left-to-right order inside right-to-left forms, with no friendly echo such as "السبت ١٥ أبريل ٢٠٢٧".

### 0.3 Per-screen problems

**Landing (hero)**
- On a 390px phone the hero is a form: tag, two-line title, subtitle, two labeled inputs and two full-width dark buttons. The phone demo, which is the product's best asset, starts **below the fold**, at about 760px. Nobody sees the magic without scrolling.
- Three dark primary buttons are stacked within about 200px: "Open my invitation", the grey "See live demo" and the sticky "Design your invitation now". The eye has no single target.
- On desktop the phone sits inside a flat dark-green rectangle with a faint lattice. It reads as a placeholder box, not a scene. The reference sites (digital-yes demos, invite-atelier, halaheel/rozana) all stage the invitation inside a painted environment with depth, light and framing.
- The mobile header uses two rows: logo, language and account, then a horizontal-scrolling nav. That is 130px of chrome before any content.
- After the visitor types names there is no bridge to buying. The CTA becomes "Open it again" rather than "Make it real with these names", and the names are not carried to checkout.

**Landing (below the hero)**
- The page is about 10,450px tall on a phone, roughly 12 screens. There are nine sections and several say the same thing: Facts, Features, Early, Final banner and the hero points all repeat "one payment, no app, WhatsApp".
- The "Designs" section shows one real design and **three empty "coming soon" cards** with hatched placeholders. That advertises a thin catalog.
- How-it-works uses large outlined "01/02/03" numerals with lots of empty space. It is low in information.
- There is no section showing the **guest-management dashboard**, which is the real differentiator ("track who's coming in one table").

**Pricing**
- The cards are clear, but the recommended plan barely stands out (only a thicker border).
- Plan names are transliterated English.
- The comparison table is collapsed on the landing and lives far from the cards.
- The refund line is small grey text at the bottom, and trust items (payment methods, refund, support) are not grouped near the buttons.

**Template gallery**
- Text-only cards: there is no image of the design. A couple chooses a wedding invitation **without seeing it**.
- It uses the old visual system and the stacked header.
- "Use this design" wraps onto two lines inside a pill button.
- There are no filters, no indication of which designs have video or music, and no tier explanation.

**Template demo page**
- It renders the invitation full-screen with **no way back and no way to buy**. There is no "Use this design" or "Try with your names" control, so the visitor hits a dead end inside a beautiful page.

**Checkout**
- All three steps are expanded at once, so the page is very long on mobile.
- The phone verification code is requested **before** the plan is chosen, which asks for commitment too early.
- The coupon field is always visible and pre-filled with a sample code.
- The "mini preview" is a generic green box, not the chosen design.
- The order summary sits **after** the form on mobile, so the pay button is about 2,000px down.
- The heading takes two lines at 56px and pushes the form below the fold.
- No trust signals sit next to the pay button: no payment method marks, refund line or support link.

**Payment and result pages**
- These are functional but bare: the order ID is shown as a long technical string and the status mark is a text glyph.
- The success page does not celebrate or explain the next three steps (customize, publish, share).

**Dashboard (all pages)**
- It uses the old visual system: a gradient green welcome slab, a uppercase level pill and glyph icons.
- The home greeting card dominates the first screen with a points balance, which is the least important information for a couple two weeks before their wedding.
- The days-online bar is always drawn at 70% whatever the real value, so it **misleads**.
- Each invitation card offers three equal-weight actions (Open, Buy edits, Extend). Upsells compete with the main task.
- The sign-out control appears in the header only on desktop.

**Invitation manage page**
- There is no way to edit content (names, date, venue, message) from here, even though "edits left" is shown prominently.
- The page does not answer "what should I do next?". Publish, share and guests are three cards of equal weight.
- The QR code has no download action.

**Guests page**
- The four stat tiles are good. But there are no filter chips (attending, declined), no per-row actions beyond WhatsApp, and messages sit in a long block under the table instead of their own tab.

**Orders, Points, Account**
- Orders show the raw order ID as the card title and "Receipt coming soon" as a row in every card.
- Points places a large balance in yellow on green with no explanation of its worth in EGP.
- Account shows a disabled red "Delete account" button, which looks broken.

**Public invitation (RSVP and guestbook)**
- The "sending", "error", "limit reached" and "success" messages all appear as the same plain text line under the form.
- After success the form resets and stays visible, so guests are unsure the reply was saved and some submit twice.
- The attend and decline choice uses small native radio buttons.

### 0.4 Top 10 changes, ranked by impact

| # | Change | Why it matters | Screens |
|---|---|---|---|
| 1 | **Rebuild the landing hero as a full-bleed candlelit scene with the playing phone above the fold on mobile**, using one combined names field and one primary CTA. | First impression; the owner called the hero "very bad"; the product demo is currently hidden. | Landing |
| 2 | **Unify the design system** (tokens, fonts, buttons, cards, header, footer) across landing, gallery, checkout and dashboard. | Removes the brand split that hurts trust at the moment of paying. | All |
| 3 | **Add a persistent "Use this design" bar to the template demo page**, plus "Try with your names". | Removes the dead end on the highest-intent page. | Template demo |
| 4 | **Show real visual previews in the gallery and landing design cards**, inside an arched phone frame, and remove the empty "coming soon" placeholders. | People buy what they see. | Gallery, Landing |
| 5 | **Restructure checkout** into three sequential steps (names and date, then plan, then verify and pay) with a live preview of the chosen design and a sticky total-and-pay bar on mobile. | Shorter path, payment visible, commitment requested last. | Checkout |
| 6 | **Carry the visitor's typed names from the hero into checkout**, and change the CTA to "Make it real with these names". | Turns the delight moment into a conversion bridge. | Landing, Checkout |
| 7 | **Make the dashboard home a calm control room**: one invitation hero card with a single contextual next action, honest meters, and upsells moved to a quiet secondary row. | The couple's real question is "what do I do next and who is coming". | Dashboard home, Invitation |
| 8 | **Give the public RSVP distinct states**: large tap-friendly choice cards, inline errors, and a full thank-you card that replaces the form after success. | Guest confidence and fewer duplicate replies. | Public invitation |
| 9 | **Shorten the landing from 9 to 7 sections**: merge Facts, Features and Early; add a "your guest list" dashboard showcase; keep one final CTA. Cuts mobile length by about 40%. | Less repetition, clearer story. | Landing |
| 10 | **Replace text-glyph icons with one line-icon family**, mirror directional icons in RTL, limit the star ornament to brand moments, fix gold-as-text contrast, and use Arabic plan names. | Polish and accessibility at low cost. | All |

---

## 1. Design System

### 1.1 Color Tokens

A single light palette for the whole product. Hex values appear only in this section; screens refer to tokens by name.

**Brand and surface**

| Token | Value | Role |
|---|---|---|
| --color-primary | #07271E | Deep green. Primary buttons, scene backgrounds, dashboard nav active state, headings on dark-green stages. |
| --color-primary-dark | #031812 | Deepest shade, used only at the outer edges of scene backgrounds (vignette). |
| --color-primary-hover | #1F3D33 | Hover and pressed state of primary buttons. Also the heading text color on ivory. |
| --color-secondary | #C19A51 | Gold. **Lines, ornaments, focus glow on dark, icon strokes on dark only.** Never body text on light backgrounds. |
| --color-secondary-strong | #4A3300 | Dark gold. Eyebrows, accent words in headings, links and gold text on light backgrounds. |
| --color-secondary-soft | #FFDEA7 | Light gold. Text and accents on deep green (prices on dark, seals). |
| --color-mint | #C8EADB | Secondary text on deep green; "published" and "attending" tint backgrounds. |
| --color-background | #FCF9F5 | Ivory page background. |
| --color-surface | #FFFFFF | Cards, inputs, sheets. |
| --color-surface-alt | #F6F3EF | Alternate section band, table header rows. |
| --color-surface-sunken | #F0EDEA | Ghost buttons, segmented controls, skeletons. |
| --color-sand | #E3D8C6 | Borders of inputs and cards, dividers. |
| --color-border | #E3D8C6 | Same as sand; the default border. |
| --color-hairline | #C19A51 at 45% opacity | Decorative gold hairlines (section dividers, featured card frame). |
| --color-on-primary | #FCF9F5 | Text on deep green. |
| --color-on-surface | #18201C | Body text (ink). |
| --color-muted | #5A625D | Secondary text. **Allowed on ivory, white and surface-alt only, not on sand.** |

**Feedback**

| Token | Text value | Tint background | Use |
|---|---|---|---|
| --color-success | #176040 | #DCEADF | Paid, published, attending, saved |
| --color-error | #9C3333 | #F7E3E0 | Failed payment, validation, declined (use neutral for declined in guest lists, see Guests) |
| --color-warning | #63480E | #F3E8C8 | Pending payment, expiring soon, few edits left |
| --color-info | #1F3D33 | #C8EADB | Neutral notices, demo mode |

**Verified contrast pairs (WCAG AA: 4.5:1 for text, 3:1 for large text and UI parts)**

| Foreground | Background | Ratio | Allowed for |
|---|---|---|---|
| on-surface (ink) | background (ivory) | about 15.7:1 | All text |
| primary-hover (green 800) | background | about 11.2:1 | Headings, links |
| muted | background | about 5.7:1 | Secondary text |
| muted | sand | about 4.4:1 | **Not allowed**; use ink on sand |
| secondary-strong (dark gold) | background | about 11.3:1 | Eyebrows, accent text |
| secondary (gold) | background | about 2.5:1 | **Decoration only**; never text or a sole indicator |
| on-primary (ivory) | primary | about 15:1 | Text on deep green |
| secondary (gold) | primary | about 6.1:1 | Gold text, icons and focus rings on deep green |
| secondary-soft (light gold) | primary | about 12.3:1 | Prices and highlights on deep green |
| mint | primary | about 12.3:1 | Secondary text on deep green |
| success text | success tint | above 6:1 | Badges |
| error text | background | about 6.8:1 | Error messages |

**Scene treatment** (landing hero, final banner, dashboard welcome strip, payment success): deep green base. A warm candle-glow radial light sits behind the focal object (gold at about 18% opacity fading to transparent over 60% of the area). The edges darken to primary-dark. The faint gold lattice sits at 12% opacity. Where painterly art is used (arch, candles, garland from the Riwaq demo set), it is darkened to about 35% brightness and softly blurred so that foreground text stays above 7:1.

### 1.2 Typography Scale

**Families**

| Use | Arabic | English |
|---|---|---|
| Display and headings | Amiri, bold | Cormorant Garamond, semibold |
| Body, UI, numbers | IBM Plex Sans Arabic | IBM Plex Sans Arabic (its Latin set), or Inter as fallback |
| Couple names (in invitation previews only) | Aref Ruqaa | Cormorant Garamond italic |

**Rules**
- Ruqaa is **never** used for interface text, buttons or headings. It appears only where it depicts a name on an invitation.
- Numbers (prices, counts, phone numbers, codes) use Western digits in both locales, in tabular figures. Each number is isolated so that "1,299 ج.م" never flips order inside RTL text.
- The minimum body size is 16px on mobile. Arabic needs taller lines: Amiri headings use line height 1.5–1.6 in Arabic and 1.15–1.2 in English.

| Style | Size, mobile → desktop | Weight | Line height, Arabic / English | Use |
|---|---|---|---|---|
| display | 34px → 56px | 700 | 1.45 / 1.1 | Landing hero headline only |
| h1 | 28px → 40px | 700 | 1.5 / 1.15 | Page titles |
| h2 | 24px → 32px | 700 | 1.5 / 1.2 | Section titles |
| h3 | 20px → 22px | 700 | 1.5 / 1.25 | Card titles |
| body-lg | 18px | 400 | 1.75 / 1.6 | Lead paragraphs |
| body | 16px | 400 | 1.75 / 1.6 | Default text |
| label | 14px | 600 | 1.5 / 1.4 | Form labels, buttons (buttons use 16px) |
| caption | 13px | 400 | 1.6 / 1.5 | Helper text, timestamps (never below 13px) |
| eyebrow | 14px | 600 | 1.5 / 1.4 | Small section kicker in secondary-strong; no uppercase in Arabic, small caps with +4% tracking in English |
| price-xl | 40px → 48px | 700 (heading family) | 1 | Pricing amounts |
| stat | 32px → 40px | 700 (heading family) | 1.1 | Dashboard numbers |

### 1.3 Spacing & Layout Grid

8pt grid: space-1 4px, space-2 8px, space-3 12px, space-4 16px, space-5 24px, space-6 32px, space-7 48px, space-8 64px, plus space-9 96px for desktop section rhythm only.

| Breakpoint | Width | Columns | Side margin | Gutter | Max content width |
|---|---|---|---|---|---|
| mobile | below 640px (designed at 390px) | 4 | 16px | 16px | full |
| tablet | 640–1023px | 8 | 32px | 24px | full |
| desktop | 1024–1279px | 12 | 48px | 24px | 1120px |
| wide | 1280px and up | 12 | auto | 32px | 1160px (dashboard content 1040px) |

- Section vertical padding: 48px on mobile, 64px on tablet, 96px on desktop.
- Reading width for paragraphs: at most 36em (about 60–70 Arabic characters per line).
- No horizontal scrolling at any width. Long names, links and phone numbers wrap or truncate with an ellipsis and offer a copy action.

### 1.4 Elevation & Shadow Scale

The product is mostly flat; depth comes from color bands and hairlines.

| Level | Look | Use |
|---|---|---|
| 0 | No shadow, 1px sand border | Default cards, inputs |
| 1 | Very soft shadow (2px offset, 8px blur, green at 6%) | Hovered cards, dashboard cards |
| 2 | Soft shadow (8px offset, 24px blur, green at 10%) | Sticky bars, popovers, bottom sheets |
| 3 | Deep shadow (24px offset, 48px blur, green at 22%) | **Phone mockups only**, the one dramatic shadow |

### 1.5 Border Radius Scale

| Token | Value | Use |
|---|---|---|
| radius-sm | 6px | Badges, chips, small tags |
| radius-md | 12px | Buttons, inputs, segmented controls |
| radius-lg | 16px | Cards, panels, checkout steps |
| radius-xl | 24px | Scene stages, bottom sheets, dialogs |
| radius-arch | Half-circle top, square-ish bottom (16px) | **Signature shape**: template thumbnails, the hero phone's inner frame accent, empty-state illustrations, success seal frame |
| radius-pill | Fully round | Status badges, the floating hint inside the phone |

Fully rounded pill buttons are retired. Buttons use radius-md everywhere.

### 1.6 Icon System

- One outline icon family with 1.5px stroke, rounded joins, and 20px or 24px sizes, used across the whole product. Text characters are not used as icons.
- Directional icons (chevrons, arrows, "back", "next", "send") mirror in RTL. Non-directional icons (calendar, phone, check, WhatsApp, QR, download) never mirror.
- The **8-point star in a circle** is the brand mark. It may appear: in the logo, as the wax seal on invitation previews, once per section as a centered divider ornament on marketing pages, and on the success seal. It must **not** be used as list bullets. Use a 6px gold diamond for marketing bullets and a check icon for feature lists.
- Required icons: home, invitations (envelope), guests (people), orders (receipt), points (sparkle or star), account (person), edit (pencil), share, copy, QR, download, WhatsApp, calendar, clock, location pin, music, video, check, close, chevron, search, filter, external link, info, warning, lock (secure payment).
- Icon-only buttons always have a screen-reader label and a tooltip on desktop hover.

### 1.7 Motion & Animation Tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| motion-fast | 150ms | ease-out | Hover, press, focus |
| motion-base | 250ms | ease-out | Card enter, accordion, tab switch |
| motion-slow | 400ms | gentle ease-in-out | Sheets, step transitions, toasts |
| motion-ceremony | 900–1400ms | slow start, soft landing | Invitation opening (curtains, envelope), success seal |
| motion-ambient | 6–8s loop | sine in-out | Phone float (at most 8px of travel), candle glow pulse (opacity 0.9 to 1) |

Rules:
- At most one ambient motion is visible per viewport.
- With the reduced-motion setting on: no ambient loops, no autoplay video (show the poster still), ceremony motions become a 200ms cross-fade, and parallax is disabled.
- Video never autoplays with sound.

---

## 2. Global Patterns

### 2.1 Responsive Strategy

Mobile-first, designed at 390 × 844 and verified at 360px and 430px.
- **Marketing pages**: one column on mobile. The hero becomes two columns from desktop (1024px).
- **Checkout**: one column with a sticky bottom total bar on mobile and tablet. From desktop, two columns: steps on the start side and a sticky summary on the end side.
- **Dashboard**: bottom tab bar on mobile and tablet. From 1024px, a start-side rail (240px wide). Content max width 1040px.
- **Public invitation**: always phone-shaped. On desktop the invitation is centered at 480px wide on a blurred scene backdrop.
- Touch targets are at least 44 × 44px, with 8px between adjacent targets.

### 2.2 Dark Mode Strategy

Not required. Light theme only. Deep-green "scene" surfaces provide the dark, premium moments inside the light theme. The page declares light color scheme so that system dark mode does not invert form controls.

### 2.3 Navigation Pattern

**Marketing header** (landing, pricing, gallery). One shared component on every public marketing page.
- Mobile height: 56px, one row. Logo on the start side (right in RTL). On the end side: the language toggle (AR | EN, segmented) and a menu button.
- The menu opens a full-height sheet from the end side. It contains Designs, Pricing, How it works, FAQ, My account, a primary "Start your invitation" button, and a WhatsApp support link.
- Desktop height: 72px. Logo; inline nav (Designs, Pricing, How it works, FAQ); language toggle; "My account" as text link with icon; primary CTA.
- Background is ivory with a sand bottom border. Over the landing hero scene, the header is transparent with ivory text until scrolled 24px, then becomes ivory over 250ms.

**Checkout header.** Logo (links home after a confirm-leave prompt if fields are filled), a centered step indicator ("1 Details · 2 Plan · 3 Pay"), and on the end side a lock icon with "Secure payment" and a WhatsApp help icon. There is no marketing nav, so the funnel stays focused.

**Dashboard.**
- Mobile: a 56px top bar with the logo, the invitation switcher (if more than one invitation) and an account avatar menu. A 64px bottom tab bar with 4 tabs: Home, Guests (opens the current invitation's guests), Orders, Account. Points moves into Account and the home card.
- Desktop: a start-side rail with the logo, nav items with icon and label, the current invitation summary, and at the bottom the language toggle and Sign out.

**Public invitation.** No platform chrome. Only a discreet "Made with Dawati" credit in the footer section.

**Footer** (marketing and gallery). One shared component with 3 link groups (Product, Help, Legal), the WhatsApp contact, the language toggle, payment method marks, and the copyright line. On mobile, the link groups stack as accordions.

**Demo mode banner.** While payments are simulated, a single 40px info-tint strip sits above the header on checkout and the dashboard only. It is never shown on the landing or the public invitation.

### 2.4 Loading States

- **Server-rendered pages** show content immediately. Client-loaded areas (guest list, messages, points ledger) use skeleton blocks in surface-sunken with a soft shimmer (1.2s, disabled with reduced motion).
- **Buttons with async actions** keep their width, swap the label for a 16px spinner plus the verb in progress ("جارٍ الإرسال…"), and become non-interactive. Spinners appear only after 300ms, to avoid flicker.
- **Hero phone video**: the poster still is shown instantly. Video fades in over 400ms when ready. Video never blocks the page's first paint.
- **Payment redirects**: a full-width calm interstitial with the seal ornament and "Taking you to secure payment…". After 8 seconds, a manual "Continue" link appears.

### 2.5 Empty States

Every empty state has:
- an arch-framed line illustration (120px) in gold line art;
- a one-line h3 title;
- one sentence of guidance;
- exactly one primary action.

| Screen | Title (intent) | Action |
|---|---|---|
| Dashboard, no invitations | "Your invitation will live here" | Browse designs |
| Guests, no replies | "No replies yet. Share your link to start." | Share on WhatsApp |
| Guests, filter empty | "No guests match this filter" | Clear filter |
| Messages, none | "Wishes from your guests will appear here" | Copy invitation link |
| Orders, none | "No orders yet" | Browse designs |
| Points ledger, none | "Points arrive with your first purchase" | (no action, info only) |

### 2.6 Error States

- **Field errors**: shown below the field in the error color with a warning icon. The field border becomes error-colored at 2px. The message says how to fix it ("رقم الموبايل لازم يبدأ بـ 01 ويكون 11 رقم"). Errors appear on blur or submit, never while the user is typing.
- **Form-level errors**: an error-tint panel at the top of the form with a short list of linked issues. Focus moves to the panel.
- **Payment failure**: a dedicated result state (see Checkout Result). Never shown as a toast.
- **Network or server failures**: an inline panel with "Try again" and a WhatsApp support link. Data entered by the user is preserved.
- **404 and expired invitation**: a scene background, a gentle message, and one action (Home, or "Contact the couple" for expired).
- **Toasts**: only for confirmations of reversible actions ("Link copied"). 4s, at the bottom on mobile, bottom-start on desktop, announced politely to screen readers.

### 2.7 Accessibility Baseline

- WCAG 2.2 AA. All text pairs from the contrast table in section 1.1.
- Visible focus on every interactive element: a 3px ring in secondary-strong on light backgrounds and gold on deep green, offset 3px. The ring is never removed.
- A skip link to main content on every page.
- Page landmarks: one header, one nav per navigation group (each with a distinct label), one main, one footer.
- Language and direction are set per page. Mixed-direction strings (names in English inside Arabic, phone numbers, prices, URLs, order codes) are isolated so their characters keep their own order.
- Forms: every input has a visible label (placeholders are examples, not labels), groups use legends, and required fields are marked in words, not color alone.
- Status changes (copied, saved, RSVP sent, payment pending) are announced politely; errors are announced assertively.
- Touch targets are at least 44 × 44px. Text scales to 200% without loss of content or horizontal scroll.
- Video has no sound by default; any music has a visible, labeled play and pause control.

---

## 3. Screen Specifications

---

### Screen: Landing

**Route / Path:** `/[locale]` (e.g. `/ar`, `/en`)
**Platform:** Web
**Auth required:** No

#### Purpose & User Goal
The couple sees, within 5 seconds and without scrolling, their own names on a beautiful animated invitation, and understands they can have it today for a one-time price.

#### Layout Structure
Seven sections (down from nine):

1. **Hero scene**: full-bleed, the focal point.
2. **Trust strip**: 4 facts in one row (merges the old Facts strip and hero points).
3. **Designs**: real previews.
4. **How it works**: 3 compact steps, with the "guest list" showcase as step 3's visual.
5. **Pricing**: 3 plans, recommended in the middle.
6. **FAQ**: 6 questions.
7. **Final scene CTA**: merges Early access and the Final banner; includes the "first 100 couples" offer line.

Footer follows. The sticky mobile CTA appears only after the hero has scrolled out of view.

```
MOBILE 390px — above the fold (844px)
┌──────────────────────────────────┐
│ ☰  AR|EN                 دعوتي ✶ │ 56px transparent header over scene
├──────────────────────────────────┤
│   ·  deep-green candlelit scene · │
│        منصة مصرية · دفعة واحدة     │ eyebrow, light gold, 14px
│      دعوة فرحك.. بتتفتح           │ display 34px, ivory
│      على موبايل كل ضيف            │ (accent line in light gold)
│        ┌──────────────┐          │
│        │  ╭────────╮  │          │ phone 228px wide, about 470px tall
│        │  │curtains│  │          │ video plays; names overlay
│        │  │ أحمد &  │  │          │
│        │  │  منى    │  │          │
│        │  ╰────────╯  │          │
│        └──────────────┘          │
│ ┌──────────────────────┬───────┐ │ combined field 56px:
│ │ اكتبوا أسماءكم…       │ افتحها │ │ input + gold button joined
│ └──────────────────────┴───────┘ │
│   شاهد مثال كامل ←  (text link)    │
└──────────────────────────────────┘
```

```
DESKTOP 1440px — hero
┌────────────────────────────────────────────────────────────────┐
│ header 72px (transparent over scene)                           │
├────────────────────────────────────────────────────────────────┤
│ column ▮ garland              candle glow             column ▮ │
│                                                                │
│  [start side: 6 cols]                 [end side: 5 cols]       │
│  eyebrow                               ┌──────────┐            │
│  display headline (2 lines)            │  phone   │ 320px wide │
│  sub (1 line, 18px, mint)              │  playing │ floating   │
│  ┌──────────────────────┬─────────┐    │          │            │
│  │ names                │ date ▾  │    └──────────┘            │
│  └──────────────────────┴─────────┘    soft gold floor glow    │
│  [ Open my invitation ]  See full demo →                       │
│  ✓ No app  ✓ WhatsApp link  ✓ One payment in EGP               │
└────────────────────────────────────────────────────────────────┘
```

**Hero scene details**
- **Height**: on mobile, the visible viewport minus the header (at least 640px, at most 900px). On desktop, 760px.
- **Background**: the scene treatment from 1.1, painterly. On desktop, the arch columns and garland art from the Riwaq set frame the outer edges at about 35% brightness. Candle glow sits behind the phone. On mobile only the glow and a subtle garland across the top edge are used; the columns are hidden so the phone has room.
- **Phone mockup**:
  - Size: 58% of viewport width on mobile (about 228px), 320px on desktop.
  - Look: a thin gold border; the level-3 shadow; a soft gold "floor glow" ellipse beneath it.
  - Playback: the curtain intro plays **automatically once** when the hero becomes visible. The visitor no longer needs to tap first, because a hidden opener is easy to miss. Then the candlelit loop continues.
  - Names: the visitor's names overlay in Ruqaa (Arabic) or Cormorant italic (English), sized so that 20 characters fit on two lines. The date sits beneath in body font between gold hairlines.
  - Tap: a tap on the phone replays the opening.
  - Hint: a pill hint "اضغط لإعادة الفتح" (tap to replay) appears after the first play ends.
- **Names field**:
  - One combined control, 56px tall. The text input has a visible label above it reading "أسماء العروسين" in ivory, 14px. An attached gold button "افتحها" sits on the end side.
  - The date is a secondary control. On mobile it sits behind a small "＋ تاريخ الفرح" link that expands a date field; on desktop it is inline.
  - Typing updates the overlay live, 250ms after the last keystroke. The video does not restart on each keystroke.
- **Conversion bridge**: once the visitor has typed names and the opening has played, a line appears under the field over 400ms: "عجبتكم؟ خلّوها حقيقية — من 499 ج.م" with a primary ivory-on-green button "كمّلوا بالأسماء دي". It opens checkout for the featured design with names and date already filled in.
- **Secondary action**: "See full demo" is a text link with a chevron, not a second button.

#### Color Tokens Used
| Element | Token |
|---|---|
| Hero background | primary, primary-dark (vignette), secondary at 18% (glow) |
| Headline | on-primary; accent line in secondary-soft |
| Eyebrow, trust ticks on dark | secondary-soft |
| Sub text on dark | mint |
| Names field | surface background, on-surface text, sand border; button in secondary with primary text |
| Section backgrounds | background and surface-alt alternating |
| Section eyebrows | secondary-strong |
| Section headings | primary-hover |
| Dividers and ornaments | hairline, secondary |
| Sticky CTA bar | surface with level-2 shadow; button primary |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Hero headline | display | 34px mobile / 56px desktop | 700 |
| Hero eyebrow | eyebrow | 14px | 600 |
| Hero sub (desktop only; hidden on mobile) | body-lg | 18px | 400 |
| Names in phone | Ruqaa / Cormorant italic | scales with phone, about 30px | 400 / 500 |
| Section titles | h2 | 24px / 32px | 700 |
| Card titles | h3 | 20px / 22px | 700 |
| Body | body | 16px | 400 |
| Trust strip items | label | 14px | 600 |

#### Component Breakdown
- **Hero Scene**: described above. States: initial (poster), playing intro, ambient loop, reduced motion (still image with names, no video), video failed (poster still, same as reduced).
- **Names Field (combined)**:
  - States: empty (placeholder "مثال: أحمد & منى"), focused (2px secondary-strong ring), filled, over limit (at 40 characters the counter turns warning), disabled (never).
  - The button's hover lightens to secondary-soft and pressed darkens 8%.
- **Conversion Bridge**: hidden until the visitor has typed names; when shown, a fade plus 8px rise.
- **Trust Strip**:
  - Four items, each with an icon and short text: "دفعة واحدة بالجنيه", "رابط واتساب بدون تطبيق", "عربي وإنجليزي", "استرداد خلال 7 أيام قبل النشر" (exact refund wording from the legal copy).
  - Layout: a 2 × 2 grid on mobile and one row on desktop. Background is surface-alt with sand top and bottom borders.
- **Designs Section**:
  - Header with eyebrow, title, and a "See all designs" text link.
  - Cards: Design Cards (see Component Library). On mobile, a horizontal snap carousel shows 1.2 cards, so the next card peeks; on tablet 2 cards; on desktop 3–4 cards.
  - **No empty "coming soon" placeholders.** If fewer than 3 designs are live, show the live ones, then a single slim card "تصاميم جديدة كل شهر" with an "Notify me on WhatsApp" link.
- **How It Works**:
  - Three steps in a vertical timeline on mobile and a three-column layout on desktop. Each step has a small number in a gold ring (32px), a title and one sentence.
  - Step 3 ("ابعتوها وتابعوا الردود") shows a cropped, styled **guest-list showcase**: a mock dashboard card with 4 stats (Attending 128, Declined 12, Total guests 214, Remaining 86) and three guest rows with attending and declined badges, using clearly fictional sample names. This is the product differentiator.
- **Pricing Section**: the Plan Cards from the Pricing screen, without the comparison table. A "Compare all features" link goes to the Pricing page.
- **FAQ**:
  - An accordion of 6 items. The toggle icon is a plus that rotates to a cross.
  - Each item has a 56px minimum row height, a question in h3 at 18px, and the answer in body muted.
  - The first item is open by default.
- **Final Scene CTA**:
  - The scene background (compact, 480px tall on desktop).
  - Contents: the star seal ornament (48px); headline "يوم فرحكم يستاهل دعوة تليق بيه"; the early-offer line in secondary-soft ("أول 100 عريس وعروسة: خصم 10% بكود WELCOME10", shown only while the offer is live); a primary gold button "ابدأوا دعوتكم"; and a secondary outline-ivory button "اسألونا على واتساب".
- **Sticky CTA (mobile and tablet only)**:
  - Height 72px plus the device safe area.
  - Shows the price "من 499 ج.م" on the start side and a primary button "ابدأوا دعوتكم" on the end side.
  - Appears with a slide-up once the hero is fully out of view; hides while the footer is visible.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Hero stacks: eyebrow, headline, phone, names field, link. Sub-text and trust ticks move to the Trust Strip. Designs become a horizontal carousel. Steps form a vertical timeline. Pricing cards stack with the recommended plan **first**. Sticky CTA appears after the hero. |
| tablet 640–1023px | Hero still stacked; phone 280px. Designs in 2 columns. Steps in 3 columns. Pricing cards in a horizontal snap row (recommended centered and pre-scrolled into view). |
| desktop ≥ 1024px | Hero in two columns (copy on the start side, phone on the end side) with framing columns art. Designs in 3–4 columns. Pricing in 3 columns with the recommended one raised 16px. No sticky CTA (the header CTA is always visible). |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Hero in view (first time) | Curtain intro video plays, then cross-fades to loop | video length, then 600ms fade | ceremony |
| Names overlay appears | Fade in + 6px rise | 900ms, starting 1.2s after the intro begins | ceremony |
| Typing names | Overlay text cross-fades | 200ms | ease-out |
| Phone idle | Gentle float, 8px | 7s loop | ambient |
| Conversion bridge reveal | Fade + rise 8px | 400ms | slow |
| Sections entering view | Fade + rise 12px, once | 400ms | ease-out |
| Sticky CTA | Slide up from bottom | 250ms | ease-out |
| Header over hero → scrolled | Background fades to ivory, text to ink | 250ms | ease-out |

With reduced motion: no video (poster with names shown immediately), no float, no reveal motion; sections are simply present.

#### Accessibility Notes
- The hero headline is the page's only h1.
- The phone mockup is a button labeled "Replay the invitation opening". The names overlay inside it is decorative because the same names are in the input.
- The names field has a visible label. The live preview is announced politely once typing pauses ("Preview updated").
- Contrast: ivory on primary is 15:1; light gold on primary 12:1; mint on primary 12:1; gold button with primary text about 6:1.
- The carousel has previous and next buttons (mirrored in RTL) and a visible "1 of 4" counter. Swiping is never the only way to move.
- Focus order: skip link, logo, menu or nav, language toggle, account, CTA, names input, open button, date, demo link, then sections in order.

#### Platform-Specific Notes
**Web:**
- Landmarks: header (with nav), main (sections, each with a heading), footer.
- The hero poster image must be in the initial server render so the phone never appears empty. The video loads after first paint; the layout does not shift when it arrives (the phone keeps a fixed aspect ratio of 9 : 19.5).
- Web-only hover: Design Cards lift to level 1 and the preview starts its short loop; header links get a 1px gold underline.

---

### Screen: Pricing

**Route / Path:** `/[locale]/pricing`
**Platform:** Web
**Auth required:** No

#### Purpose & User Goal
The couple picks the right plan with confidence in under 30 seconds and knows exactly what is and is not included.

#### Layout Structure
- Top: the shared marketing header, then a compact page intro (eyebrow, h1 "باقة واحدة لفرحكم، تدفعوها مرة واحدة", one-line sub).
- Middle:
  1. Three Plan Cards.
  2. A **trust row** directly under the cards: payment methods (card, mobile wallets, Fawry cash), the refund rule, and WhatsApp support.
  3. The full comparison table, always expanded.
  4. Add-ons: extra edits and extension, each shown with its price.
  5. FAQ filtered to payment questions.
- Bottom: the final CTA strip, then the footer. Sticky CTA on mobile.

```
DESKTOP
┌──────────┐ ┌────────────────┐ ┌──────────┐
│ Save the │ │ ✶ الأكثر اختيارًا │ │ Premium  │
│  date    │ │    Classic     │ │          │
│  499     │ │    1,299       │ │  2,499   │
│ features │ │   features     │ │ features │
│ [choose] │ │ [■ choose ■]   │ │ [choose] │
└──────────┘ └────────────────┘ └──────────┘
   [lock] Card · Wallet · Fawry   [refund] 7-day rule   [chat] WhatsApp
```

#### Color Tokens Used
| Element | Token |
|---|---|
| Page background | background |
| Standard plan card | surface, border |
| Recommended plan card | primary background, on-primary text, price in secondary-soft, ticks in secondary, button in secondary with primary text |
| Recommended ribbon | secondary-soft background, secondary-strong text |
| Comparison table header row | surface-alt; "included" icons in success; "not included" as a muted dash |
| Trust row | surface-alt band, muted text, icons in primary-hover |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Page title | h1 | 28px / 40px | 700 |
| Plan name | h3 | 22px | 700 |
| Plan one-liner | body | 16px | 400 |
| Price | price-xl | 40px / 48px | 700 |
| "one-time" suffix | caption | 13px | 400 |
| Feature lines | body | 16px | 400 |
| Table cells | body | 16px | 400 |

#### Component Breakdown
- **Plan Card**:
  - Contents: Arabic plan name (recommended: "حفظ الموعد" instead of "سيف ذا ديت", "الأساسية" instead of "كلاسيك", "الملكية" instead of "بريميوم"; final names are an owner decision); one-line audience description; price with "دفعة واحدة"; 5–6 feature lines with check icons. Unavailable features appear in muted text with a dash so the differences are honest.
  - Button: "اختاروا {plan}". The recommended card uses a gold button on green; others use an outline button.
  - States: default, hover (level 1 lift), focused (ring), selected (when arriving from checkout "change plan": a 2px secondary-strong border and a check badge).
- **Recommended Ribbon**: sits at the top of the recommended card, overlapping its edge by 12px, with the star ornament and "الأكثر اختيارًا".
- **Trust Row**: 3 items, each an icon with a short text and a link.
- **Comparison Table**:
  - Rows: online duration, edits, RSVP limit, guest messages, video intro, music, design switches, support.
  - The first column stays fixed and the recommended column has a subtle surface-alt tint.
  - On mobile it becomes a **plan switcher** (segmented control with 3 plans) showing one plan's full feature list, rather than a sideways-scrolling table.
- **Add-ons List**: two rows ("+10 تعديلات", "تمديد 3 شهور") with price and a short explanation.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Cards stack, **recommended first**. The comparison becomes the segmented plan switcher. The trust row becomes a vertical list. Sticky CTA shows "اختاروا الأساسية — 1,299 ج.م". |
| tablet 640–1023px | Cards in a snap row with the recommended one centered. The comparison table is shown fully (it fits at 4 columns). |
| desktop ≥ 1024px | 3 columns; the recommended card is raised 16px and 4% larger. The table sits at full width below. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Cards enter view | Stagger fade + rise 12px (80ms apart) | 400ms | ease-out |
| Card hover | Lift to level 1 | 150ms | ease-out |
| Segmented plan switch (mobile) | Feature list cross-fade | 250ms | ease-out |

With reduced motion: no stagger and no lift; color change only.

#### Accessibility Notes
- Each plan is a region titled by its plan name. The price is read as "1,299 Egyptian pounds, one-time".
- The comparison table has row and column headers. Included and not-included are conveyed with icon plus hidden text ("Included", "Not included").
- On the recommended card: ivory on primary 15:1, light gold 12:1.
- Focus order: plan cards left to right in reading direction (right to left in Arabic), then trust row, table and FAQ.

#### Platform-Specific Notes
**Web:**
- Landmarks: header, main (h1, plans region, comparison, FAQ), footer.
- Prices are rendered on the server from the plan data. The marketing copy never hard-codes a number.
- Hover lifts are web-only; touch devices show the pressed state only.

---

### Screen: Template Gallery

**Route / Path:** `/[locale]/templates`
**Platform:** Web
**Auth required:** No

#### Purpose & User Goal
The couple sees every available design as a moving picture and opens the one that feels like their wedding.

#### Layout Structure
- Top: the shared marketing header (it replaces the old stacked header). Page intro: eyebrow, h1 "اختاروا تصميم فرحكم", one-line sub, and a row of **filter chips**: All, Classic, Modern, Painterly; With video intro; With music. Show chips only for filters that match at least one design.
- Middle: a grid of Design Cards.
- Bottom: a "Can't decide? Talk to us on WhatsApp" strip, then the footer.

#### Color Tokens Used
| Element | Token |
|---|---|
| Page background | background |
| Filter chip default | surface, border, on-surface |
| Filter chip selected | primary, on-primary |
| Design card | surface, border; preview frame in primary |
| Tier badge | surface-alt, secondary-strong text |
| Feature tags (video, music) | info tint |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Page title | h1 | 28px / 40px | 700 |
| Card design name | h3 | 20px | 700 |
| Card mood line | body | 16px | 400 |
| Price | label | 16px | 600 |
| Chips | label | 14px | 600 |

#### Component Breakdown
- **Filter Chips**: single-select for style, multi-select for features. 40px tall, radius-sm. The selected chip shows a check icon. A "Clear" text link appears once any filter is active.
- **Design Card** (shared with the landing):
  - **Preview**: an arch-topped frame in 9 : 16 ratio showing the design's poster still. On desktop hover, or when 60% of the card is in view on mobile, a silent 4–6 second loop of the design's opening plays.
  - Overlays on the preview: the tier badge at the top-start ("الأساسية") and feature icons at the top-end (video, music).
  - Below the preview: design name, a one-line mood ("أمسية قاهرية تحت ضوء القمر"), and "من 1,299 ج.م".
  - Actions: a primary "شاهدوا الدعوة" and a secondary text link "ابدأوا بهذا التصميم". Labels must fit on one line; at 390px the two actions sit side by side within a 343px card.
  - States: default, hover (level 1 lift + loop plays), focus (ring around the entire card), loading (skeleton arch), unavailable (not shown at all).
- **Help Strip**: surface-alt band with a WhatsApp icon and one sentence.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | 1 column; card width is the full content width; preview about 420px tall. Chips sit in a single horizontally scrollable row with the edge faded (the chip row is the only allowed horizontal scroll, and it is a contained component, not the page). |
| tablet 640–1023px | 2 columns. |
| desktop ≥ 1024px | 3 columns (4 at wide). The chip row is centered under the title. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Filter change | Cards fade out and in (no reflow jump) | 250ms | ease-out |
| Card in view (mobile) / hover (desktop) | Poster cross-fades to the silent loop | 400ms | ease-out |
| Card hover | Lift to level 1 | 150ms | ease-out |

With reduced motion: posters only; no loops; no lift.

#### Accessibility Notes
- Each card is an article whose title is the design name. The preview image has alt text describing the mood ("Green velvet curtains under a floral arch with candles").
- Loops are muted, have no essential information, and stop when out of view.
- Chips form a labeled group ("Filter designs"), and each chip reports its pressed state.
- Focus order: chips, then cards in reading order (preview link, then secondary link).

#### Platform-Specific Notes
**Web:**
- Landmarks: header, main (h1, filter group, list of designs), footer.
- The poster stills render on the server. Video loads only when the card is near view.

---

### Screen: Template Demo Page

**Route / Path:** `/[locale]/templates/[slug]`
**Platform:** Web
**Auth required:** No

#### Purpose & User Goal
The couple experiences the full invitation as a guest would, then starts buying it, or tries it with their names, without hunting for a way out.

#### Layout Structure
- The full invitation (unchanged design, owned by the template).
- **Demo Bar**: a floating bar pinned to the bottom (mobile) or bottom-center (desktop, max 560px wide). It appears 2 seconds after the opener finishes, or immediately if there is no opener.
  - Start side: a back chevron to the gallery; design name; "من 1,299 ج.م".
  - End side: a primary button "ابدأوا بالتصميم ده".
  - An overflow "Try with your names" opens a bottom sheet with a names field and a date field. Submitting re-renders the demo with those names and stores them for checkout.
- A small "معاينة" (Preview) ribbon at the top-start corner, so guests landing here by mistake understand it is a sample.

```
MOBILE
┌──────────────────────────────┐
│ [معاينة]                      │
│      (invitation content)    │
│                              │
├──────────────────────────────┤
│ ‹  مشربية · من 1,299   [ابدأوا] │ 64px floating bar, 8px from edges
└──────────────────────────────┘
```

#### Color Tokens Used
| Element | Token |
|---|---|
| Demo bar | primary at 92% opacity with a soft blur behind, on-primary text, price in secondary-soft |
| Primary button | secondary background, primary text |
| Preview ribbon | surface at 90%, secondary-strong text |
| Names sheet | surface, sand border, radius-xl top corners |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Design name in bar | label | 16px | 600 |
| Price in bar | caption | 13px | 600 |
| Bar button | label | 16px | 600 |
| Sheet title | h3 | 20px | 700 |

#### Component Breakdown
- **Demo Bar**:
  - States: hidden during the opener; visible; collapsed (it auto-hides while the guest scrolls down quickly and reappears on any scroll up or after 1.5s idle); pressed.
  - It never covers the invitation's own RSVP submit button. When the RSVP section is in view, the bar collapses to a 48px round "ابدأوا" button at the bottom-end.
- **Try-with-names Sheet**:
  - Fields: a names field (Ruqaa preview inside the field) and a date field with a friendly echo.
  - Actions: "شوفوها بأسمائكم" applies the names; "ابدأوا بالأسماء دي" continues to checkout prefilled.
  - Closing: drag handle, close button, or tapping the backdrop. Escape closes on desktop.
- **Preview Ribbon**: static, non-interactive.
- **Demo RSVP behavior**: submitting the RSVP in the demo shows the real success state, plus a note "ده مثال — الردود الحقيقية بتوصل للوحة التحكم بتاعتكم".

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Full-width invitation; bottom floating bar with 8px inset and safe-area clearance. |
| tablet 640–1023px | Same, with the bar max 560px and centered. |
| desktop ≥ 1024px | The invitation is centered at its phone width (480px) on a blurred scene backdrop. A slim side panel on the end side (320px) holds the design name, mood, price, features list and both actions. The floating bar is not used. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Bar first appearance | Slide up 16px + fade | 400ms | slow |
| Bar auto-hide and show on scroll | Slide | 250ms | ease-out |
| Sheet open | Slide up from bottom, backdrop fades to 40% | 400ms | slow |
| Names applied | Invitation names cross-fade | 400ms | ease-out |

With reduced motion: the bar is visible from the start and does not auto-hide; the sheet appears without sliding.

#### Accessibility Notes
- The demo bar is a labeled region ("Design actions") reachable by keyboard immediately after the skip link. It is not hidden from screen readers when visually collapsed.
- The sheet is a modal dialog: focus moves into it, stays trapped there, and returns to the trigger on close.
- Contrast: on-primary over the 92% primary bar is 14:1 or more; light gold price 11:1 or more.

#### Platform-Specific Notes
**Web:**
- Landmarks: main (the invitation), complementary (the demo panel or bar).
- The page remains non-indexed. The invitation renders on the server; the bar mounts without layout shift because it is floating.

---

### Screen: Checkout

**Route / Path:** `/[locale]/checkout/[slug]` (with optional plan and kind: new invitation, extra edits, extension)
**Platform:** Web
**Auth required:** No (phone verification happens inside the flow)

#### Purpose & User Goal
The couple confirms their names and date, picks a plan, verifies their phone, and pays in under 2 minutes, while always seeing their invitation and the total.

#### Layout Structure
Three sequential steps. Only one is open at a time. Completed steps collapse into a one-line summary with an "Edit" link.

1. **تفاصيل الفرح**: first name, second name, event date. Prefilled if the visitor came from the hero or demo.
2. **الباقة**: 3 plan choice cards, the recommended one preselected unless a plan was passed in. Below them, a "عندكم كود خصم؟" link reveals the coupon field.
3. **التأكيد والدفع**: phone number, then a 6-digit code, then the payment method (card, mobile wallet, Fawry cash), then pay.

The summary is a sticky end-side column on desktop, and a sticky bottom bar on mobile showing the total and the primary button. The bar's label changes per step: "التالي: الباقة", "التالي: الدفع", "ادفعوا 1,299 ج.م".

For kinds "extra edits" and "extension", step 1 shows the existing invitation (read-only) and steps 2–3 apply. The page title changes ("زودوا تعديلات" / "مدّوا مدة الدعوة").

```
MOBILE 390px
┌──────────────────────────────┐
│ ✶ دعوتي     ① ② ③  [lock][?] │ 56px focused header
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │  ╭──────╮  مشربية         │ │ design strip: arched thumbnail
│ │  │thumb │  أحمد & منى      │ │ with live names and date
│ │  ╰──────╯  السبت 15 أبريل   │ │
│ └──────────────────────────┘ │
│ ① تفاصيل الفرح                │ open step
│   [اسم العريس]                 │
│   [اسم العروسة]                │
│   [تاريخ الفرح  (calendar)]     │
│   السبت ١٥ أبريل ٢٠٢٧ (echo)   │
│ ② الباقة          (collapsed)  │
│ ③ التأكيد والدفع   (locked)     │
├──────────────────────────────┤
│ الإجمالي 1,299 ج.م  [التالي ←]  │ sticky bar 72px + safe area
└──────────────────────────────┘
```

```
DESKTOP
┌───────────────────────────────┬──────────────────┐
│ h1 (1 line) + one-line sub     │  Summary card    │
│ ① Details  (open)              │  arched preview  │
│ ② Plan     (collapsed summary) │  design · plan   │
│ ③ Pay      (locked)            │  subtotal        │
│                                │  discount        │
│                                │  total           │
│                                │  [Pay]           │
│                                │  [lock] card ·    │
│                                │  Fawry · refund   │
└───────────────────────────────┴──────────────────┘
```

#### Color Tokens Used
| Element | Token |
|---|---|
| Page background | background |
| Step cards | surface, border; open step has a 2px hairline frame |
| Step number (todo, current, done) | sand ring with muted number; primary fill with on-primary number; success fill with check |
| Plan choice card selected | 2px primary border, surface-alt fill, check badge in primary |
| Design strip | primary background, names in secondary-soft (Ruqaa), date in mint |
| Sticky bar and summary | surface, level-2 shadow; total in primary-hover |
| Errors | error and error tint |
| Verified phone | success text with check icon |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Page title | h1 | 28px / 32px (one line on desktop) | 700 |
| Step title | h3 | 20px | 700 |
| Field labels | label | 14px | 600 |
| Inputs | body | 16px (prevents mobile zoom) | 400 |
| Plan name in choice card | label | 16px | 600 |
| Plan detail line | caption | 13px | 400 |
| Total | h3 | 20px | 700 |
| Code input digits | h2 | 24px, tabular | 700 |

#### Component Breakdown
- **Step Indicator (header)**: three dots or numbers with labels on desktop, numbers only on mobile; the current step is announced. Done steps are clickable.
- **Design Strip**: the arched thumbnail of the chosen design (poster still), design name, live names and date. A "تغيير التصميم" link returns to the gallery, keeping the entered details.
- **Step Card**:
  - States: locked (muted header, not expandable, lock icon), open, done (one-line summary such as "أحمد & منى · 15 أبريل 2027" with an "تعديل" link), error (error border and message).
  - Moving to the next step validates the current one.
- **Name Fields**: two fields side by side on tablet and up, stacked on mobile. Labels follow the couple pattern ("اسم العريس", "اسم العروسة"; English "First name", "Partner's name"). Maximum 20 characters each, with a live counter from 15.
- **Date Field**: the native date picker for reliability. Under it, a friendly echo in the page language ("السبت، ١٥ أبريل ٢٠٢٧"). Past dates are blocked with the message "اختاروا تاريخ قادم".
- **Plan Choice Cards**: radio cards, 72px minimum height. Each shows the name, one key line ("15 تعديل · 6 شهور أونلاين · 300 رد") and the price at the end side. The recommended card has a small ribbon. A "قارنوا الباقات" link opens a bottom sheet with the comparison.
- **Coupon Disclosure**:
  - Hidden behind a text link. When opened, it shows a field with an "تطبيق" button.
  - States: applied (success tint row "WELCOME10 — خصم 130 ج.م" with a remove link), invalid (inline error).
  - The field is empty by default. No sample code is pre-filled.
- **Phone Verification**:
  - The phone field is left-to-right with a fixed "+20" prefix chip and a placeholder in the Egyptian format. The "إرسال الكود" button sits inline on desktop and full width on mobile.
  - After sending: a 6-box code input (auto-advance, paste support, one-time-code autofill), a resend link with a 60-second countdown, and "تغيير الرقم".
  - Verified state: the phone collapses to "✓ 0101 234 5678 — تم التأكيد".
- **Payment Method Cards**:
  - Three radio cards with icon, name and one line: "بطاقة بنكية — فيزا / ماستركارد / ميزة", "محفظة موبايل", "فوري — ادفعوا كاش خلال 72 ساعة".
  - Payment brand marks are shown as small monochrome marks where licensing allows; otherwise text.
- **Summary**:
  - Rows: design, plan, subtotal, discount (only if any), points used (only if any), total.
  - Under the button: a lock icon with "دفع آمن", a refund line, and a WhatsApp help link.
- **Pay Button**: states default, loading ("جارٍ تحويلكم للدفع…"), and disabled (until step 3 is valid). The button is never disabled without a visible reason: helper text lists what is missing.
- **Leave Guard**: if the visitor tries to leave with entered data, a confirm dialog appears ("هتسيبوا الصفحة؟ بياناتكم مش هتتحفظ").

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | One column. Design strip at the top. Sticky bottom bar with total and step-aware button. The full summary opens as a bottom sheet from "تفاصيل الحساب ▴" on the bar. |
| tablet 640–1023px | One column at 600px max, centered; the sticky bar remains. |
| desktop ≥ 1024px | Two columns: steps (7 columns) and a sticky summary (4 columns) holding the design preview, totals and pay. No bottom bar. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Step completes | Current collapses, next expands; scroll so the next step's title sits 16px below the header | 400ms | slow |
| Names typed | Design strip names cross-fade | 200ms | ease-out |
| Total changes (plan or coupon) | Number counts to the new value | 400ms | ease-out |
| Code boxes | Each box gets a primary bottom border as it fills | 150ms | ease-out |
| Field error | Gentle 4px shake, once | 250ms | ease-out |

With reduced motion: no shake, no count-up, and steps switch with a 150ms fade.

#### Accessibility Notes
- Each step is a region with a heading. Locked steps report "unavailable until step 1 is complete".
- The code input is announced as a single "6-digit verification code" control. Each box is labeled "Digit 1 of 6", and the whole group accepts paste.
- Phone and code fields are always left-to-right, with their labels still right-aligned in Arabic.
- Errors are linked to their fields. On submit failure, focus moves to the first error.
- Contrast: the design strip's light gold names on primary 12:1; success text on white 7:1.
- Focus order: header (logo, steps, help), design strip link, current step fields, step button, summary (desktop) or sticky bar (mobile).

#### Platform-Specific Notes
**Web:**
- Landmarks: header (with step nav), main (form), complementary (summary).
- Entered details persist in the session so a reload or the "change design" round trip loses nothing.
- When the mobile keyboard is open, the sticky bar hides so it does not cover inputs; it returns when the keyboard closes.

---

### Screen: Checkout — Payment Gateway (Pay)

**Route / Path:** `/[locale]/checkout/pay/[orderId]`
**Platform:** Web
**Auth required:** No (order owner via session)

#### Purpose & User Goal
The couple completes payment, or receives a Fawry cash reference they can use at any outlet, and knows exactly what happens next.

#### Layout Structure
- Top: the focused checkout header, with step 3 active.
- Middle: one centered card (max 520px):
  - the order summary in short form (design, plan, total, with a short order code such as "#D-48213", not the long internal ID);
  - **for card or wallet**: an explanation line and the provider's payment area (or, in demo mode, the simulation buttons grouped under a clearly labeled "وضع التجربة" panel);
  - **for Fawry**: the large reference number with a copy button, the deadline ("ادفعوا قبل الخميس 9 أكتوبر، 11:59 م") and 3 numbered steps for paying at an outlet.
- Bottom: "رجوع لتغيير طريقة الدفع" and WhatsApp help.

#### Color Tokens Used
| Element | Token |
|---|---|
| Card | surface, border, level 1 |
| Fawry reference box | surface-alt, dashed hairline border; number in primary-hover |
| Deadline | warning text on warning tint |
| Demo panel | info tint, labeled |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Title | h1 | 28px | 700 |
| Reference number | display (body family, tabular) | 32px with wide letter spacing in groups of 3 | 700 |
| Steps | body | 16px | 400 |

#### Component Breakdown
- **Order Mini Summary**: three rows plus the total.
- **Fawry Reference Box**: number grouped "123 456 789", copy button (with a "تم النسخ" toast), "Send to my WhatsApp" link, deadline row.
- **Demo Simulation Panel** (demo only): "نجاح الدفع", "فشل الدفع", "إنشاء كود فوري" as secondary buttons, grouped and labeled so they never look like real controls.
- **Waiting State**: when the payment provider is processing, a gentle spinner with "بنستنى تأكيد الدفع…". This page checks the status every 5 seconds and moves to the result automatically.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Card at full width; reference number at 28px; copy button full width beneath it. |
| tablet 640–1023px | Centered card, 520px. |
| desktop ≥ 1024px | Centered card, 520px, with a slim scene band behind the top 200px of the page. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Copy reference | Button label swaps to "تم النسخ ✓" | 150ms, then reverts after 2s | ease-out |
| Status polling | Spinner rotation | continuous | linear |

With reduced motion: the spinner is replaced by three dots that change opacity slowly.

#### Accessibility Notes
- The reference number is read digit-group by digit-group and is isolated left-to-right.
- The deadline uses words as well as color.
- The polling status is announced only when it changes.

#### Platform-Specific Notes
**Web:**
- Landmarks: header, main.
- The page must work when reopened later from WhatsApp, so the reference and deadline come from the server.

---

### Screen: Checkout — Result

**Route / Path:** `/[locale]/checkout/result/[orderId]`
**Platform:** Web
**Auth required:** No (order owner via session)

#### Purpose & User Goal
The couple knows instantly whether they paid, and if so feels celebrated and sees the three next steps; if not, they can fix it in one tap.

#### Layout Structure
Three variants share one layout: status seal, title, one line of explanation, mini receipt, next-step block, actions.

- **Paid**:
  - A short scene band at the top with the star seal animating in.
  - Title: "مبروك! دعوتكم جاهزة".
  - Mini receipt (order code, plan, amount, date).
  - A "اللي جاي" block with 3 numbered steps: راجعوا التفاصيل, انشروا الدعوة, ابعتوها على واتساب.
  - Primary button "افتحوا لوحة التحكم". Secondary link "حمّلوا الإيصال" (when receipts exist; otherwise hidden, never "coming soon").
- **Pending (Fawry)**: warning seal (clock icon), the reference box and deadline repeated, the primary "ابعتوا الكود لواتساب", secondary "لوحة التحكم".
- **Failed**: error seal (cross icon), the reason in plain words if known, primary "جرّبوا تاني", secondary "اختاروا طريقة دفع تانية", WhatsApp help.

#### Color Tokens Used
| Element | Token |
|---|---|
| Paid seal | secondary ring on primary disc, star in secondary-soft |
| Pending seal | warning tint, warning icon |
| Failed seal | error tint, error icon |
| Receipt card | surface, border |
| Next steps | surface-alt, numbers in primary rings |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Title | h1 | 28px / 40px | 700 |
| Explanation | body-lg | 18px | 400 |
| Receipt rows | body | 16px | 400 / 600 for values |
| Steps | body | 16px | 400 |

#### Component Breakdown
- **Status Seal**: 96px, arch-framed, with an icon (never a text character).
- **Mini Receipt**: definition-list rows; the order code has a copy button.
- **Next Steps**: three items.
- **Actions**: one primary and up to two secondary.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | One column, centered text, full-width buttons. |
| tablet 640–1023px | Centered column, 560px. |
| desktop ≥ 1024px | Centered 640px. Next steps shown in 3 columns. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Paid page load | Seal scales from 80% to 100% with a gold ring drawing around it; 12 tiny gold sparkles drift once | 1200ms | ceremony |
| Failed or pending load | Seal fades in | 250ms | ease-out |

With reduced motion: the seal appears without scaling, and no sparkles.

#### Accessibility Notes
- The title carries the status in words. The seal is decorative.
- Focus starts at the h1 on load so screen-reader users hear the outcome first.
- Contrast: success and error texts on their tints are above 6:1.

#### Platform-Specific Notes
**Web:**
- Landmarks: main only (minimal header).
- If the status is still "processing" on load, show the pay page's waiting state, then update in place.

---

### Screen: Dashboard Sign-in

**Route / Path:** `/[locale]/app` (shown when no session)
**Platform:** Web
**Auth required:** No

#### Purpose & User Goal
The couple returns to their invitation by verifying the phone number they paid with.

#### Layout Structure
A split view on desktop: the scene panel on the start side (40%) with a phone mockup of a sample invitation and the line "كل الردود في مكان واحد", and the form on the end side. On mobile, a short 160px scene band, then the form card.

Form contents: title "أهلًا بعودتكم", one line, phone field with "+20" prefix, "إرسال الكود", then the 6-box code input. Below: "لسه معندكوش دعوة؟ شوفوا التصاميم".

#### Color Tokens Used
| Element | Token |
|---|---|
| Scene panel | primary scene treatment |
| Form card | surface, border |
| Button | primary |
| Errors | error |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Title | h1 | 28px / 32px | 700 |
| Labels | label | 14px | 600 |
| Code digits | h2 | 24px | 700 |

#### Component Breakdown
- Phone Field, Code Input and Pay-style async Button, all as in Checkout.
- Error states: "الرقم ده مش مسجل عندنا" (with a link to designs), wrong code, too many attempts (with a countdown).

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Scene band, then a full-width form. |
| tablet 640–1023px | Centered card at 480px over a full scene background. |
| desktop ≥ 1024px | Split 40 / 60. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Code panel reveal | Height expand + fade | 250ms | ease-out |

With reduced motion: instant reveal.

#### Accessibility Notes
- Same code-input rules as Checkout.
- The language toggle is available in the header.

#### Platform-Specific Notes
**Web:**
- Landmarks: header, main.
- After verification, the user lands on Dashboard Home, or on the page they originally requested.

---

### Screen: Dashboard Home

**Route / Path:** `/[locale]/app`
**Platform:** Web
**Auth required:** Yes

#### Purpose & User Goal
The couple sees at a glance the state of their invitation, who is coming, and the one thing they should do next.

#### Layout Structure
- **Greeting row** (small, not a slab): "مساء الخير، أحمد & منى" in h1, plus a small countdown chip "باقي 23 يوم على الفرح".
- **Invitation Hero Card** (one per invitation; most couples have exactly one):
  - Start side: an arched live thumbnail (poster still with their names).
  - End side: status badge (Draft, Published, Expired); design name; event date; **one contextual primary action**:
    - draft: "راجعوا وانشروا الدعوة";
    - published with 0 replies: "ابعتوها على واتساب";
    - published with replies: "شوفوا الردود";
    - expiring within 14 days: "مدّوا المدة".
  - Secondary text links: "معاينة", "نسخ الرابط".
- **Stats row** (4 tiles): attending guests, replies, edits left (x of y), days online left. Each tile has a label, a big number and, where relevant, an honest progress bar.
- **Latest replies**: the last 3 RSVPs as rows (name, attending or declined, guests count, time), with "كل الضيوف" as a link.
- **Latest wishes**: the last 2 guestbook messages (Premium only; otherwise this block is hidden).
- **Quiet upsell row** (at the bottom): "زودوا تعديلات" and "مدّوا المدة" as outline buttons, shown only when edits are 3 or fewer, or fewer than 30 days are left.
- **Points chip** in the greeting row ("✦ 250 نقطة — فضي"), linking to Points. It is no longer a large card.

```
MOBILE
┌──────────────────────────────┐
│ ✶ دعوتي                 (أم)  │ top bar 56px
├──────────────────────────────┤
│ مساء الخير، أحمد & منى         │ h1 28px
│ [باقي 23 يوم]  [✦ 250 نقطة]     │ chips
│ ┌──────────────────────────┐ │
│ │ ╭────╮ ● منشورة             │ │
│ │ │thumb│ مشربية · 15 أبريل    │ │ invitation hero card
│ │ ╰────╯ [ابعتوها على واتساب] │ │
│ │        معاينة · نسخ الرابط   │ │
│ └──────────────────────────┘ │
│ ┌─────────┐ ┌─────────┐      │
│ │ 128 جاي  │ │ 46 رد    │      │ stats 2×2
│ ├─────────┤ ├─────────┤      │
│ │ 12/15 ✎ │ │ 160 يوم  │      │
│ └─────────┘ └─────────┘      │
│ آخر الردود            كل الضيوف ‹ │
│ • منى سامي — جاية · 2      │
│ ...                          │
├──────────────────────────────┤
│ الرئيسية · الضيوف · الطلبات · الحساب │ tab bar 64px (icon + label)
└──────────────────────────────┘
```

#### Color Tokens Used
| Element | Token |
|---|---|
| Page background | background |
| Invitation hero card | surface, border, level 1; thumbnail frame in primary |
| Status: draft / published / expired | warning tint / success tint / surface-sunken with muted text |
| Stat tiles | surface, border; numbers in primary-hover; progress fill primary (edits) and secondary-strong (days) on surface-sunken track |
| Countdown and points chips | surface-alt, secondary-strong text |
| Tab bar / rail | surface; active item in primary with a surface-alt pill behind |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Greeting | h1 | 28px / 32px | 700 |
| Card couple names | h2 | 24px | 700 |
| Card meta | body | 16px | 400 |
| Stat numbers | stat | 32px / 40px | 700 |
| Stat labels | caption | 13px | 400 |
| Reply rows | body | 16px | 400 |
| Tab labels | caption | 13px | 600 |

#### Component Breakdown
- **Invitation Hero Card**: states draft, published, expired (the thumbnail is greyed to 60% and the action becomes "جدّدوا الدعوة"), and loading skeleton.
- **Stat Tile**: states normal; low (edits 3 or fewer, or days 14 or fewer: warning tint background and a one-line hint); unlimited (RSVP for Premium shows "∞ بلا حد").
- **Honest Progress Bar**: the fill always equals the real proportion. For days-online, the fill shows days remaining out of the plan's total days. Before publishing, it shows "تبدأ عند النشر" with no bar.
- **Reply Row**: avatar initial circle, name, response badge, guests count, relative time.
- **Invitation Switcher** (more than one invitation): a dropdown in the top bar listing couple names and dates. On the home page, multiple invitations show as stacked hero cards.
- **Empty state** (no invitations): as in 2.5, with three design thumbnails.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Single column. Stats 2 × 2. Bottom tab bar. |
| tablet 640–1023px | Hero card horizontal with a larger thumbnail. Stats in 4 columns. Bottom tab bar. |
| desktop ≥ 1024px | Start rail navigation. Content 1040px: hero card spans the full width; below it, stats in 4 columns; then a two-column row with Latest replies (7 columns) and Latest wishes (5 columns). |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Page enter | Content fades + rises 8px | 250ms | ease-out |
| Stat numbers on first load | Count up from 0 | 600ms | ease-out |
| Tab change | Instant page swap; active pill slides | 250ms | ease-out |

With reduced motion: no count-up; the pill moves instantly.

#### Accessibility Notes
- Stats are a labeled list ("ملخص الدعوة"), and each tile reads "128 attending guests".
- Progress bars expose their real value and maximum.
- The tab bar is a nav with the current page marked. Icons have visible labels, so no extra labels are needed.
- Focus order: top bar, h1, chips, hero card action, secondary links, stats, replies, tab bar.

#### Platform-Specific Notes
**Web:**
- Landmarks: header (top bar), nav (tab bar or rail), main.
- Data is server-rendered so the first paint has numbers. Replies refresh when the page regains focus.

---

### Screen: Invitation Manage (Overview and Edit)

**Route / Path:** `/[locale]/app/invitations/[id]`
**Platform:** Web
**Auth required:** Yes

#### Purpose & User Goal
The couple reviews and edits their invitation's details, publishes it, and shares it, guided by a clear three-stage path.

#### Layout Structure
- **Sub-navigation tabs** (sticky under the top bar): نظرة عامة (Overview), الضيوف (Guests), الرسائل (Wishes; Premium only), الإعدادات (Settings).
- **Header**: couple names in h1, design name, date, status badge, and a "معاينة" button that opens the live invitation in a new tab.
- **Progress path** ("Journey"): three connected steps, (1) راجعوا التفاصيل, (2) انشروا, (3) شاركوا. The current stage is highlighted and done stages are checked. The block below it changes with the stage.
- **Stage blocks**:
  - **Details (edit)**: a read view of names, date, time, venue name, map link, and welcome message, each with a pencil. Editing opens a side sheet (desktop) or a bottom sheet (mobile) with the field and a live mini preview. Saving shows "هيستخدم تعديل واحد من 15" with confirm and cancel. After saving, a toast confirms and the edits counter decrements. When 0 edits are left, the pencils disable with the hint "خلصت التعديلات — زودوا تعديلات".
  - **Publish**: a card with the design thumbnail and the publish button. If publishing is blocked, the reason appears as a warning-tint line with the fix action. After publishing, a success line shows "أونلاين لحد 15 أكتوبر 2027".
  - **Share**:
    - The invitation link in a left-to-right box with a copy button.
    - A WhatsApp share button (large, primary, with the WhatsApp icon) and a prefilled message preview the couple can edit before sending.
    - The QR code (200px) with "تحميل QR" (image) and "تحميل للطباعة" (high-resolution) buttons.
- **Meters**: edits left and days online, honest bars, with the add-on links next to each bar ("زودوا" / "مدّوا").

```
DESKTOP
┌ rail ┬──────────────────────────────────────────────────┐
│      │ [نظرة عامة] [الضيوف] [الرسائل] [الإعدادات]          │
│      │ أحمد & منى  ● منشورة   مشربية · 15 أبريل  [معاينة ↗] │
│      │ ①──✓──②──✓──③ شاركوا                              │
│      │ ┌──────────── Share ─────────────┐ ┌── QR ──┐     │
│      │ │ link [copy]  [WhatsApp ■■■■]    │ │ ▦▦▦▦  │     │
│      │ │ message preview (editable)      │ │[تحميل]│     │
│      │ └─────────────────────────────────┘ └───────┘     │
│      │ Details (read view with ✎)        Meters          │
└──────┴──────────────────────────────────────────────────┘
```

#### Color Tokens Used
| Element | Token |
|---|---|
| Tabs | surface-sunken track; active tab surface with primary text |
| Journey steps | done: success; current: primary; upcoming: sand ring with muted text |
| Edit sheet | surface, radius-xl, level 2 |
| Edit confirm notice | warning tint |
| WhatsApp button | primary with on-primary text (the WhatsApp brand green is not used, to keep palette discipline; the WhatsApp icon carries recognition) |
| Link box | surface-alt, left-to-right text in primary-hover |
| QR | primary on white |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Couple names | h1 | 28px / 32px | 700 |
| Journey labels | label | 14px | 600 |
| Block titles | h2 | 24px | 700 |
| Detail labels | caption | 13px | 600 |
| Detail values | body | 16px | 400 |
| Link | body | 16px, truncated in the middle; the full link is copied | 400 |

#### Component Breakdown
- **Sub-nav Tabs**: 44px tall, scrolling within their own track only if a fourth tab does not fit.
- **Journey Path**: three nodes joined by a line; it mirrors in RTL so that progress runs right to left in Arabic.
- **Detail Row**: label, value, pencil button (labeled "تعديل {field}"). States: view, disabled (no edits left), recently updated (success tint for 3s).
- **Edit Sheet**: field(s), a live mini preview, a cost notice, Save (primary) and Cancel. States: idle, saving, error (inline), success (closes plus toast).
- **Publish Card**: states ready, blocked (with reason and fix link), publishing (spinner), published.
- **Share Card**: copy button (label swaps to "اتنسخ ✓"), editable WhatsApp message, QR downloads.
- **Meters**: as in Dashboard Home.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Single column in the order: tabs, header, journey, current-stage block, meters, details. The QR sits under the link block at 180px. Edit uses a bottom sheet up to 90% of the screen height. |
| tablet 640–1023px | Share block in two columns (link and WhatsApp; QR). |
| desktop ≥ 1024px | Two-column content: the main stage block (8 columns) and a side column (4 columns) with meters and QR. Edit uses a side sheet 420px wide from the end side. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Journey stage completes | Line fills to the next node; node gets a check | 400ms | slow |
| Sheet open and close | Slide from bottom (mobile) or end side (desktop) | 400ms | slow |
| Publish success | Small seal pulse on the status badge | 900ms | ceremony |
| Copy | Label swap | 150ms | ease-out |

With reduced motion: no fills or pulses; state changes are instant.

#### Accessibility Notes
- Tabs are links with the current page marked (each is a real page, not a script-only tab).
- The journey is an ordered list with "completed", "current" and "upcoming" stated in text.
- The edit sheet is a modal dialog. The cost notice is read before the Save button.
- The QR has the alt text "QR code for your invitation link", and the link itself is always shown as text too.

#### Platform-Specific Notes
**Web:**
- Landmarks: header, nav (sub-tabs), main, complementary (side column).
- The "معاينة" button opens a new tab and says so ("opens in a new tab").

---

### Screen: Guests

**Route / Path:** `/[locale]/app/invitations/[id]/guests`
**Platform:** Web
**Auth required:** Yes

#### Purpose & User Goal
The couple knows exactly who is coming and how many seats they need, can find any guest in seconds, and can follow up.

#### Layout Structure
- Sub-navigation tabs (Guests active).
- **Stats** (4 tiles): attending guests (seats), replies attending, declined, remaining capacity (or "بلا حد").
- **Toolbar**: search field (name or phone); filter chips (الكل · 128, جايين · 116, مش جايين · 12); a sort menu (newest, name); export (a CSV download for Excel).
- **List**:
  - On mobile and tablet: cards with name, response badge, seat count, phone (left-to-right, tap to call), note (two lines, expandable) and a time-ago label. Row actions: WhatsApp, copy phone.
  - On desktop: a table with columns name, response, seats, phone, note, date, actions.
- Pagination: "عرض المزيد" (show 50 more), not page numbers.
- **Wishes** move to their own tab (the Messages screen below shares this layout pattern). It shows the guestbook cards newest first, with a "hide from invitation" action if moderation exists; otherwise a read-only list.

#### Color Tokens Used
| Element | Token |
|---|---|
| Stat tiles | as in Dashboard Home |
| Chips | surface or primary-selected |
| Attending badge | success tint, success text |
| Declined badge | surface-sunken, ink text (neutral, not alarming red) |
| Table header | surface-alt, muted label text |
| Row hover | surface-alt |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Page title | h1 | 28px | 700 |
| Stat numbers | stat | 32px | 700 |
| Guest name | label | 16px | 600 |
| Meta (phone, time) | caption | 13px | 400 |
| Note | body | 16px | 400 |

#### Component Breakdown
- **Search Field**: icon at the start, a clear button when filled, results filter as you type (200ms debounce), and a results count announced.
- **Filter Chips**: single select with counts.
- **Guest Card / Row**: states default, expanded note, new (a small dot if it arrived since the last visit).
- **Export Button**: secondary with a download icon; while preparing, it shows a spinner.
- **WhatsApp Follow-up**: opens WhatsApp with a polite prefilled message to that guest.
- **Empty and filtered-empty states**: per 2.5.
- **Capacity Warning**: when remaining capacity is 20 or fewer, a warning-tint banner appears above the list ("قرّبتوا توصلوا للحد — 18 مكان فاضل") with an upgrade link.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Stats 2 × 2; toolbar stacks (search full width, then a chip row, then sort and export as icon buttons with labels); card list. |
| tablet 640–1023px | Stats in 4 columns; cards in 2 columns. |
| desktop ≥ 1024px | Stats in 4 columns; toolbar in one row; full table with a sticky header row. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Filter or search change | List cross-fade | 150ms | ease-out |
| Note expand | Height expand | 250ms | ease-out |

With reduced motion: instant.

#### Accessibility Notes
- On desktop, a true table with column headers. On mobile, each card is a list item whose heading is the guest name, with labeled values.
- Response is conveyed by text in the badge ("جاي" / "مش جاي"), not color alone.
- The result count is announced after filtering ("116 ضيف").
- Phone numbers are left-to-right isolated, and the call link is labeled "اتصل بـ {name}".

#### Platform-Specific Notes
**Web:**
- Landmarks: nav (sub-tabs), main (stats region, search region, list).
- The export downloads directly with no new page.

---

### Screen: Orders

**Route / Path:** `/[locale]/app/orders`
**Platform:** Web
**Auth required:** Yes

#### Purpose & User Goal
The couple checks what they paid, finishes any pending Fawry payment, and gets a receipt.

#### Layout Structure
- Page title and one line.
- **Pending first**: any order awaiting Fawry payment appears on top as a warning-tint card with the reference, deadline, copy, and "ادفعوا دلوقتي" guidance.
- **Orders list**: each card's title is human-readable ("دعوة مشربية — الباقة الأساسية", "+10 تعديلات"), with a status badge, amount, date, payment method, a short order code with copy, and "الإيصال" (download) when available. When no receipt exists, the row is hidden; "coming soon" is never shown.

#### Color Tokens Used
| Element | Token |
|---|---|
| Cards | surface, border |
| Paid / pending / failed badges | success / warning / error tints |
| Pending card | warning tint background, warning border |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Title | h1 | 28px | 700 |
| Order title | h3 | 20px | 700 |
| Amount | h3 | 20px, tabular | 700 |
| Detail rows | body | 16px | 400 |

#### Component Breakdown
- **Order Card**: states paid, pending, failed (with a "جرّبوا تاني" action), expired (muted with "انتهت صلاحية الطلب").
- **Copy Code** button.
- **Empty state**: as in 2.5.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | One column of cards. |
| tablet 640–1023px | Two columns. |
| desktop ≥ 1024px | A table-like list (one row per order: title, date, method, amount, status, actions) at full content width. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Page enter | Fade + rise 8px | 250ms | ease-out |

With reduced motion: none.

#### Accessibility Notes
- Each order is an article with a heading. Status is conveyed in text.
- The amount is read with its currency.

#### Platform-Specific Notes
**Web:**
- Landmarks: main.
- Receipts download as a file; the link states the file type.

---

### Screen: Points

**Route / Path:** `/[locale]/app/points`
**Platform:** Web
**Auth required:** Yes

#### Purpose & User Goal
The couple understands what their points are worth in pounds, how to use them, and what their level unlocks.

#### Layout Structure
- **Balance card** (scene treatment, compact, 200px tall): the balance, with "= 125 ج.م خصم" right beside it in secondary-soft; level badge; progress to the next level ("اشتروا مرة كمان وتوصلوا للذهبي").
- **How it works**: 3 short rules as icon rows: earn, redeem at checkout (with the maximum), expiry.
- **History**: a ledger list (reason, date, amount in green plus or neutral minus, expiry date).

#### Color Tokens Used
| Element | Token |
|---|---|
| Balance card | primary scene; number in secondary-soft; text in on-primary and mint |
| Level badge (bronze, silver, gold) | surface-alt with secondary-strong; silver uses surface-sunken with ink; gold uses secondary-soft with secondary-strong |
| Ledger plus / minus | success text / ink |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Balance | stat | 40px | 700 |
| EGP equivalent | body-lg | 18px | 600 |
| Rules | body | 16px | 400 |
| Ledger rows | body / caption | 16px / 13px | 400 |

#### Component Breakdown
- **Balance Card**, **Level Progress** (honest bar), **Rule Rows**, **Ledger Row** (states earned, redeemed, expiring soon in warning, expired in muted with strikethrough).

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Stacked. |
| tablet 640–1023px | The balance card splits into two halves (balance; level). |
| desktop ≥ 1024px | Balance card and rules side by side (7 / 5 columns); ledger full width. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Load | Balance counts up | 600ms | ease-out |

With reduced motion: static.

#### Accessibility Notes
- The balance is read as "250 points, worth 125 Egyptian pounds".
- The level progress bar exposes its value.
- Contrast on the scene card meets 12:1 or more.

#### Platform-Specific Notes
**Web:**
- Landmarks: main.
- Reached from the points chip on Home and from Account (no longer a bottom tab).

---

### Screen: Account

**Route / Path:** `/[locale]/app/account`
**Platform:** Web
**Auth required:** Yes

#### Purpose & User Goal
The couple checks their verified phone, changes the language, finds their points, gets help, and signs out.

#### Layout Structure
A settings list grouped in cards:
1. **Profile**: verified phone (left-to-right, with a check), and the couple names on the latest invitation.
2. **Preferences**: language (segmented AR | EN).
3. **Rewards**: points balance and level, linking to Points.
4. **Help**: WhatsApp support, FAQ, terms, privacy.
5. **Session**: Sign out (secondary). "حذف الحساب" is a quiet text link at the very bottom that opens a confirm dialog explaining what is deleted. If deletion is not supported yet, the link is **hidden**, not shown disabled.

#### Color Tokens Used
| Element | Token |
|---|---|
| Group cards | surface, border |
| Row dividers | sand |
| Sign out | secondary (outline) button |
| Delete link | error text |

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Title | h1 | 28px | 700 |
| Group titles | label | 14px, secondary-strong | 600 |
| Row label / value | body | 16px | 400 / 600 |

#### Component Breakdown
- **Settings Row**: label, value, chevron (mirrored in RTL) when it navigates. Minimum height 56px.
- **Language Segmented Control**.
- **Confirm Dialog** for deletion.

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Full-width cards stacked. |
| tablet 640–1023px | Cards at 600px, centered. |
| desktop ≥ 1024px | Cards at 640px, aligned to the start of the content area. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Language switch | Page reloads in the new direction with a 150ms fade | 150ms | ease-out |

With reduced motion: no fade.

#### Accessibility Notes
- Groups are sections with headings.
- The segmented control is a radio group labeled "اللغة".
- The dialog traps focus, and Cancel is the default focused button.

#### Platform-Specific Notes
**Web:**
- Landmarks: main.
- Sign out also sits in the desktop rail and the mobile avatar menu.

---

### Screen: Public Invitation — RSVP and Guestbook Area

**Route / Path:** `/[locale]/i/[slug]`
**Platform:** Web
**Auth required:** No (guests)

#### Purpose & User Goal
A guest who opened the link from WhatsApp tells the couple in under 30 seconds whether they are coming and with how many people, and optionally leaves a wish, then feels sure it was received.

#### Layout Structure
The invitation's visual design (colors, fonts, art) belongs to each template. This spec covers **structure and behavior** that every template must honor, with platform tokens used only for feedback colors where the template gives none.

- **RSVP section**:
  - Title and subtitle (from the template), then the "Will you attend?" choice as **two large cards** side by side ("هحضر بإذن الله" / "مش هقدر أحضر"), each at least 64px tall with an icon.
  - Once a choice is made, the rest of the form reveals: name; number of guests as a stepper (− 1 +, range 1–8, hidden when declining); event checkboxes if the invitation has several events; an optional phone; an optional note.
  - Submit button: full width, in the template's accent.
- **Success**: the form is **replaced** by a thank-you card in the same space, with:
  - the template's seal or ornament;
  - "وصلنا ردك يا {name}" (no emoji; the template seal carries the warmth) and "مستنيينك يوم 15 أبريل";
  - "أضف للتقويم" (calendar file) and "افتح الخريطة";
  - "تعديل الرد" (reopens the form with the previous answers prefilled);
  - for a declining guest: "شكرًا إنك عرّفتنا" and a link to leave a wish.
- **Errors**: inline under the relevant field (name required; choose at least one event). A failed submit shows an error panel above the button with "حاول تاني" and keeps all input. "Limit reached" shows a neutral panel explaining the couple's guest limit is full, with "ابعت رسالة للعروسين" if messages are enabled.
- **Guestbook (Premium)**:
  - A short form (name, message up to 300 characters with a counter, send).
  - Below it, a list of wishes as cards (name, message, relative date), newest first, 5 shown and then "عرض المزيد".
  - After sending, the guest's own wish appears at the top with a "تم الإرسال" label.
- **Expired invitation**: a full-screen scene with "الدعوة دي خلصت مدتها", a line of thanks, and no broken sections.

```
MOBILE (inside the template)
┌──────────────────────────────┐
│        تأكيد الحضور            │ template h2
│   نتشرف بتأكيد حضوركم قبل…    │
│ ┌────────────┐┌────────────┐ │
│ │  ✓ هحضر    ││ ✕ مش هقدر   │ │ 2 choice cards, 64px
│ └────────────┘└────────────┘ │
│ [الاسم                     ] │ revealed after choice
│ عدد الأشخاص   [ − ]  2  [ + ] │
│ [ملاحظة (اختياري)           ] │
│ [========= أرسل الرد =======] │ 52px
└──────────────────────────────┘
```

#### Color Tokens Used
| Element | Token |
|---|---|
| Section, inputs, buttons | **template-owned** (each template defines its own accent, ink and paper) |
| Selected choice card | template accent border at 2px plus a check, never color alone |
| Field error text | error, or the template's error if it is darker |
| Success card | template paper with template ornament; text in template ink |
| Limit-reached panel | info tint |

Every template must meet 4.5:1 for its form text and 3:1 for input borders against its section background. This is a template acceptance rule.

#### Typography
| Element | Style | Size | Weight |
|---|---|---|---|
| Section title | template h2 | at least 24px | template |
| Choice card label | label | 18px | 600 |
| Field labels | label | 16px | 600 |
| Inputs | body | 16px | 400 |
| Success title | template h2 | at least 24px | template |
| Wish text | body | 16px | 400 |

#### Component Breakdown
- **Attendance Choice Cards**: states unselected, hover, selected (check plus border), focus.
- **Guest Stepper**: − and + buttons 44px wide, a center number at 20px. − is disabled at 1 and + at the remaining capacity or 8, with a visible reason ("الحد المتاح 3").
- **Event Checkboxes**: 44px rows with the full label tappable.
- **Submit Button**: default, sending ("جارٍ الإرسال…"), disabled while sending.
- **Thank-you Card**: described above.
- **Error Panel**, **Limit Panel**.
- **Guestbook Form and Wish Card**.
- **Duplicate guard**: if this device already replied, the section opens on the thank-you card with "تعديل الرد".

#### Responsive / Adaptive Behavior
| Breakpoint | Layout change |
|---|---|
| mobile < 640px | Full width within the template's 16px padding; choice cards side by side (stacked if the labels exceed 2 lines). |
| tablet 640–1023px | The invitation column is capped at 480px and centered. |
| desktop ≥ 1024px | The same 480px column over the blurred scene backdrop. |

#### Animations & Transitions
| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Choice made | Rest of form expands | 250ms | ease-out |
| Submit success | Form fades out; thank-you card fades in with the seal settling (scale from 90% to 100%) | 600ms | ceremony |
| Wish posted | New card slides in at the top | 250ms | ease-out |

With reduced motion: the form appears fully expanded from the start, and success swaps instantly.

#### Accessibility Notes
- The choice cards are a radio group with a legend.
- The stepper is a labeled number control with announced value changes.
- On success, focus moves to the thank-you heading and the message is announced. On error, focus moves to the error panel.
- Hidden anti-spam fields stay hidden from assistive tech and keyboard.
- Names typed in another script are isolated.

#### Platform-Specific Notes
**Web:**
- Landmarks: main (the invitation), with RSVP and guestbook as labeled regions.
- The page loads fast on mid-range Android over 4G: posters first, video after interaction or idle.
- The calendar file and map open in the native apps.

---

## 4. Component Library Reference

Shared across screens. Each is defined once and reused.

| Component | Variants | States | Notes |
|---|---|---|---|
| **Button** | primary (green), gold (on dark scenes), secondary (outline green), ghost (sunken), text link, danger (outline error) | default, hover (darken or lighten 8%), pressed, focus ring, loading, disabled with reason | Height 48px (44px compact in tables), radius-md, label 16px / 600, icon 20px with an 8px gap. Directional icons mirror in RTL. Never fully rounded pills. |
| **Input** | text, phone (left-to-right with +20 chip), date (with friendly echo), textarea, search | default, focus, filled, error, disabled | Height 52px, radius-md, sand border, 16px text, label above, helper or error below. |
| **Code Input** | 6 boxes | empty, filling, complete, error | Paste and autofill support. |
| **Choice Card** | radio, checkbox | unselected, hover, selected, focus, disabled | Used for plans, payment methods, RSVP attendance. |
| **Chip** | filter, status, info | default, selected, focus | 40px tall, radius-sm. |
| **Badge** | success, warning, error, neutral, info, tier | static | Pill shape, 13px / 600, text plus color. |
| **Card** | default, featured (hairline gold frame), scene (deep green) | default, hover (web), focus within | radius-lg, 24px padding (16px on mobile). |
| **Design Card** | gallery, landing carousel, compact (checkout strip) | default, hover loop, loading skeleton | Arch-topped preview frame. |
| **Plan Card** | standard, recommended | default, hover, selected | See Pricing. |
| **Stat Tile** | normal, low, unlimited | loading skeleton | Big number plus label plus optional honest bar. |
| **Progress Bar** | edits, days, level | value-driven only | 8px tall, rounded ends, sunken track. |
| **Stepper (checkout)** | 3 steps | todo, current, done, locked | Mirrors in RTL. |
| **Journey Path** | 3 stages | done, current, upcoming | Dashboard invitation page. |
| **Sheet** | bottom (mobile), side (desktop) | opening, open, closing | radius-xl, backdrop at 40%, drag handle on mobile. |
| **Dialog** | confirm, destructive | open | Focus trap; Escape closes. |
| **Toast** | success, info | showing for 4s | Polite announcement. |
| **Empty State** | per screen (2.5) | static | Arch illustration, title, one line, one action. |
| **Marketing Header and Footer** | transparent-over-scene, solid | scrolled, menu open | One component for all public pages. |
| **Dashboard Top Bar, Tab Bar, Rail** | mobile, desktop | active item | 4 tabs on mobile. |
| **Phone Mockup** | hero, sign-in, demo panel | poster, playing, reduced motion | Fixed 9 : 19.5 ratio, gold border, level-3 shadow. |
| **Scene Background** | full hero, compact band, side panel | static or ambient glow | See 1.1. |
| **Ornament** | star seal, gold hairline divider, 6px diamond bullet | static | Usage limits in 1.6. |
| **Language Toggle** | segmented AR / EN | current | Switching keeps the same page. |
| **Copy Field** | link, code, reference | default, copied | Left-to-right box plus copy button plus toast. |

---

## 5. Platform-Specific Notes

### 5.1 Flutter
Not in scope. The product is web-only.

### 5.2 React / Next.js (Web)
- **Server-first rendering**: every marketing and dashboard page shows its real content (headline, prices, poster stills, stats) on first paint. Motion and video are enhancements that arrive afterwards without moving the layout.
- **Direction**: the whole layout mirrors in Arabic. Spacing, alignment, icons with direction, step progress, carousels and sheets (side sheets come from the end side) all follow reading direction. Numbers, phone numbers, URLs and codes stay left-to-right inside right-to-left text.
- **Fonts**: four families total (Amiri, Cormorant Garamond, IBM Plex Sans Arabic, Aref Ruqaa), with only the weights listed in 1.2. Fallback fonts are size-matched so text does not jump when the web fonts load.
- **Media budget**: the hero poster is under 120KB. Hero videos start loading only after first paint; on slow connections or with data saver on, the poster stays and the video is skipped.
- **Hover**: hover effects apply only on devices with a fine pointer. Touch devices use pressed states.
- **One design language**: the older visual system (geometric sans for Arabic headings, pill buttons, cream background, glyph icons) is fully retired, and every page uses the tokens in section 1.

### 5.3 React Native
Not in scope.

---

## 6. Implementation Checklist

Ordered by impact. Tick off each line when it matches this spec at 390px and 1440px in both Arabic and English.

**Phase A: Foundation and first impression**
- [ ] Single token set (1.1–1.7) applied to every page; old cream, pill and geometric-sans system removed from gallery, checkout and dashboard.
- [ ] Arabic headings in Amiri, body in IBM Plex Sans Arabic, names in Ruqaa only; English headings in Cormorant.
- [ ] Gold (secondary) never used as text on light backgrounds; muted never used on sand.
- [ ] One outline icon family replaces every text-glyph icon; directional icons mirror in RTL.
- [ ] Star ornament limited to logo, seals and one divider per section; diamond bullets and check icons elsewhere.
- [ ] Shared marketing header (56px single row with menu sheet on mobile) and shared footer on landing, pricing and gallery.
- [ ] Landing hero rebuilt as a full-bleed candlelit scene; phone visible and playing above the fold at 390 × 844.
- [ ] Hero intro autoplays once in view; poster with names under reduced motion.
- [ ] Combined names field with one primary action; "see full demo" demoted to a text link.
- [ ] Conversion bridge appears after names are typed and carries names and date into checkout.
- [ ] Sticky mobile CTA appears only after the hero leaves view; hidden over the footer.

**Phase B: Path to purchase**
- [ ] Template demo page has the floating Demo Bar (mobile) or side panel (desktop) with "Use this design" and "Try with your names".
- [ ] Demo Bar collapses when the RSVP section is in view and never covers the RSVP submit button.
- [ ] Gallery and landing design cards show arch-framed poster previews with in-view silent loops; no empty "coming soon" cards.
- [ ] Gallery filter chips (style, video, music) shown only when they match designs.
- [ ] Checkout uses three sequential steps (details, then plan, then verify and pay), one open at a time, with done-step summaries.
- [ ] Checkout design strip shows the chosen design with live names and date.
- [ ] Mobile checkout has a sticky total bar with a step-aware button; desktop has a sticky summary.
- [ ] Coupon hidden behind "Have a code?" and never pre-filled.
- [ ] Phone verification uses the +20 chip, a 6-box code, a resend countdown, and a verified collapse.
- [ ] Payment method cards and a trust line (secure, refund, WhatsApp) next to the pay button.
- [ ] Friendly date echo under every date field.
- [ ] Pay page shows a short order code, the Fawry reference with copy and deadline, and the demo controls in a labeled panel.
- [ ] Result page variants: paid (celebration seal plus 3 next steps), pending, failed (retry plus change method).
- [ ] Pricing page: Arabic plan names, recommended plan emphasized (green card), trust row, always-open comparison, mobile plan switcher.

**Phase C: Dashboard as a control room**
- [ ] Dashboard sign-in with a scene panel and the shared code input.
- [ ] Mobile tab bar: Home, Guests, Orders, Account; desktop rail with sign out.
- [ ] Home greeting row with countdown and points chips (the large welcome slab is removed).
- [ ] Invitation Hero Card with one contextual primary action per status.
- [ ] Stat tiles with honest progress bars (the fixed 70% days bar is removed).
- [ ] Latest replies and latest wishes blocks on Home.
- [ ] Upsells (edits, extension) shown only when edits are low or time is short.
- [ ] Invitation page: sub-tabs, Journey path, editable detail rows with a cost-confirm sheet, publish card with blocked reasons, share card with editable WhatsApp message and QR downloads.
- [ ] Guests page: search, filter chips with counts, sort, export, cards on mobile and table on desktop, capacity warning.
- [ ] Wishes moved to their own tab.
- [ ] Orders: human-readable titles, pending-first, short codes, receipts only when available.
- [ ] Points: balance with EGP equivalent, level progress, rules, ledger states.
- [ ] Account: grouped settings, language control, help links, sign out; delete hidden until supported.

**Phase D: Guest experience**
- [ ] RSVP attendance as two large choice cards; the form reveals after the choice.
- [ ] Guest stepper with visible limits and reasons.
- [ ] Inline field errors; error panel on failed submit that keeps input.
- [ ] Thank-you card replaces the form, with add-to-calendar, map and edit-reply actions; the device remembers the reply.
- [ ] Limit-reached panel in neutral info styling.
- [ ] Guestbook form with counter and newest-first wish cards.
- [ ] Expired invitation scene page.
- [ ] Every template passes the 4.5:1 form text and 3:1 input border rule.

**Phase E: Copy and polish**
- [ ] One copy register chosen by the owner (recommended: warm, light Egyptian Arabic across marketing, checkout and dashboard; formal Arabic only in legal text). No transliterated English plan names; no Latin uppercase badges on Arabic pages.
- [ ] Landing reduced to 7 sections; mobile page height about 6,000px or less.
- [ ] All animations have reduced-motion alternatives verified.
- [ ] Keyboard pass on every screen: visible focus, logical order, dialogs trap and return focus.
- [ ] Screen-reader pass in Arabic: headings, landmarks, live announcements for copy, save, RSVP and payment status.
- [ ] No horizontal page scroll at 360px, 390px and 430px; text at 200% zoom still usable.
