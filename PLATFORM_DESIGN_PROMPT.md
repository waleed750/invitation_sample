# Design prompt: Arabic-first digital invitation platform

How to use this file:
- **Figma Make / Lovable:** paste PART A, then PART B, in the first message. After it generates, send each screen prompt in PART C one at a time ("Now build X").
- **Google Stitch:** it works best per screen. Paste PART A (shortened if needed) plus ONE screen from PART C at a time.
- Replace `[BRAND]` with your brand name once you have it. Until then use the placeholder.

---

## PART A: Product and brand (paste first)

Design a complete, production-quality web platform called **[BRAND]**: an Arabic-first (with full English) platform where couples and hosts in Egypt buy beautiful animated digital invitations (weddings, engagements, save-the-dates, birthdays, baby announcements), edit them from their phone, share them on WhatsApp, and collect RSVPs. There are four areas: a **public marketing site**, the **guest-facing invitation** itself, a **customer dashboard**, and an **admin dashboard**.

**Audience:** Egyptian couples aged 22–35, mostly on a phone, mostly on WhatsApp. Customers pay once per event (not a subscription). Guests open the invitation from a WhatsApp link and RSVP without an account.

**Brand feel:** warm, premium, romantic, and modern. Not a generic SaaS look, and not default shadcn/Material. Think luxury stationery meets a polished mobile app.
- Palette: cream / ivory background (`#FAF6EE`), deep green primary (`#1F3D33`), antique gold accent (`#B8924A`), soft blush secondary (`#EAD9D0`), ink text (`#1E1E1C`). Success `#3E7D5A`, warning `#C98A2B`, error `#B5473A`. Provide a matching dark mode for the dashboards only (the public site and invitations stay light).
- Typography: **Arabic:** Cairo or Tajawal for UI, Amiri for elegant display headings. **English:** Cormorant Garamond for display, Inter for UI. Generous line height for Arabic (1.7+).
- Shape and depth: 16px card radius, 12px for inputs/buttons, soft layered shadows, thin gold hairline dividers, subtle paper-grain texture on hero areas. Tasteful floral / botanical line ornaments, used sparingly.
- Motion: gentle fades and rises on scroll, a refined envelope or curtain opening on the invitation intro. Respect `prefers-reduced-motion`.
- Voice: friendly, short sentences, never corporate.

**Non-negotiable rules for every screen**
1. **Mobile-first.** Design 390px wide first, then 768px and 1280px. Tap targets are at least 44px. No horizontal scroll.
2. **Arabic is the default and is true RTL**, not a mirrored afterthought. Use logical layout (start/end, not left/right). Chevrons, arrows, progress bars and steppers flip in RTL. Logos, photos, videos and QR codes do not flip.
3. **Show every screen in both Arabic (RTL) and English (LTR).** Provide a language switch (العربية | English) always visible in the header.
4. Numbers use Western digits (0–9) in both languages. Prices read `1,299 ج.م` in Arabic and `EGP 1,299` in English. Phone numbers, emails and codes stay left-to-right inside Arabic sentences.
5. Accessibility: WCAG AA contrast, visible focus rings, labels on every field, clear error text.
6. Use realistic Egyptian sample content (names like "أحمد & منى" / "Ahmed & Mona", venues in Cairo, Alexandria and the North Coast, `+20 10…` phone numbers, prices in EGP). No lorem ipsum.
7. Build a small **design system first:** color and type tokens, buttons (primary, secondary, ghost, danger), inputs, selects, toggles, chips, cards, badges, modals, toasts, tables, empty states, skeleton loaders, and a language switch. Reuse it everywhere.

---

## PART B: Site map (paste second)

```
PUBLIC            /                 Landing
                  /templates        Gallery with filters
                  /templates/:slug  Live demo + "Use this template"
                  /pricing          Tiers + add-ons + FAQ
                  /terms /privacy /refund   Legal pages
CHECKOUT          Quick setup -> live preview of THEIR names -> Pay (sign-in via OTP inside checkout)
GUEST             /i/:slug          The invitation itself (+ "invitation ended" page)
CUSTOMER  /app    My invitations, Editor, Guests, Messages, Share, Billing, Account (points), Settings
PRIVATE LINK      /edit/:token      Editor for one invitation, no account
ADMIN     /admin  Overview, Customers, Orders, Templates manager, Affiliates, Abuse/Ops
```

Core customer journey: Gallery -> Live demo -> "Use this template" -> Quick setup (names, date, venue) -> instant preview with their own names -> Pay (phone or email OTP happens inside checkout, no separate sign-up page) -> Editor -> Publish -> Share on WhatsApp.

