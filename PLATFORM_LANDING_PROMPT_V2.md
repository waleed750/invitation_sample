# Landing page prompt v2 (non-traditional), for Google Stitch

Send PROMPT 1 first. Then send the follow-ups one at a time. Replace `[BRAND]` (the last draft used "زفّات | Zaffat", which is only a placeholder).

---

## PROMPT 1: Master prompt

Design the landing page for **[BRAND]**, an Arabic-first platform where people in Egypt make an animated digital invitation (weddings, engagements, birthdays, new babies) in two minutes, send it on WhatsApp, and watch RSVPs arrive.

**The one big idea: the landing page behaves like an invitation, not like a software brochure.** A visitor should feel what their guests will feel before they have read a word about features. Do not build the usual SaaS stack (hero, logo strip, 3 steps, card grid, pricing cards, testimonials, FAQ). Build a short, bold, scroll-driven story with only 5 beats.

**Art direction: editorial poster meets playful mobile app.** Think of a well-designed Egyptian film poster or a modern magazine cover, not a wedding-hall brochure.
- Huge Arabic typography is the main visual. Headlines are very large (80–140px desktop, 52–72px mobile), tightly set, and can run edge to edge or be cropped by the viewport.
- Flat color blocking with confident full-width bands. No blurred glow blobs, no soft gradients, no glassmorphism, no drop-shadow-on-everything.
- Mix one bold sans for headlines, one calligraphic accent used only for names, and big outlined or hairline numerals. Use real sticker-like shapes: a stamp, a postmark, a torn-ticket edge, a hand-drawn underline or circle around key words.
- Depth comes from overlap and scale: phones tilted at different angles, partly cropped by the edge, layered over big type.
- Corners: mostly sharp or pill-shaped, with a few large organic arch shapes (a doorway/mashrabiya-window silhouette) as a recurring motif. Avoid the uniform rounded card.

**Palette (flat, no gradients). Do NOT use cream + dark green + gold.**
- Ink `#14110F` (text, dark bands)
- Paper `#F3EEE6` (main background)
- Karkade red `#B3262E` (primary accent, buttons, big type)
- Saffron `#F2A93B` (highlights, stickers, one color band)
- Mint `#CFE3D2` (soft secondary band, used sparingly)
Use at most 3 of these in any one section.

**Typography**
- Arabic headlines: **Readex Pro** or **IBM Plex Sans Arabic**, weight 700–800, tight line height (1.05).
- Arabic accent for names and handwritten notes only: **Aref Ruqaa**.
- Arabic body and UI: **IBM Plex Sans Arabic** 400/500, line height 1.7.
- English: **Instrument Serif** or **Fraunces** for display, **Inter** for UI.
- Never use italics on Arabic text (they do not exist in Arabic and look fake). Emphasize with color, weight, a highlighter swipe, or a hand-drawn underline.
- Do not use a unicode "✦" as a logo or "←" characters as arrows. Use a real wordmark (the brand name in the accent calligraphy) and proper SVG icons that flip in RTL.

**Language and layout rules**
- True RTL first, with the language switch (العربية | English) in the header. Also show the English LTR version.
- Mobile-first at 390px, then 1280px. Tap targets at least 44px.
- Western digits (0–9). Prices read `1,299 ج.م`.
- Voice: warm, friendly **Egyptian colloquial**, short lines, like a friend talking. Not formal and not poetic.
  Example headline: "اكتب اسمكم.. وشوف دعوتكم بتتفتح" (Type your names.. and watch your invitation open).
  Avoid stiff phrases like "بلمسة فخامة وأناقة تليق بليلتك الخاصة".

**Header:** minimal. A wordmark, 3 text links (التصاميم، الأسعار، إزاي بتشتغل), the language switch, and one red button "ابدأ دعوتك". No avatar icon, no currency chip.

### The 5 beats

**Beat 1, Hero: "type your names" (interactive).**
A giant two-line Arabic headline on the left (right in RTL) and, beside it, a large tilted phone showing an invitation. Under the headline sits one big input: "اكتب اسم العروسين" with a second small field for the date. As the visitor types, the names on the phone invitation change live in the Aref Ruqaa calligraphy, and the date updates. A red button "افتح دعوتي" opens the envelope on the phone. A WhatsApp-green chat bubble floats near the phone: "شوف دعوتنا 💌". No stock photos here. Show a default pair of names (أحمد & منى) so the page never looks empty.

**Beat 2, The journey: one pinned scroll scene with 3 moments.**
As the user scrolls, one big phone stays pinned and its screen changes:
1. A WhatsApp conversation: the invitation link arrives with a rich preview card.
2. The guest taps it: the envelope opens, the names animate in, music icon pulses.
3. The guest taps "هاجي": a confetti burst, and the phone swaps to the host's dashboard where a big counter ticks from 0 up to 128 "أكّدوا حضورهم".
Each moment has a short caption in large type beside the phone and a big outlined numeral (1, 2, 3). This replaces the "how it works in 3 steps" card row.

