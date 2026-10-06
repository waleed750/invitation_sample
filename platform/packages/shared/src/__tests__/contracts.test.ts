import {describe, expect, it} from 'vitest';
import {invitationData as videoData} from '../../../../../src/sites/video-open-invitation/data.js';
import {laceScratchData} from '../../../../../src/sites/lace-photo-scratch/data.js';
import {SECTION_TYPES} from '../../../../../src/registry/schema.js';
import {
  assetUrl, invitationData, localizedText, parseInvitationData, parseThemeSpec,
  resolveText, section, type InvitationData, type Section, type SectionType, type ThemeSpec
} from '../index';

const minimal: InvitationData = {
  template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
  theme: {background: '#fff', foreground: 'black', muted: '#888888', ivory: 'ivory'},
  couple: {firstName: {ar: 'أحمد'}, secondName: 'Nour'},
  event: {date: '2026-06-20T20:00:00+03:00'}, media: {}, copy: {}, sections: []
};
const fixtures = {
  hero: {firstName: 'A', secondName: 'B', displayDate: 'Tomorrow'},
  countdown: {date: '2026-06-20T20:00:00+03:00'},
  welcome: {title: 'Welcome', body: {ar: 'مرحبا'}},
  schedule: {title: 'Day', subtitle: 'Programme', items: [{title: 'Dinner', description: 'Together'}]},
  details: {title: 'Venue', subtitle: 'Details', venue: 'Garden', startTime: '8 PM', endTime: '12 AM', mapUrl: 'https://example.com/map'},
  map: {src: 'https://example.com/map'},
  messageForm: {title: 'Message', subtitle: 'Leave a note', custom: true},
  imageDivider: {imageUrl: '/image.jpg'}, footer: {ornamentUrl: '/ornament.png'},
  scratchReveal: {photoUrl: '/photo.jpg', label: 'Save the date', firstName: 'A', secondName: 'B', date: {en: '20 June'}, location: 'Cairo'},
  story: {title: 'Our story', chapters: [{prose: 'Once upon a time', photos: ['/photo.jpg']}]},
  dressCode: {title: 'Dress code', body: 'Formal'}, gifts: {title: 'Gifts', body: 'Thank you'},
  rsvp: {title: 'RSVP', subtitle: 'Join us'}, faq: {title: 'FAQ', items: [{question: 'When?', answer: 'Tomorrow'}]},
  weddingWeekend: {eyebrow: 'Weekend', title: 'Celebrate', body: 'Join us', events: [{dateLabel: 'Friday', title: 'Dinner'}]},
  travelInfo: {eyebrow: 'Travel', title: 'Getting here', body: 'Fly', airports: [{code: 'CAI', name: 'Cairo', location: 'Egypt'}]},
  bohoFooter: {names: 'A & B', month: 'June', year: '2026'},
  credit: {custom: 'Credit'}, hotelList: {title: 'Stay', hotels: [{name: 'Hotel', imageUrl: '/hotel.jpg'}]},
  gallery: {custom: ['/photo.jpg']}, locationTransport: {custom: 'Bus'}
} satisfies {[K in SectionType]: Extract<Section, {type: K}>['props']};

// Include a malformed known property wherever the JSDoc specifies one.
const invalidProps: Record<SectionType, unknown> = {
  hero: {...fixtures.hero, firstName: 1}, countdown: {date: 'tomorrow'}, welcome: {...fixtures.welcome, body: {}},
  schedule: {...fixtures.schedule, items: [{title: 1, description: 'x'}]}, details: {...fixtures.details, mapUrl: '/map'},
  map: {src: '/untrusted-local-map'}, messageForm: {...fixtures.messageForm, title: 1},
  imageDivider: {imageUrl: 'javascript:alert(1)'}, footer: {ornamentUrl: 'data:image/png,x'},
  scratchReveal: {...fixtures.scratchReveal, photoUrl: 'http://example.com/photo'},
  story: {...fixtures.story, chapters: [{prose: 'x', photos: [1]}]}, dressCode: {...fixtures.dressCode, body: 1},
  gifts: {...fixtures.gifts, buttonUrl: 'javascript:alert(1)'}, rsvp: {...fixtures.rsvp, title: 1},
  faq: {...fixtures.faq, items: [{question: 'x', answer: 1}]}, weddingWeekend: {...fixtures.weddingWeekend, events: [{title: 'x'}]},
  travelInfo: {...fixtures.travelInfo, airports: [{code: 'CAI'}]}, bohoFooter: {...fixtures.bohoFooter, names: 1},
  credit: null, hotelList: {...fixtures.hotelList, hotels: [{name: 1}]}, gallery: [], locationTransport: 'invalid'
};