---

## PART C: Screen-by-screen prompts (send one at a time)

### C1. Public landing page
Full-width hero with a looping phone mockup showing an invitation opening (envelope animation). Arabic headline about creating a wedding invitation in minutes and sharing it on WhatsApp, a primary CTA "اختر تصميمك / Choose your design", and a secondary "شاهد مثال / See a demo". Sections: how it works in 3 steps (choose, add your details, share on WhatsApp); a horizontally scrolling template showcase with phone frames; feature grid (RSVP tracking, WhatsApp sharing, music and video intro, Arabic and English, map and calendar); pricing preview with 3 tiers; testimonials with couple photos; FAQ accordion; final CTA band; footer with legal links, language switch and social icons. A sticky mobile bottom bar with the main CTA.

### C2. Template gallery
Grid of template cards, each showing a phone-framed preview, name (AR/EN), style tag, a "premium" badge where relevant, and a hover or tap "Preview" action. Filter bar (chips on mobile in a bottom sheet): event type (wedding, engagement, save-the-date, birthday, baby), style (floral, minimal, luxury, boho, safari, modern), language, tier, price. Sort dropdown. Empty state and loading skeletons.

### C3. Template live-demo page
A large live preview in a phone frame on desktop (full-screen on mobile), with a floating bar: template name, tier badge, price "from 499 ج.م", a language toggle for the demo (AR / EN), and a primary "استخدم هذا التصميم / Use this template" button. Below: what is included, sections list, and similar templates.

### C4. Quick setup, instant preview, and checkout
Three steps with a stepper that flips in RTL:
1. **Quick setup:** three fields only (names, event date, venue) with date picker and venue search. A live phone preview next to the form shows THEIR names in the template as they type (stacked below on mobile).
2. **Choose plan:** the 3 tiers as selectable cards (Save the Date 499, Classic 1,299 recommended, Premium 2,499), with a list of what each includes (published edits, months online, RSVP limit) and optional add-ons (custom subdomain, bilingual AR+EN, done-for-you setup, AI reel). Promo / affiliate code field and a points-redemption toggle, with a visible "max 30% off" note and a price breakdown.
3. **Verify and pay:** "Where should we send your invitation link?" with a phone-or-email input (Egypt flag and +20 default), a 6-digit OTP input with resend timer, and a Google button. Then payment with Fawry options (card, Fawry reference code, wallet) and a clear order summary. Include the 7-day refund note. Success screen with confetti, "Go to your invitation", and a WhatsApp share button.

### C5. The guest-facing invitation (show 2 sample designs)
Design two sample invitations to show the range (one floral-luxury, one modern-minimal), each as a mobile-first long-scroll page:
- **Intro:** an envelope or curtain that opens on tap, couple names in calligraphy, a "tap to open" cue and a music on/off toggle.
- **Sections:** hero with names and date; countdown; our story; event schedule timeline; venue with embedded map and an "Open in Maps" button; dress code cards; gifts (bank or InstaPay details with a copy button); FAQ; **RSVP form** (name, phone, number of guests, attending yes/no, optional message) with a success state; guestbook of messages; "Add to calendar" button; a small "Made with [BRAND]" footer line.
- A language toggle on the invitation (AR / EN) for bilingual invitations.
- Also design the **"This invitation has ended"** page: couple names, a thank-you line, and a "Create your own" CTA.
- Also design the WhatsApp **link preview card** (photo, names, date).

### C6. Customer dashboard: My invitations (home)
Mobile bottom tab bar (Invitations, Guests, Share, Account) that becomes a left (right in RTL) sidebar on desktop. Header: language switch, notifications, avatar. Invitation cards showing a thumbnail, status badge (draft / live / ended), views, RSVP count, days to the event, an **edits-left meter** ("7 of 15 edits left"), a **days-online-left** counter, and buttons **Edit**, **Extend**, **Buy edits**. A "Create new invitation" card. Empty state for new users. A banner for the 7-day-before-ending reminder with an Extend button.

### C7. Customer dashboard: Editor
Desktop: left panel with a draggable section list (toggle on/off, reorder) and a form for the selected section; right panel with a live phone preview and a device-size switch. Mobile: an "Edit | Preview" segmented toggle. Forms for: names, date and time, venue with map search, schedule items (add/remove rows), dress code, gifts and bank details, FAQ, music picker from a library, and image or video upload with a cropper. Each text field has AR and EN tabs. A sticky top bar with "Save draft" (always free), **"Publish changes"** (shows "uses 1 of your 15 edits" in a confirm modal), and "Undo last publish". Show states: unsaved changes, publishing, success toast, and "out of edits" with an upsell modal ("Add 10 edits: 99 ج.م").

