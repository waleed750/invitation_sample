import {z} from 'zod';
import {localizedText as text} from './localized';

export const httpsUrl = z.string().refine(value => {
  if (!value.startsWith('https://') || /[\s\\\u0000-\u001f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}, 'Expected an HTTPS URL');
export const assetUrl = z.union([
  httpsUrl,
  z.string().regex(/^\/(?!\/)[^\\\s\u0000-\u001f]*$/u, 'Expected a same-origin path')
]);

// Conservative CSS color grammar; no arbitrary CSS expressions or custom properties.
const namedColors = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent currentcolor').split(' '));
export const cssColor = z.string().refine(value => {
  if (/[;{}\\]/u.test(value) || /url\s*\(/iu.test(value)) return false;
  const color = value.trim().toLowerCase();
  return namedColors.has(color) || /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/u.test(color)
    || /^(?:rgb|rgba|hsl|hsla)\(\s*[+-]?(?:\d*\.)?\d+(?:deg|rad|turn|grad|%)?(?:\s*[,/ ]\s*[+-]?(?:\d*\.)?\d+%?){2,3}\s*\)$/u.test(color);
}, 'Expected a safe CSS color');
export const templateMeta = z.object({
  eventType: z.enum(['engagement', 'save-the-date', 'wedding', 'birthday']),
  siteType: z.enum(['full-invitation', 'save-the-date', 'rsvp-only']),
  experienceType: z.enum(['cinematic-story', 'interactive-reveal', 'slideshow', 'scroll-only']),
  introType: z.enum(['video-open', 'scratch-reveal', 'tap-to-open', 'envelope', 'none']),
  layoutFamily: z.enum(['ornate', 'minimal-interactive', 'modern', 'classic', 'safari-editorial', 'boho', 'luxury-floral', 'floral-romantic', 'finca-rustic', 'sweetlove-romantic', 'dolce-vita-lake', 'daynight-dual', 'bridgerton-regency', 'bloom-garden', 'mashrabiya'])
}).strict();
export const theme = z.object({background: cssColor, foreground: cssColor, muted: cssColor, ivory: cssColor}).strict();
export const couple = z.object({firstName: text, secondName: text, headline: text.optional()}).strict();
const isoDate = z.iso.datetime({offset: true});
// Scratch invitations also store the displayed date here, rather than a countdown timestamp.
export const event = z.object({
  date: text, displayDate: text.optional(), startTime: text.optional(), endTime: text.optional(),
  venue: text.optional(), mapUrl: httpsUrl.optional(), label: text.optional(), location: text.optional()
}).strict();
export const media = z.object({
  introPosterUrl: assetUrl.optional(), introVideoUrl: assetUrl.optional(), heroVideoUrl: assetUrl.optional(),
  musicUrl: assetUrl.optional(), coupleDancingUrl: assetUrl.optional(), footerOrnamentUrl: assetUrl.optional(),
  ornateBadgeUrl: assetUrl.optional(), stringLightsUrl: assetUrl.optional(), photoUrl: assetUrl.optional(), ornamentUrl: assetUrl.optional()
}).strict();
export const copy = z.object({
  tapLabel: text.optional(), welcomeTitle: text.optional(), welcome: text.optional(), scheduleTitle: text.optional(),
  scheduleSubtitle: text.optional(), detailsTitle: text.optional(), detailsSubtitle: text.optional(),
  messageTitle: text.optional(), messageSubtitle: text.optional()
}).strict();
const timelineStop = z.object({time: text.optional(), text}).strict();
const scheduleItem = z.object({title: text, description: text.optional(), subtitle: text.optional(), time: text.optional(), stops: z.array(timelineStop).optional()}).strict();
const eventCard = z.object({kicker: text.optional(), heading: text.optional(), body: text.optional(), date: text.optional(), time: text.optional(), imageUrl: assetUrl.optional(), mapUrl: httpsUrl.optional(), mapLabel: text.optional()}).strict();
const formCopy = {
  nameFieldLabel: text.optional(), namePlaceholder: text.optional(), submitLabel: text.optional(), successMessage: text.optional()
};
function descriptor<T extends string, P extends z.ZodType>(type: T, props: P) {
  return z.object({type: z.literal(type), id: z.string().min(1).optional(), props}).strict();
}
export const section = z.discriminatedUnion('type', [
  descriptor('hero', z.object({headline: text.optional(), firstName: text, secondName: text, displayDate: text, heroVideoUrl: assetUrl.optional(), heroPosterUrl: assetUrl.optional(), ctaLabel: text.optional(), heroVideoLoop: z.boolean().optional(), showOverlayCopy: z.boolean().optional(), scrollCueLabel: text.optional(), overlayFadeOutAt: z.number().nonnegative().optional()}).strict()),
  descriptor('countdown', z.object({date: isoDate, title: text.optional(), untilLabel: text.optional(), kicker: text.optional(), bgImage: assetUrl.optional(), overlayImage: assetUrl.optional(), columnLeftUrl: assetUrl.optional(), columnRightUrl: assetUrl.optional(), showYears: z.boolean().optional(), showMonths: z.boolean().optional(), showSeconds: z.boolean().optional(), labels: z.object({days: text.optional(), hours: text.optional(), minutes: text.optional(), seconds: text.optional(), months: text.optional()}).strict().optional()}).strict()),
  descriptor('welcome', z.object({title: text, body: text, bgUrl: assetUrl.optional(), cards: z.array(eventCard).optional(), kicker: text.optional(), sectionId: z.string().optional()}).strict()),
  descriptor('schedule', z.object({title: text, subtitle: text, items: z.array(scheduleItem), coupleDancingUrl: assetUrl.optional(), stops: z.array(timelineStop).optional(), alternate: z.boolean().optional(), bgUrl: assetUrl.optional()}).strict()),
  descriptor('details', z.object({title: text, subtitle: text, venue: text, startTime: text, endTime: text, mapUrl: httpsUrl, ornateBadgeUrl: assetUrl.optional(), imageUrl: assetUrl.optional(), dateLine: text.optional(), addressLines: z.array(text).optional(), mapLabel: text.optional(), locationLabel: text.optional()}).strict()),
  descriptor('map', z.object({title: text.optional(), src: z.union([httpsUrl, z.literal('/maps/embed/index.html')])}).strict()),
  descriptor('messageForm', z.object({title: text, subtitle: text, ...formCopy, messageLabel: text.optional(), messagePlaceholder: text.optional()}).passthrough()),
  descriptor('imageDivider', z.object({imageUrl: assetUrl, alt: text.optional(), line: z.boolean().optional()}).strict()),
  descriptor('footer', z.object({ornamentUrl: assetUrl}).strict()),
  descriptor('scratchReveal', z.object({photoUrl: assetUrl, label: text, firstName: text, secondName: text, date: text, location: text, sealWords: z.array(text).optional(), tapLabel: text.optional(), scratchLabel: text.optional()}).strict()),
  descriptor('story', z.object({title: text, chapters: z.array(z.object({quote: text.optional(), prose: text, photos: z.array(assetUrl).optional()}).strict()), birdsFrame1: assetUrl.optional(), birdsFrame2: assetUrl.optional()}).strict()),
  descriptor('dressCode', z.object({title: text, body: text, illustrationUrl: assetUrl.optional(), cards: z.array(z.object({heading: text.optional(), date: text.optional(), attire: text.optional(), imageUrl: assetUrl.optional()}).strict()).optional(), groups: z.array(z.object({heading: text, body: text}).strict()).optional()}).strict()),
  descriptor('gifts', z.object({title: text, body: text, bgUrl: assetUrl.optional(), buttonLabel: text.optional(), buttonUrl: assetUrl.optional(), bankAccounts: z.array(z.object({bankLabel: text, accountName: text, iban: text, bic: text}).strict()).optional()}).strict()),
  descriptor('rsvp', z.object({title: text, subtitle: text, bgUrl: assetUrl.optional(), bottomUrl: assetUrl.optional(), ...formCopy,
    attendanceOptions: z.object({yes: text.optional(), no: text.optional()}).strict().optional(),
    eventOptions: z.array(z.object({value: z.string().optional(), label: text}).strict()).optional(),
    guestCountMode: z.enum(['select', 'stepper']).optional(), childrenMode: z.enum(['checkbox', 'radios']).optional(),
    childrenLabel: text.optional(), showDietaryField: z.boolean().optional(), dietaryFieldLabel: text.optional(), dietaryPlaceholder: text.optional(),
    attendingLabel: text.optional(), eventsLabel: text.optional(), guestCountLabel: text.optional(), emailLabel: text.optional(), emailPlaceholder: text.optional(), eventError: text.optional()
  }).strict()),
  descriptor('faq', z.object({title: text, items: z.array(z.object({question: text, answer: text}).strict())}).strict()),
  descriptor('weddingWeekend', z.object({eyebrow: text, title: text, body: text, tileFrameUrl: assetUrl.optional(), leafDividerUrl: assetUrl.optional(), palmSunsetUrl: assetUrl.optional(), events: z.array(z.object({dateLabel: text, title: text}).strict())}).strict()),
  descriptor('travelInfo', z.object({eyebrow: text, title: text, body: text, shellDividerUrl: assetUrl.optional(), flowerDividerUrl: assetUrl.optional(), palmDividerUrl: assetUrl.optional(), palmStampUrl: assetUrl.optional(), airports: z.array(z.object({code: text, name: text, location: text, frameUrl: assetUrl.optional(), illustrationUrl: assetUrl.optional(), illustrations: z.array(assetUrl).optional()}).strict())}).strict()),
  descriptor('bohoFooter', z.object({names: text, month: text, year: text, frameUrl: assetUrl.optional(), monogramUrl: assetUrl.optional(), starfishUrl: assetUrl.optional(), creditLine: text.optional(), creditName: text.optional()}).strict()),
  descriptor('credit', z.object({name: text.optional(), portfolioUrl: httpsUrl.optional(), portfolioLabel: text.optional(), monogramUrl: assetUrl.optional(), coupleNames: text.optional(), eventDate: text.optional(), creditLabel: text.optional()}).passthrough()),
  descriptor('hotelList', z.object({title: text, subtitle: text.optional(), hotels: z.array(z.object({name: text, imageUrl: assetUrl.optional(), pricePerNight: text.optional(), priceNote: text.optional(), bookingNote: text.optional(), city: text.optional(), distanceNote: text.optional(), phone: text.optional(), email: text.optional(), promoCode: text.optional(), websiteUrl: httpsUrl.optional(), websiteLabel: text.optional()}).strict()), closingNote: text.optional()}).strict()),
  descriptor('gallery', z.object({title: text.optional(), images: z.array(z.union([assetUrl, z.object({src: assetUrl, alt: text.optional()}).strict()])).optional()}).passthrough()),
  descriptor('locationTransport', z.object({}).passthrough())
]);
export const sectionType = z.enum(section.options.map(option => option.shape.type.value));
export const invitationData = z.object({template: templateMeta, theme, couple, event, media, copy, sections: z.array(section), schedule: z.array(scheduleItem).optional()}).strict();
export type TemplateMeta = z.infer<typeof templateMeta>;
export type Theme = z.infer<typeof theme>;
export type Couple = z.infer<typeof couple>;
export type Event = z.infer<typeof event>;
export type Media = z.infer<typeof media>;
export type Copy = z.infer<typeof copy>;
export type Section = z.infer<typeof section>;
export type SectionType = z.infer<typeof sectionType>;
export type InvitationData = z.infer<typeof invitationData>;
export type ParseResult<T> = {ok: true; data: T} | {ok: false; errors: {path: string; message: string}[]};
export function parseContract<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  return result.success ? {ok: true, data: result.data} : {
    ok: false, errors: result.error.issues.map(issue => ({path: issue.path.map(String).join('.'), message: issue.message}))
  };
}
export function parseInvitationData(input: unknown): ParseResult<InvitationData> {
  return parseContract(invitationData, input);
}
