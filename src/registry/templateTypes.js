/** @template T @param {T} obj @returns {Readonly<T>} */
const freeze = (obj) => Object.freeze(obj);

/**
 * Enum: the kind of event the invitation is for.
 * Values sourced from existing data.js files.
 */
export const eventType = freeze({
  ENGAGEMENT: "engagement",
  SAVE_THE_DATE: "save-the-date",
  WEDDING: "wedding",
  BIRTHDAY: "birthday",
});

/**
 * Enum: the broad page/site type.
 */
export const siteType = freeze({
  FULL_INVITATION: "full-invitation",
  SAVE_THE_DATE: "save-the-date",
  RSVP_ONLY: "rsvp-only",
});

/**
 * Enum: the user-experience pattern the template delivers.
 */
export const experienceType = freeze({
  CINEMATIC_STORY: "cinematic-story",
  INTERACTIVE_REVEAL: "interactive-reveal",
  SLIDESHOW: "slideshow",
  SCROLL_ONLY: "scroll-only",
});

/**
 * Enum: the intro/opening interaction preset.
 */
export const introType = freeze({
  VIDEO_OPEN: "video-open",
  SCRATCH_REVEAL: "scratch-reveal",
  TAP_TO_OPEN: "tap-to-open",
  ENVELOPE: "envelope",
  NONE: "none",
});

/**
 * Enum: the visual layout family.
 */
export const layoutFamily = freeze({
  ORNATE: "ornate",
  MINIMAL_INTERACTIVE: "minimal-interactive",
  MODERN: "modern",
  CLASSIC: "classic",
  SAFARI_EDITORIAL: "safari-editorial",
  BOHO: "boho",
  LUXURY_FLORAL: "luxury-floral",
});