### C8. Customer dashboard: Guests and Messages
RSVP table with columns name, phone, guests count, status chip (attending / not / pending), and date. Summary tiles (total invited, attending, declined, pending, total head count). Search, filters, **Export CSV/Excel**, and per-row "Remind on WhatsApp" deep link. On mobile the table becomes stacked cards. A Messages tab for guestbook moderation with approve, hide and delete.

### C9. Customer dashboard: Share
Invitation link with a copy button, a WhatsApp share button with a pre-filled bilingual message preview, a QR code with download (for printed cards), and an OG/WhatsApp preview card. Optional custom subdomain upsell.

### C10. Customer dashboard: Account, points and billing
- **Account:** purchase count, level badge (Member / Silver / Gold with progress to the next level and the perks of each), points balance with history and "points expiring soon", a customer-referral link ("invite a friend, earn 100 points").
- **Orders and receipts:** list of orders with status, downloadable receipt/e-invoice in AR or EN, upgrade tier and extend hosting actions.
- **Settings:** linked WhatsApp, email and Google; language; delete account (with a data-protection explanation).

### C11. Private edit link (no account)
The same editor, with a persistent soft banner: "Save this invitation to your account to keep it safe and earn points", opening a verify-phone-or-email modal that claims the invitation. Hide billing, points and account-level settings.

### C12. Admin: Overview
Desktop-first, English by default with an Arabic toggle, dark or light. KPI tiles (accounts, revenue, paid orders, published invitations) with sparklines. Charts: new accounts over time, **by signup method** (WhatsApp / email / Google), a conversion **funnel** (visitors -> demo opened -> draft -> checkout started -> paid -> published), revenue by tier / template / provider, and template performance (demo views vs sales). A recent-activity feed and an "attention needed" card (failed webhooks, flagged content, OTP spend spike).

### C13. Admin: Customers and orders
Global search (phone, email, name, invitation slug). A customer detail view: profile, orders, purchase count, level, points ledger, and each invitation with edits left and end date. Action buttons with required-reason dialogs: add edits, extend, grant/deduct points, issue/revoke private edit link, refund, impersonate (with an "audit logged" warning), and **Create manual order** (negotiated deals: customer, template, tier, typed amount, then send an account invite or a private edit link).

### C14. Admin: Templates manager
List of templates with status (draft / live / retired), sales, demo views and conversion. A create/edit form: AR and EN names, slug, category, event type, tiers, price override, featured flag, sort order; design upload (Theme Spec JSON with a validation error list) or a base-layout-plus-variants picker; asset uploader with size-vs-budget bars; sample content in AR and EN; preview at 390px and 1280px in AR and EN; and a **license gate**: a table of every asset with source and license fields, and a **Publish button that stays disabled until all licenses are filled in**.

### C15. Admin: Affiliates manager
List of media-buyers with clicks, drafts, paid orders, revenue, refunds, commission owed and a self-referral flag. Create form: name, phone, payout method (bank / InstaPay / Vodafone Cash), commission % with per-affiliate override, optional customer discount. After creation, auto-generate the ref code, share links in AR and EN, links to specific templates, and a downloadable QR code. Detail page with a date-range filter, charts, and a **payouts** tab with a "Mark as paid" dialog (amount, method, reference, date) and CSV export. Show the attribution rule in a help tooltip (code at checkout wins, otherwise last click within 30 days).

### C16. Admin: Abuse and ops
OTP sends and cost chart, rate-limit hits, flagged slugs and messages with a review queue, failed webhooks with retry, and an audit-log table (who, action, target, time).

### C17. System states and emails
Design 404 and 500 pages, offline state, session-expired modal, loading skeletons, and empty states for each list. Also design the **message templates** shown as WhatsApp and email mockups in AR and EN: OTP code, order receipt, "your invitation is live", and "7 days left, extend now".

---

## PART D: Closing instructions (append to the last message)

- Keep everything consistent with the design system in PART A.
- For every screen deliver mobile (390px) and desktop (1280px) variants, each in Arabic RTL and English LTR.
- Make prototypes clickable along the core journey: landing -> gallery -> demo -> quick setup -> checkout -> editor -> publish -> share.
- Do not use stock "SaaS dashboard" aesthetics on the public site, invitations or customer dashboard. The warm, premium stationery feel is the product.