describe('invitation contracts', () => {
  it('parses a minimal invitation', () => expect(parseInvitationData(minimal)).toEqual({ok: true, data: minimal}));
  it('parses a mashrabiya layout family', () => {
    const data = {...minimal, template: {...minimal.template, layoutFamily: 'mashrabiya' as const}};
    expect(parseInvitationData(data)).toEqual({ok: true, data});
  });
  it('covers exactly every legacy section type', () => expect(Object.keys(fixtures).sort()).toEqual(Object.keys(SECTION_TYPES).sort()));
  for (const type of Object.keys(fixtures) as SectionType[]) {
    it(`accepts ${type}`, () => expect(section.safeParse({type, props: fixtures[type]}).success).toBe(true));
    it(`rejects invalid ${type}`, () => expect(section.safeParse({type, props: invalidProps[type]}).success).toBe(false));
  }
  it('round-trips both real legacy data objects without stripping fields', () => {
    for (const data of [videoData, laceScratchData]) {
      const parsed = parseInvitationData(data);
      expect(parsed).toEqual({ok: true, data});
      if (parsed.ok) expect(parseInvitationData(JSON.parse(JSON.stringify(parsed.data)))).toEqual(parsed);
    }
  });
  it('reports readable nested paths', () => {
    const result = parseInvitationData({...minimal, sections: [
      {type: 'hero', props: fixtures.hero}, {type: 'welcome', props: fixtures.welcome}, {type: 'footer', props: fixtures.footer},
      {type: 'schedule', props: invalidProps.schedule}
    ]});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual({path: 'sections.3.props.items.0.title', message: expect.any(String)});
  });
  it('rejects unknown properties outside the four open props types', () => {
    expect(invitationData.safeParse({...minimal, surprise: true}).success).toBe(false);
    expect(section.safeParse({type: 'welcome', props: {...fixtures.welcome, surprise: true}}).success).toBe(false);
    expect(section.safeParse({type: 'credit', props: {}, surprise: true}).success).toBe(false);
  });
  it('rejects invalid enum values', () => expect(parseInvitationData({...minimal, template: {...minimal.template, introType: 'script'}}).ok).toBe(false));
});

describe('URLs and localization', () => {
  it.each(['javascript:alert(1)', 'data:image/png;base64,abc', 'http://example.com', '//example.com/a', '/\\evil.com', '/\nevil', 'https://', 'https://user:password@example.com', 'https://example.com\\evil'])('rejects unsafe URL %s', value => {
    expect(assetUrl.safeParse(value).success).toBe(false);
    expect(parseInvitationData({...minimal, media: {photoUrl: value}}).ok).toBe(false);
  });
  it.each(['/assets/photo.jpg', '/', 'https://example.com/photo.jpg?x=1'])('accepts asset URL %s', value => expect(assetUrl.safeParse(value).success).toBe(true));
  it('restricts map sources, except for the exact legacy embed', () => {
    expect(section.safeParse({type: 'map', props: {src: '/maps/embed/index.html'}}).success).toBe(true);
    expect(section.safeParse({type: 'map', props: {src: '/maps/embed/index.html?x=1'}}).success).toBe(false);
    expect(parseInvitationData({...minimal, event: {...minimal.event, mapUrl: '/maps/embed/index.html'}}).ok).toBe(false);
  });
  it('resolves plain text, requested locale, both fallback directions, and empty strings', () => {
    expect(resolveText('Hello', 'ar')).toBe('Hello');
    expect(resolveText({ar: 'مرحبا', en: 'Hello'}, 'en')).toBe('Hello');
    expect(resolveText({ar: 'مرحبا'}, 'en')).toBe('مرحبا');
    expect(resolveText({en: 'Hello'}, 'ar')).toBe('Hello');
    expect(resolveText({en: 'Hello'}, 'ar', 'ar')).toBe('Hello');
    expect(resolveText({ar: '', en: 'Hello'}, 'ar')).toBe('');
    expect(resolveText({}, 'ar')).toBe('');
  });
  it.each([{}, {fr: 'Bonjour'}, {ar: undefined}, {ar: 1}])('rejects invalid localized object %j', value => expect(localizedText.safeParse(value).success).toBe(false));
});

const spec: ThemeSpec = {
  id: 'nile-sunset', tokens: {colors: {background: '#fff', foreground: 'rgb(10, 20, 30)'}, fonts: {display: 'Amiri', body: 'Cairo'}, radius: 12, spacing: 'airy'},
  layout: {intro: 'video-open', sections: [{type: 'hero', variant: 'full-bleed-video'}]},
  assets: {intro: 'r2://bucket/intro.mp4', music: 'lib://oud-01', photo: '/photo.jpg'},
  motion: {reveal: 'fade-up', durationScale: 1}, copy: {locale: ['ar', 'en'], tone: 'romantic-formal'}
};
describe('Theme Spec', () => {
  it('parses valid theme specs', () => expect(parseThemeSpec(spec)).toEqual({ok: true, data: spec}));
  it.each(['red; color: blue', 'red{', 'red}', 'url(https://evil.com)', 'URL (x)', '#12345', 'not-a-color', 'r\\65 d'])('rejects unsafe or invalid color %s', color => {
    expect(parseThemeSpec({...spec, tokens: {...spec.tokens, colors: {background: color}}}).ok).toBe(false);
  });
  it.each([0.49, 2.01, Infinity, NaN])('rejects durationScale %s', durationScale => expect(parseThemeSpec({...spec, motion: {...spec.motion, durationScale}}).ok).toBe(false));
  it.each([0.5, 2])('accepts duration boundary %s', durationScale => expect(parseThemeSpec({...spec, motion: {...spec.motion, durationScale}}).ok).toBe(true));
  it.each(['data:x', 'javascript:x', 'r2://', 'lib://', 'http://example.com'])('rejects invalid asset %s', asset => expect(parseThemeSpec({...spec, assets: {asset}}).ok).toBe(false));
  it('rejects empty/duplicate locales, unknown sections and unknown keys', () => {
    for (const locale of [[], ['ar', 'ar'], ['fr']]) expect(parseThemeSpec({...spec, copy: {...spec.copy, locale}}).ok).toBe(false);
    expect(parseThemeSpec({...spec, layout: {...spec.layout, sections: [{type: 'unknown'}]}}).ok).toBe(false);
    expect(parseThemeSpec({...spec, extra: true}).ok).toBe(false);
  });
});