**Beat 3, The wall: designs, not cards.**
A full-width, slow auto-scrolling two-row marquee of real invitation screens in phone-shaped arches, at different heights, partly cropped by the edge. Tapping or hovering one lifts it and shows its name and a small "جرّبها" chip. Above the wall, filter chips act as a quick style picker (ملكي، ناعم، عصري، بوهو، تراثي). No price and no "use template" button on every item, so the wall reads as an exhibition. One "شوف كل التصاميم" link at the end.

**Beat 4, You stay in control: a live flip.**
A split-screen toy. On one side a simplified editor with 3 fields (names, date, place). On the other, the invitation. A big toggle labeled "عربي / English" flips the whole invitation between RTL and LTR in a smooth animation, with the layout mirroring correctly. Under it, three small honest badges: "عدّل براحتك (حتى ١٥ تعديل منشور)", "الدفع مرة واحدة", "من غير ما حد يحمّل تطبيق". On the dashboard side, a tiny meter "٧ من ١٥ تعديل متبقي".

**Beat 5, Price + final call: one ticket.**
Show the 3 plans as one long **ticket or receipt strip** with perforated edges, not three cards. Each plan is a column on the ticket: Save the Date 499 / Classic 1,299 (marked "الأكتر اختياراً" with a saffron stamp) / Premium 2,499 ج.م, with 3 key facts each (months online, RSVP limit, video intro or not). Below the ticket, a full-width karkade-red band with a giant headline "ابدأ دعوتك دلوقتي" and two buttons: "ابدأ" and "كلمنا واتساب". A very small footer.

**Motion:** the envelope open, number count-up, the marquee, the pinned phone, and the language flip. Everything else is still. Respect `prefers-reduced-motion`.

**Content honesty (important):** no invented numbers. Do not write "12,000+ occasions", "60+ templates" or a live counter of guests, and no fake testimonials with stock portraits. If social proof is needed, use a clearly marked placeholder line: "قريباً: آراء أول ١٠٠ عريس". Use the real plan limits shown above.

---

## Follow-up prompts (send one at a time)

**F1. Mobile version**
"Now design the same landing page at 390px. Keep the 5 beats. The hero input stays above the fold with the phone peeking from below. The pinned journey becomes a vertical stack of 3 full-width scenes. The wall becomes a horizontal swipe. The ticket becomes a swipeable stack of 3 tickets with the center one highlighted. Add a sticky bottom bar with the red 'ابدأ دعوتك' button."

**F2. English LTR version**
"Show the English LTR version of the full page. Use Instrument Serif headlines and Inter for UI. Mirror the layout properly: the hero text on the left, the phone on the right, arrows pointing right, the timeline moving left to right."

**F3. Hero close-up**
"Refine only Beat 1. Give me 3 hero variations: (a) giant headline with a tilted phone, (b) the headline overlapping the phone, with the names input as a big pill, (c) a full-bleed saffron background with the phone centered and the headline wrapped around it. Same copy and palette."

**F4. Invitation samples**
"Design 4 full invitation screens to use in the wall, each with a different personality: a karkade-red and saffron festive one, an ink-black and paper minimal one, a mint and paper soft floral one with hand-drawn botanical line art, and a heritage one with arabesque patterns. Arabic names in Aref Ruqaa. No stock photos."

---

## Why the first version felt old-fashioned (for your reference)

1. **It is the standard SaaS template**, stacked in the usual order, and every block is the same rounded white card with the same soft shadow.
2. **Cream + deep green + gold + serif** is the most common "luxury wedding" look, so it reads as a hall brochure.
3. **Fonts:** Work Sans has no Arabic glyphs, and Noto Serif with fake italic Arabic looks unrefined. Arabic headlines should be heavy sans or calligraphy.
4. **Blurred glow blobs**, a unicode ✦ logo, and "←" text arrows feel like 2019 templates.
5. **The hero is a static phone mockup** that tells instead of shows. Typing your own names (which is also your key conversion idea in the plan) is far stronger.
6. **The copy is stiff** ("بلمسة فخامة وأناقة تليق بليلتك الخاصة"). Egyptian colloquial feels more modern and more trustworthy.
7. **Content conflicts with your plan and is partly invented:** "+12,000 occasions", "60+ templates", "unlimited edits", "500 guests", "refund within 24 hours", and fake stock-photo testimonials. Your plan has 9 live templates (less once the license problem is fixed), 15 published edits on Classic, 300 RSVPs, and a 7-day refund window. Publishing the old claims would also create legal and trust problems.
