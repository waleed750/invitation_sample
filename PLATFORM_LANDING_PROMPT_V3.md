# Landing page prompt v3, for Google Stitch (reframe anti-generic pass)

Method: the `reframe` audit was run on the Stitch HTML (v1) **and on my own v2 prompt**, then v3 was rebuilt from what the product really does. Acceptance test for every choice: *could this be pasted onto another product without anyone noticing? If yes, it is cut.*

---

## 1. Audit table (v1 Stitch page and v2 prompt)

| # | Where | AI tell matched | Severity | Replacement direction |
|---|---|---|---|---|
| 1 | v1 whole page | Template SaaS structure: hero, stats bar, 3 steps, 4-card grid, 6 feature cards, 3 pricing cards, 3 testimonials, FAQ, CTA band | High | No section stack. Tell it as one story that only this product has: an invitation traveling through a family WhatsApp group |
| 2 | v1 features, steps, testimonials, pricing | Generic 3-column icon-title-blurb grids, rounded-2xl + soft shadow on everything | High | Different object per beat: a chat thread, a typographic index, a dense headcount sheet, one receipt |
| 3 | v1 palette | Cream + green + gold: the stock "luxury wedding" palette, plus Material tonal tokens used as-is | High | Palette taken from where this product lives: Cairo limestone, walnut mashrabiya wood, Khan el-Khalili turquoise tile, one hibiscus-red accent |
| 4 | v1 fonts | Work Sans (no Arabic glyphs) + Noto Serif for everything; italics on Arabic text | High | Reem Kufi for display (its geometry echoes the lattice), IBM Plex Sans Arabic for text, Aref Ruqaa only for names. No Arabic italics |
| 5 | v1 hero/CTA | Blurred glow blobs, ✦ glyph as logo, "←" text arrows, pulsing ping | Medium | Flat color, real wordmark, SVG arrows that flip in RTL |
| 6 | v1 copy | Filler: "بلمسة فخامة وأناقة تليق بليلتك الخاصة", "تحفة ورقية ملكية" | High | Specific copy about headcounts, aunts, and the hall manager asking "كام فرد؟" |
| 7 | v1 proof | Invented stats and stock-portrait testimonials; claims that contradict the plan (unlimited edits, 500 guests, 24h refund) | High (trust/legal) | No fake numbers. Use the real limits |
| 8 | v1 hero | Static phone mockup with a wax seal. Tells, doesn't show | Medium | The visitor types their own names |
| 9 | **v2 (my own)** | Marquee + numbered 1-2-3 steps + 3 pricing columns still read as a template with better paint; the "karkade + saffron" palette was a guess, not derived from the product; a 💌 emoji in a bubble | Medium | v3 below |
| 10 | v1 spacing | One uniform rhythm everywhere | Low | Hero is huge and sparse, the headcount sheet is deliberately dense, the receipt is tight monospace |

**The 3 changes that add the most distinctiveness:**
1. The page is told as a **family WhatsApp thread**, because that is literally how every one of these invitations is used.
2. The grid and motif come from the **mashrabiya lattice**: light and the invitation seen through apertures, not generic cards.
3. The pricing is a **receipt that recalculates**, and the dashboard is a **dense headcount sheet**: real artifacts, not decoration.

---

## 2. PROMPT 1: Master prompt (send first)

Design the landing page for **[BRAND]**, an Arabic-first platform where Egyptian families make an animated digital invitation in two minutes, send it in WhatsApp groups, and see who is coming. Wedding, engagement, birthday, new baby.

**The truth this page is built on:** in Egypt an invitation lives in a WhatsApp family group. It arrives, the aunts reply "مبروك" and "هنيجي كلنا", someone asks "ممكن أجيب ٣؟", and a week before the party the hall manager asks "كام فرد بالظبط؟". The host's real problem is knowing the headcount without chasing people. The page should feel like that thread and end with that answer. No software-brochure structure. There is no hero, logo bar, 3-feature grid or testimonial row.

