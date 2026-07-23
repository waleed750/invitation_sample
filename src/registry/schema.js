/**
 * @file Invitation data schema (JSDoc contract).
 *
 * Every template's data.js must export an object conforming to this shape.
 * The schema is the **union** of the two existing data objects:
 *   - src/sites/video-open-invitation/data.js  (invitationData)
 *   - src/sites/lace-photo-scratch/data.js     (laceScratchData)
 *
 * Admin-edited JSON must satisfy this contract.  The `sections[]` array is
 * the single source of truth for *what* renders and in *what order*; an
 * admin UI can reorder, add, or remove sections.
 *
 * ─── Top-level keys ───────────────────────────────────────────────────
 *
 * @typedef {Object} InvitationData
 *
 * @property {TemplateMeta}   template  — Enum flags (event type, intro, layout…).
 * @property {Theme}          theme     — CSS custom-property values.
 * @property {Couple}         couple    — Names + optional headline.
 * @property {Event}          event     — Date/time/venue/map.
 * @property {Media}          media     — All asset URLs (images, video, audio).
 * @property {Copy}           copy      — All human-readable strings.
 * @property {Section[]}      sections  — Ordered list of content sections.
 */

/**
 * Enum flags describing the template variant.
 *
 * @typedef {Object} TemplateMeta
 * @property {string} eventType       — e.g. "engagement" | "save-the-date"
 * @property {string} siteType        — e.g. "full-invitation" | "save-the-date"
 * @property {string} experienceType  — e.g. "cinematic-story" | "interactive-reveal"
 * @property {string} introType       — e.g. "video-open" | "scratch-reveal"
 * @property {string} layoutFamily    — e.g. "ornate" | "minimal-interactive"
 */

/**
 * CSS custom-property theme values.
 *
 * @typedef {Object} Theme
 * @property {string} background — Page background colour.
 * @property {string} foreground — Primary text colour.
 * @property {string} muted      — Secondary/muted text colour.
 * @property {string} ivory      — Light accent surface colour.
 */

/**
 * Couple information.
 *
 * @typedef {Object} Couple
 * @property {string}  firstName  — First person's name.
 * @property {string}  secondName — Second person's name.
 * @property {string} [headline]  — Short tagline (e.g. "We're Getting Engaged").
 */

/**
 * Event details.
 *
 * @typedef {Object} Event
 * @property {string}  date        — ISO-8601 datetime (used by countdown).
 * @property {string}  displayDate — Human-readable date string.
 * @property {string}  startTime   — e.g. "8 PM".
 * @property {string}  endTime     — e.g. "12 AM".
 * @property {string}  venue       — Venue name.
 * @property {string}  mapUrl      — Google Maps link.
 * @property {string} [label]      — Short label (e.g. "Save the Date").
 * @property {string} [location]   — Location text (lace-photo-scratch style).
 */

/**
 * All media assets. Keys are camelCase; values are public-path URLs.
 * Not every template uses every key — only those referenced by the
 * template's sections are required at runtime.
 *
 * @typedef {Object} Media
 * @property {string} [introPosterUrl]  — Poster frame shown before intro plays.
 * @property {string} [introVideoUrl]   — Intro video source.
 * @property {string} [heroVideoUrl]    — Hero background video.
 * @property {string} [musicUrl]        — Background music track.
 * @property {string} [coupleDancingUrl]— Decorative illustration/photo.
 * @property {string} [footerOrnamentUrl]— Footer ornament image.
 * @property {string} [ornateBadgeUrl]  — Badge/crest image for details section.
 * @property {string} [stringLightsUrl] — String-lights divider image.
 * @property {string} [photoUrl]        — Primary photo (lace-photo-scratch).
 * @property {string} [ornamentUrl]     — Ornament image (lace-photo-scratch).
 */

