import {describe, expect, it} from 'vitest';
import {invitationDocument, migrate} from '@platform/shared';
import {applyDetails, eventTimestamp, readDetails, readLocalized, setLocalized} from './couple';
import {startingDocument} from './initial-document';
import {SUGGESTIONS, suggestionsFor} from './suggestions';

const t = (v: string) => ({ar: v, en: v});
const legacy = {
  template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
  theme: {background: '#fbf6ee', foreground: '#2a2118', muted: '#7a6a58', ivory: '#fffdf8'},
  couple: {firstName: t('A'), secondName: t('B')}, event: {date: t('2027-01-01')}, media: {}, copy: {},
  sections: [
    {type: 'hero', id: 'hero', props: {firstName: t('A'), secondName: t('B'), displayDate: t('x')}},
    {type: 'countdown', id: 'cd', props: {date: '2027-01-01T19:30:00+02:00'}}
  ]
};

describe('applyDetails', () => {
  it('updates names and date in the header and in every section that repeats them', () => {
    const doc = applyDetails(migrate(legacy), {first: 'سارة', second: 'علي', date: '2027-06-15'}, 'ar');
    expect(invitationDocument.safeParse(doc).success).toBe(true);
    expect(readLocalized(doc.meta.couple.firstName, 'ar')).toBe('سارة');
    expect(readLocalized(doc.meta.couple.firstName, 'en')).toBe('A');
    const hero = doc.sections.find((s) => s.type === 'hero');
    expect((hero?.props.firstName as {ar: string}).ar).toBe('سارة');
    expect((hero?.props.displayDate as {ar: string; en: string}).en).toBe('15 June 2027');
    expect(doc.sections.find((s) => s.type === 'countdown')?.props.date).toBe(eventTimestamp('2027-06-15'));
    expect(readDetails(doc, 'ar')).toEqual({first: 'سارة', second: 'علي', date: '2027-06-15'});
  });

  it('only touches what is given and never mutates the input', () => {
    const original = migrate(legacy);
    const snapshot = JSON.stringify(original);
    const next = applyDetails(original, {second: 'Ali'}, 'en');
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(readLocalized(next.meta.couple.firstName, 'en')).toBe('A');
    expect(readLocalized(next.meta.couple.secondName, 'en')).toBe('Ali');
  });

  it('setLocalized keeps the other language', () => {
    expect(setLocalized({ar: 'a', en: 'b'}, 'en', 'c')).toEqual({ar: 'a', en: 'c'});
    expect(setLocalized('plain', 'ar', 'x')).toEqual({ar: 'x', en: 'plain'});
    expect(setLocalized(undefined, 'ar', 'x')).toEqual({ar: 'x', en: 'x'});
  });
});

describe('startingDocument', () => {
  const stub = migrate({event_date: '2027-06-15', eventDate: '2027-06-15', couple: {first: 'سارة', second: 'علي'}});
  it('keeps a document that already has sections', () => {
    const full = migrate(legacy);
    expect(startingDocument(full, null, 'premium')).toBe(full);
  });
  it('starts a new order from the template design with the customer names and date', () => {
    const doc = startingDocument(stub, legacy as never, 'premium');
    expect(doc?.sections.length).toBe(2);
    expect(readDetails(doc!, 'ar')).toMatchObject({first: 'سارة', second: 'علي', date: '2027-06-15'});
    expect(invitationDocument.safeParse(doc).success).toBe(true);
  });
  it('drops sections the plan does not allow when seeding from a template', () => {
    const tpl = JSON.parse(JSON.stringify(legacy)) as {sections: {type: string; id: string; props: unknown}[]};
    tpl.sections.push({type: 'rsvp', id: 'rsvp', props: {title: {ar: 'a', en: 'a'}, subtitle: {ar: 'b', en: 'b'}}});
    const free = startingDocument(stub, tpl as never, 'save-the-date');
    expect(free?.sections.some((x) => x.type === 'rsvp')).toBe(false);
    const paid = startingDocument(stub, tpl as never, 'classic');
    expect(paid?.sections.some((x) => x.type === 'rsvp')).toBe(true);
  });
  it('without template data it returns the stored document', () => {
    expect(startingDocument(stub, null, 'premium')).toBe(stub);
  });
});

describe('suggestions', () => {
  it('are curated in both languages', () => {
    expect(Object.keys(SUGGESTIONS).length).toBeGreaterThan(10);
    for (const [key, list] of Object.entries(SUGGESTIONS)) {
      expect(list.length, key).toBeGreaterThan(0);
      for (const item of list) {
        expect(item.ar.trim(), key).not.toBe('');
        expect(item.en.trim(), key).not.toBe('');
      }
    }
    expect(suggestionsFor('welcome', 'body').some((s) => s.ar.includes('وَمِنْ آيَاتِهِ'))).toBe(true);
    expect(suggestionsFor('nope', 'x')).toEqual([]);
  });
});