**Visual world (derived from the product, not a template)**
- **The mashrabiya lattice** is the recurring structure: turned-wood screens with light coming through. Use it as (a) a faint large-scale grid pattern in line art behind big type, (b) the shape of the apertures that frame phone screens and images (a stepped, geometric star-and-diamond window, not a round-cornered rectangle), (c) a cut-out edge between color bands.
- **Flat color only.** No gradients, no blur, no glassmorphism, no glow blobs, no drop shadows (use a 2px hard offset or a hairline instead).
- **Palette, derived from Cairo:**
  - Limestone `#E8DFCD` (page background)
  - Walnut `#2A1C13` (text and dark bands)
  - Fayoum tile turquoise `#0F7C86` (secondary: links, chat bubbles from the host)
  - Hibiscus `#B3262E` (the single hot accent: one primary button per screen, the key numeral, the stamp)
  - Pale plaster `#F6F1E6` (cards and chat bubbles for guests)
  Never more than 3 of these on one screen.
- **Typography does the branding.** Arabic display: **Reem Kufi** 700, very large (96–160px desktop, 56–80px mobile), line height 1.0, tight tracking. Arabic text/UI: **IBM Plex Sans Arabic** 400/500, line height 1.7. Names only: **Aref Ruqaa**. English display: **Instrument Serif**, English UI: **IBM Plex Sans**. Numbers in the receipt and headcount sheet: **IBM Plex Mono** (tabular figures). Never italic Arabic. Emphasis comes from color, weight, or a hand-drawn underline.
- **Density varies on purpose:** the cover is sparse and huge, the thread is airy, the index is a tight list, the headcount sheet is genuinely dense like a spreadsheet, the receipt is compact monospace.
- **Asymmetry:** key elements break the grid, with big type cropped at the viewport edge and a phone overlapping two bands.
- No emoji anywhere in headings or UI. No stock photos. No unicode ✦ or "←" characters: use SVG marks and arrows that flip in RTL.

**Language and layout:** true RTL first, with a language switch (عربي | EN) in the header, mobile-first at 390px then 1280px, tap targets at least 44px, Western digits (0–9), prices as `1,299 ج.م`. Copy is warm Egyptian colloquial, short, specific, like a friend who has organized a wedding before.

**Header:** the wordmark (the brand name set in Aref Ruqaa inside a small lattice-window mark), three plain text links (التصاميم، السعر، إزاي بتشتغل), the language switch, and one hibiscus button "ابدأ دعوتك". Nothing else.

### The page: 5 scenes

**Scene 1, Cover: "اكتب اسمكم".**
A huge Reem Kufi line, "اكتب اسمكم.." and below it, in smaller type, "وشوف الدعوة بتتفتح". Directly under the line is one oversized input (underline style, not a boxed field) for the two names, and a small date field. To the side, one tall phone inside a lattice-window frame shows the invitation, and the names update live in Aref Ruqaa as the visitor types. A hibiscus button "افتح الدعوة" opens the envelope on the phone. Default names: أحمد و منى. Nothing else on this screen except a tiny line "دعوتك قبل ما تدفع، ببلاش".

**Scene 2, The thread: the family group.**
A full-height section on a walnut band that plays as a WhatsApp-style group chat, without copying WhatsApp's logo or exact green (host bubbles are turquoise, guest bubbles pale plaster). The group is named "عيلة منى ❤" in plain text only (no emoji in the UI chrome). On scroll, messages appear one by one:
1. Host: the invitation link with a rich preview card (names, date, venue).
2. "خالتو سميرة": "مبروك يا حبايبي!! هنيجي كلنا".
3. "عمو حسام": "ممكن اجيب ٣ معايا؟" and the invitation link's RSVP changes the count live in a small counter chip at the top of the screen.
4. "مدير القاعة" (hall manager, marked as an outside number): "كام فرد بالظبط يا فندم؟"
5. The host replies with a screenshot-like card: "١٨٦ مؤكد · ٣٢ لسه ما ردّوش" in Reem Kufi.
The thread is the explanation of the product. No separate feature list.

**Scene 3, The index: designs as a typographic list.**
Not a gallery of cards. A tight, full-width, numbered list of template names in very large Arabic type (٠١ المشربية، ٠٢ … ), one per row, with a thin rule between rows and the style tag at the far end in small type. Hovering or tapping a row makes a phone in a lattice window follow the pointer (or pin to the side on mobile) and shows that design running. Only the first row ("المشربية") is real and live; the rest are clearly marked "قريباً" in a muted tone. One quiet link at the bottom: "كل التصاميم".