/**
 * All human-readable copy strings.  Keys are camelCase; values are
 * plain text (no JSX).  Not every template uses every key.
 *
 * @typedef {Object} Copy
 * @property {string} [tapLabel]         — "Tap to open" etc.
 * @property {string} [welcomeTitle]     — Welcome section heading.
 * @property {string} [welcome]          — Welcome section body text.
 * @property {string} [scheduleTitle]    — Schedule section heading.
 * @property {string} [scheduleSubtitle] — Schedule section kicker.
 * @property {string} [detailsTitle]     — Venue details heading.
 * @property {string} [detailsSubtitle]  — Venue details kicker.
 * @property {string} [messageTitle]     — Message form heading.
 * @property {string} [messageSubtitle]  — Message form kicker.
 */

// ─── Section descriptors ──────────────────────────────────────────────

/**
 * Base section fields shared by every section type.
 *
 * @typedef {Object} SectionBase
 * @property {string} type  — Discriminator (see SECTION_TYPES).
 * @property {string} [id]  — Optional stable key for React lists.
 */

/** @type {Record<string, true>} Map of all valid section type strings. */
export const SECTION_TYPES = Object.freeze({
  hero: true,
  countdown: true,
  welcome: true,
  schedule: true,
  details: true,
  map: true,
  messageForm: true,
  imageDivider: true,
  footer: true,
  scratchReveal: true,
  story: true,
  dressCode: true,
  gifts: true,
  rsvp: true,
  faq: true,
  weddingWeekend: true,
  travelInfo: true,
  bohoFooter: true,
  credit: true,
  hotelList: true,
});

/**
 * Hero section — couple names, headline, background video.
 *
 * @typedef {SectionBase & {
 *   type: 'hero',
 *   props: {
 *     headline?: string,
 *     firstName: string,
 *     secondName: string,
 *     displayDate: string,
 *     heroVideoUrl?: string,
 *   }
 * }} HeroSection
 */

/**
 * Countdown section — live countdown to event date.
 *
 * @typedef {SectionBase & {
 *   type: 'countdown',
 *   props: {
 *     date: string,
 *   }
 * }} CountdownSection
 */

/**
 * Welcome section — heading + body paragraph.
 *
 * @typedef {SectionBase & {
 *   type: 'welcome',
 *   props: {
 *     title: string,
 *     body: string,
 *   }
 * }} WelcomeSection
 */

/**
 * Schedule section — ordered list of timed items.
 *
 * @typedef {SectionBase & {
 *   type: 'schedule',
 *   props: {
 *     title: string,
 *     subtitle: string,
 *     items: Array<{ title: string, description: string }>,
 *     coupleDancingUrl?: string,
 *   }
 * }} ScheduleSection
 */

/**
 * Details/venue section — venue name, time range, map link.
 *
 * @typedef {SectionBase & {
 *   type: 'details',
 *   props: {
 *     title: string,
 *     subtitle: string,
 *     venue: string,
 *     startTime: string,
 *     endTime: string,
 *     mapUrl: string,
 *     ornateBadgeUrl?: string,
 *   }
 * }} DetailsSection
 */

/**
 * Hotel list section — recommended accommodations.
 *
 * @typedef {SectionBase & {
 *   type: 'hotelList',
 *   props: {
 *     title: string,
 *     subtitle?: string,
 *     hotels: Array<{
 *       name: string,
 *       imageUrl?: string,
 *       pricePerNight?: string,
 *       priceNote?: string,
 *       bookingNote?: string,
 *     }>,
 *   }
 * }} HotelListSection
 */

/**
 * Embedded map section — iframe.
 *
 * @typedef {SectionBase & {
 *   type: 'map',
 *   props: {
 *     title?: string,
 *     src: string,
 *   }
 * }} MapSection
 */

/**
 * Message/guestbook form.
 *
 * @typedef {SectionBase & {
 *   type: 'messageForm',
 *   props: {
 *     title: string,
 *     subtitle: string,
 *   }
 * }} MessageFormSection
 */

/**
 * Decorative image divider.
 *
 * @typedef {SectionBase & {
 *   type: 'imageDivider',
 *   props: {
 *     imageUrl: string,
 *   }
 * }} ImageDividerSection
 */

/**
 * Footer ornament.
 *
 * @typedef {SectionBase & {
 *   type: 'footer',
 *   props: {
 *     ornamentUrl: string,
 *   }
 * }} FooterSection
 */

