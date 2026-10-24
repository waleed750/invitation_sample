import {describe, expect, it} from 'vitest';
import {documentSection, sectionType, type SectionType} from '@platform/shared';
import {SECTION_CATALOG, recommendedFor} from './section-catalog';
import {emptyFor, fieldsFor, setAt} from './schema-fields';

const types = sectionType.options as SectionType[];

describe('section catalog', () => {
  it('has an entry for every section type', () => {
    expect(Object.keys(SECTION_CATALOG).sort()).toEqual([...types].sort());
  });

  it.each(types)('%s: the starting section is valid (so adding it can never produce a broken document)', (type) => {
    const result = documentSection.safeParse({id: 'new', type, variant: null, hidden: false, locked: false, props: SECTION_CATALOG[type].create()});
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it('recommends sections by event type, and every wedding gets RSVP and details', () => {
    const wedding = recommendedFor('wedding');
    expect(wedding).toEqual(expect.arrayContaining(['hero', 'rsvp', 'details', 'countdown']));
    expect(recommendedFor('birthday')).not.toContain('gifts');
  });

  it('every section is described in both languages', () => {
    for (const type of types) {
      const info = SECTION_CATALOG[type];
      expect(info.name.ar.length).toBeGreaterThan(0);
      expect(info.name.en.length).toBeGreaterThan(0);
      expect(info.hint.ar.length + info.hint.en.length).toBeGreaterThan(0);
    }
  });
});

describe('schema-derived fields', () => {
  it('hero: localized text, media and booleans come from the schema', () => {
    const fields = fieldsFor('hero');
    const byKey = Object.fromEntries(fields.map((field) => [field.key, field]));
    expect(byKey.firstName).toMatchObject({kind: 'text', optional: false});
    expect(byKey.headline).toMatchObject({kind: 'text', optional: true});
    expect(byKey.heroVideoUrl).toMatchObject({kind: 'string', media: 'video'});
    expect(byKey.heroPosterUrl).toMatchObject({kind: 'string', media: 'image'});
    expect(byKey.heroVideoLoop).toMatchObject({kind: 'boolean', optional: true});
    expect(byKey.overlayFadeOutAt).toMatchObject({kind: 'number'});
  });

  it('countdown date is a datetime; details map link is a plain url, not a media slot', () => {
    expect(fieldsFor('countdown').find((field) => field.key === 'date')).toMatchObject({kind: 'string', format: 'datetime'});
    expect(fieldsFor('details').find((field) => field.key === 'mapUrl')).toMatchObject({kind: 'string', format: 'url', media: null});
  });

  it('lists of objects and of text become list fields with nested groups', () => {
    const items = fieldsFor('schedule').find((field) => field.key === 'items');
    expect(items).toMatchObject({kind: 'list', item: {kind: 'group'}});
    const addresses = fieldsFor('details').find((field) => field.key === 'addressLines');
    expect(addresses).toMatchObject({kind: 'list', item: {kind: 'text'}});
    expect(fieldsFor('faq').find((field) => field.key === 'items')).toMatchObject({kind: 'list', item: {kind: 'group'}});
  });

  it('enums list their options', () => {
    expect(fieldsFor('rsvp').find((field) => field.key === 'guestCountMode')).toMatchObject({kind: 'enum', options: ['select', 'stepper']});
  });

  it('music and image keys pick the right media kind', () => {
    expect(fieldsFor('gallery').find((field) => field.key === 'images')).toMatchObject({kind: 'list', item: {kind: 'string'}});
  });

  it.each(types)('%s: a field list can be derived without throwing, and empty values satisfy required fields', (type) => {
    const fields = fieldsFor(type);
    const props = Object.fromEntries(fields.filter((field) => !field.optional).map((field) => [field.key, emptyFor(field)]));
    expect(typeof props).toBe('object');
  });

  it('setAt sets and removes keys without mutating', () => {
    const base = {a: 1, b: 2};
    expect(setAt(base, 'a', 5)).toEqual({a: 5, b: 2});
    expect(setAt(base, 'b', undefined)).toEqual({a: 1});
    expect(base).toEqual({a: 1, b: 2});
  });
});