**Scene 4, The headcount sheet: what the host sees.**
A dense, honest table in IBM Plex Mono and Plex Sans Arabic, looking like a real spreadsheet: rows of names, a guests-count column, a status column (جاي / مش جاي / لسه), a timestamp, and a total row pinned at the bottom: "مؤكد ١٨٦ · اعتذار ١٢ · لسه ٣٢". A hand-drawn hibiscus circle around the total. A small filter row ("الكل / جاي / لسه") and a button "نزّل Excel". Beside it, in one short line each, three plain facts instead of icon cards: "دفعة واحدة، من غير اشتراك". "عدّل براحتك: لحد ١٥ تعديل منشور في كلاسيك". "الضيف يفتحها من واتساب، من غير تطبيق". Include a small "عربي | English" toggle that flips the sheet's direction smoothly (columns mirror).

**Scene 5, The receipt: price, and the end.**
One compact paper receipt with a torn bottom edge, set in IBM Plex Mono. Three plan tabs at the top (سيف ذا ديت / كلاسيك / بريميوم). Picking a tab recalculates the lines:
- كلاسيك: ١,٢٩٩ ج.م · ٦ شهور أونلاين · لحد ٣٠٠ ضيف يرد · ١٥ تعديل منشور · تصدير Excel
- سيف ذا ديت: ٤٩٩ ج.م · ٣ شهور · …
- بريميوم: ٢,٤٩٩ ج.م · ١٢ شهر · فيديو افتتاحي وموسيقى · ردود بلا حد · ٤٠ تعديل
A "مدفوع مرة واحدة" stamp in hibiscus. The refund line reads "استرجاع خلال ٧ أيام". Below the receipt, the page ends where it started: the same empty "اكتب اسمكم" input, with the button "ابدأ". Footer is two lines: legal links and a WhatsApp contact.

**Motion (keep it to 4):** the live name typing, the envelope opening, the chat messages arriving with the counter ticking, the sheet flipping RTL/LTR. Everything else is still. Respect `prefers-reduced-motion`.

**Honesty rules:** no invented numbers or testimonials. The "١٨٦" figures are marked as sample data in a tiny caption ("مثال"). Only one design is real, so say so. Use the real limits above.

---

## 3. Follow-ups (one at a time; repeat the 3-line style anchor each time)

**Style anchor (paste at the start of every follow-up):**
"Flat color only: limestone #E8DFCD, walnut #2A1C13, tile turquoise #0F7C86, hibiscus #B3262E. Reem Kufi display, IBM Plex Sans Arabic text, Aref Ruqaa for names. Mashrabiya-lattice windows, no cards with rounded corners and soft shadows, no gradients or blur, no emoji, no stock photos. RTL first."

**F1. Mobile 390px**
"Design all 5 scenes at 390px. Scene 1: the input and phone fit above the fold. Scene 2: the chat is full-screen with the counter pinned. Scene 3: the list rows stay big and the phone preview appears as a bottom sheet. Scene 4: the table scrolls horizontally with the name column pinned. Scene 5: the receipt is full width. Add a sticky bottom bar with the hibiscus 'ابدأ دعوتك' button."

**F2. English LTR**
"Show the English LTR version of all 5 scenes. Instrument Serif display, IBM Plex Sans UI, mono numbers. Mirror the layout properly: the cover text on the left, the phone on the right, the chat bubbles swapping sides, the sheet's columns reversing."

**F3. Cover alternatives**
"Refine only Scene 1 with 3 variations: (a) the huge line cropped by the viewport edge with the phone overlapping it, (b) the input as the biggest element on the page and the phone tiny, (c) a walnut dark version. Same copy and palette."

**F4. The invitation itself (inside the phone)**
"Design the invitation shown in the phone: an envelope that opens, then a long mobile page with names in Aref Ruqaa on limestone, a lattice-window frame around the date, a map block, a schedule, and an RSVP form. It should look like a refined original design, not a template."

**F5. Lattice system**
"Create the mashrabiya lattice as a reusable visual system: a tile pattern in line art at 3 scales, the aperture shapes used for phone frames, and the cut-edge divider between color bands. Use it consistently."

---

## 4. Swap test result

- The WhatsApp family-group thread with a hall manager asking for the headcount: only this product.
- Mashrabiya lattice windows and the limestone/walnut/turquoise palette: tied to Egypt and to the product's first real template.
- The receipt with the plan limits and the Excel headcount sheet: only this product's mechanics.

If a generated screen shows a rounded-card grid, a gradient, a glow, an emoji heading, or stock photography, regenerate that screen with the style anchor above.