/**
 * Story / memory-lane — chaptered narrative with scrolling photo strips.
 *
 * @typedef {SectionBase & {
 *   type: 'story',
 *   props: {
 *     title: string,
 *     chapters: Array<{
 *       quote?: string,
 *       prose: string,
 *       photos?: string[],
 *     }>,
 *     birdsFrame1?: string,
 *     birdsFrame2?: string,
 *   }
 * }} StorySection
 */

/**
 * Dress code — title, body, optional illustration.
 *
 * @typedef {SectionBase & {
 *   type: 'dressCode',
 *   props: {
 *     title: string,
 *     body: string,
 *     illustrationUrl?: string,
 *   }
 * }} DressCodeSection
 */

/**
 * Gifts & wishes — title, body, optional background.
 *
 * @typedef {SectionBase & {
 *   type: 'gifts',
 *   props: {
 *     title: string,
 *     body: string,
 *     bgUrl?: string,
 *     buttonLabel?: string,
 *     buttonUrl?: string,
 *   }
 * }} GiftsSection
 */

/**
 * RSVP form — attendance, name, guests, email, children.
 *
 * @typedef {SectionBase & {
 *   type: 'rsvp',
 *   props: {
 *     title: string,
 *     subtitle: string,
 *     bgUrl?: string,
 *     bottomUrl?: string,
 *   }
 * }} RsvpSection
 */

/**
 * FAQ accordion — expandable question/answer items.
 *
 * @typedef {SectionBase & {
 *   type: 'faq',
 *   props: {
 *     title: string,
 *     items: Array<{ question: string, answer: string }>,
 *   }
 * }} FaqSection
 */

/**
 * Scratch-to-reveal intro (lace-photo-scratch).
 *
 * @typedef {SectionBase & {
 *   type: 'scratchReveal',
 *   props: {
 *     photoUrl: string,
 *     label: string,
 *     firstName: string,
 *     secondName: string,
 *     date: string,
 *     location: string,
 *   }
 * }} ScratchRevealSection
 */

/**
 * Wedding weekend — two-day celebration schedule.
 *
 * @typedef {SectionBase & {
 *   type: 'weddingWeekend',
 *   props: {
 *     eyebrow: string,
 *     title: string,
 *     body: string,
 *     tileFrameUrl?: string,
 *     leafDividerUrl?: string,
 *     palmSunsetUrl?: string,
 *     events: Array<{ dateLabel: string, title: string }>,
 *   }
 * }} WeddingWeekendSection
 */

/**
 * Travel information — airport cards for destination weddings.
 *
 * @typedef {SectionBase & {
 *   type: 'travelInfo',
 *   props: {
 *     eyebrow: string,
 *     title: string,
 *     body: string,
 *     shellDividerUrl?: string,
 *     flowerDividerUrl?: string,
 *     palmDividerUrl?: string,
 *     palmStampUrl?: string,
 *     airports: Array<{
 *       code: string,
 *       name: string,
 *       location: string,
 *       frameUrl?: string,
 *       illustrationUrl?: string,
 *       illustrations?: string[],
 *     }>,
 *   }
 * }} TravelInfoSection
 */

/**
 * Boho decorative footer — frame, monogram, starfish, credit.
 *
 * @typedef {SectionBase & {
 *   type: 'bohoFooter',
 *   props: {
 *     names: string,
 *     month: string,
 *     year: string,
 *     frameUrl?: string,
 *     monogramUrl?: string,
 *     starfishUrl?: string,
 *     creditLine?: string,
 *     creditName?: string,
 *   }
 * }} BohoFooterSection
 */

/**
 * Union of all section descriptors.
 *
 * @typedef {HeroSection|CountdownSection|WelcomeSection|ScheduleSection|
 *           DetailsSection|MapSection|MessageFormSection|
 *           ImageDividerSection|FooterSection|ScratchRevealSection|
 *           StorySection|DressCodeSection|GiftsSection|RsvpSection|FaqSection|
 *           WeddingWeekendSection|TravelInfoSection|BohoFooterSection} Section
 */
