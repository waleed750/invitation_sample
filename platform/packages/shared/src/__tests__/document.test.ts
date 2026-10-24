import {describe, expect, it} from 'vitest';
import {
  AUTO_ID_PREFIX, DocumentError, THEME_PRESETS, addSection, applyThemePreset, checkDocumentAgainstPlan, checkLockedSections,
  duplicateSection, invitationDocument, migrate, moveSection, planRules, removeSection, setVariant, toInvitationData, toggleHidden,
  type InvitationDocument
} from '../document';
import {parseInvitationData} from '../invitation';

const ar = (value: string) => ({ar: value, en: value});

function legacy(overrides: Record<string, unknown> = {}) {
  return {
    template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
    theme: {background: '#fbf6ee', foreground: '#2a2118', muted: '#7a6a58', ivory: '#fffdf8'},
    couple: {firstName: ar('نور'), secondName: ar('عمر')},
    event: {date: ar('2027-03-20')},
    media: {},
    copy: {},
    sections: [
      {type: 'hero', id: 'hero', props: {firstName: ar('نور'), secondName: ar('عمر'), displayDate: ar('٢٠ مارس')}},
      {type: 'countdown', props: {date: '2027-03-20T18:00:00+02:00'}},
      {type: 'rsvp', id: 'rsvp', props: {title: ar('تأكيد'), subtitle: ar('يسعدنا حضوركم')}}
    ],
    ...overrides
  };
}

function baseDoc(): InvitationDocument {
  return migrate(legacy());
}

// Small deterministic PRNG so the property tests are repeatable.
function prng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('migrate / toInvitationData', () => {
  it('turns legacy invitation data into a valid v1 document', () => {
    const doc = baseDoc();
    expect(invitationDocument.safeParse(doc).success).toBe(true);
    expect(doc.sections.map((item) => item.type)).toEqual(['hero', 'countdown', 'rsvp']);
    expect(doc.sections[1]?.id.startsWith(AUTO_ID_PREFIX)).toBe(true);
    expect(doc.sections[0]?.id).toBe('hero');
  });

  it('round-trips legacy data exactly', () => {
    const input = legacy({schedule: [{title: ar('الحفل'), time: '8 pm'}]});
    expect(parseInvitationData(input).ok).toBe(true);
    expect(toInvitationData(migrate(input))).toEqual(input);
  });

  it('is idempotent on a current document', () => {
    const doc = baseDoc();
    expect(migrate(doc)).toEqual(doc);
    expect(migrate(migrate(doc))).toEqual(doc);
  });

  it('upgrades the small object checkout stores', () => {
    const doc = migrate({event_date: '2027-06-15', eventDate: '2027-06-15', couple: {first: 'سارة', second: 'علي'}});
    expect(invitationDocument.safeParse(doc).success).toBe(true);
    expect(doc.meta.couple).toEqual({firstName: 'سارة', secondName: 'علي'});
    expect(doc.meta.event.date).toBe('2027-06-15');
    expect(doc.sections).toEqual([]);
  });

  it('rejects things that are not invitation data', () => {
    for (const bad of [null, 'x', 3, [], {}, {foo: 1}]) {
      expect(() => migrate(bad)).toThrowError(DocumentError);
    }
  });

  it('leaves hidden sections out of the rendered legacy form', () => {
    const doc = toggleHidden(baseDoc(), 'rsvp');
    expect(toInvitationData(doc).sections.map((item) => item.type)).toEqual(['hero', 'countdown']);
  });
});

describe('section operations', () => {
  const ids = (doc: InvitationDocument) => doc.sections.map((item) => item.id);

  it('adds at an index and keeps ids unique even when the id is taken', () => {
    let n = 0;
    const next = () => `new-${String(++n)}`;
    const doc = addSection(baseDoc(), {type: 'faq', props: {title: ar('أسئلة'), items: []}, id: 'hero'}, 1, next);
    expect(doc.sections).toHaveLength(4);
    expect(doc.sections[1]?.type).toBe('faq');
    expect(new Set(ids(doc)).size).toBe(4);
    expect(doc.sections[1]?.id).toBe('new-1');
  });

  it('never mutates its input', () => {
    const doc = baseDoc();
    const snapshot = JSON.stringify(doc);
    removeSection(doc, 'rsvp');
    moveSection(doc, 'rsvp', 0);
    duplicateSection(doc, 'hero');
    toggleHidden(doc, 'hero');
    setVariant(doc, 'hero', 'v2');
    applyThemePreset(doc, THEME_PRESETS[1]!);
    expect(JSON.stringify(doc)).toBe(snapshot);
  });

  it('moves a section and keeps the others in relative order', () => {
    const doc = moveSection(baseDoc(), 'rsvp', 0);
    expect(ids(doc)[0]).toBe('rsvp');
    expect(ids(doc).slice(1)).toEqual(['hero', `${AUTO_ID_PREFIX}countdown-2`]);
  });

  it('duplicates right after the original with a new unlocked id', () => {
    const doc = duplicateSection(baseDoc(), 'hero');
    expect(doc.sections[1]?.type).toBe('hero');
    expect(doc.sections[1]?.id).not.toBe('hero');
    expect(doc.sections[1]?.locked).toBe(false);
  });

  it('toggles hidden and sets variants', () => {
    const hidden = toggleHidden(baseDoc(), 'hero');
    expect(hidden.sections[0]?.hidden).toBe(true);
    expect(toggleHidden(hidden, 'hero').sections[0]?.hidden).toBe(false);
    expect(setVariant(baseDoc(), 'hero', 'v2').sections[0]?.variant).toBe('v2');
  });

  it('applies a theme preset', () => {
    const doc = applyThemePreset(baseDoc(), THEME_PRESETS[1]!);
    expect(doc.theme.presetId).toBe('midnight-gold');
    expect(doc.theme.colors).toEqual(THEME_PRESETS[1]!.colors);
    expect(invitationDocument.safeParse(doc).success).toBe(true);
  });

  it('refuses to touch locked sections but allows adding around them', () => {
    const locked: InvitationDocument = {...baseDoc(), sections: baseDoc().sections.map((item) => (item.id === 'hero' ? {...item, locked: true} : item))};
    expect(() => removeSection(locked, 'hero')).toThrowError(/locked/);
    expect(() => moveSection(locked, 'hero', 2)).toThrowError(/locked/);
    expect(() => toggleHidden(locked, 'hero')).toThrowError(/locked/);
    expect(() => setVariant(locked, 'hero', 'x')).toThrowError(/locked/);
    expect(addSection(locked, {type: 'faq', props: {title: ar('x'), items: []}}, 0).sections).toHaveLength(4);
  });

  it('reports unknown ids and bad indexes with a code', () => {
    const doc = baseDoc();
    expect(() => removeSection(doc, 'nope')).toThrowError(expect.objectContaining({code: 'section_not_found'}));
    expect(() => moveSection(doc, 'hero', 9)).toThrowError(expect.objectContaining({code: 'index_out_of_range'}));
    expect(() => addSection(doc, {type: 'faq', props: {title: ar('x'), items: []}}, -1)).toThrowError(expect.objectContaining({code: 'index_out_of_range'}));
  });

  it('keeps invariants over many random operation sequences', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const random = prng(seed);
      let doc = baseDoc();
      doc = {...doc, sections: doc.sections.map((item) => (item.id === 'hero' ? {...item, locked: true} : item))};
      for (let step = 0; step < 40; step += 1) {
        const before = doc;
        const pick = () => doc.sections[Math.floor(random() * doc.sections.length)]?.id ?? 'none';
        try {
          const roll = Math.floor(random() * 6);
          if (roll === 0) doc = addSection(doc, {type: 'faq', props: {title: ar('x'), items: []}}, Math.floor(random() * (doc.sections.length + 1)));
          else if (roll === 1) doc = removeSection(doc, pick());
          else if (roll === 2) doc = moveSection(doc, pick(), Math.floor(random() * doc.sections.length));
          else if (roll === 3) doc = duplicateSection(doc, pick());
          else if (roll === 4) doc = toggleHidden(doc, pick());
          else doc = setVariant(doc, pick(), random() < 0.5 ? null : 'v1');
        } catch (error) {
          expect(error).toBeInstanceOf(DocumentError);
          doc = before;
        }
        expect(new Set(ids(doc)).size).toBe(doc.sections.length);
        expect(invitationDocument.safeParse(doc).success).toBe(true);
        const hero = doc.sections.find((item) => item.id === 'hero');
        expect(hero).toEqual(baseDoc().sections.find((item) => item.id === 'hero') && {...baseDoc().sections[0]!, locked: true});
      }
    }
  });
});

describe('plan rules', () => {
  it('limits section types per plan', () => {
    expect(planRules('save-the-date').allowedSectionTypes.has('rsvp')).toBe(false);
    expect(planRules('save-the-date').allowedSectionTypes.has('messageForm')).toBe(false);
    expect(planRules('classic').allowedSectionTypes.has('rsvp')).toBe(true);
    expect(planRules('classic').allowedSectionTypes.has('messageForm')).toBe(false);
    expect(planRules('premium').allowedSectionTypes.has('messageForm')).toBe(true);
  });

  it('reports disallowed types and too many sections', () => {
    expect(checkDocumentAgainstPlan(baseDoc(), 'classic')).toEqual([]);
    expect(checkDocumentAgainstPlan(baseDoc(), 'save-the-date')).toEqual([{code: 'section_not_allowed', sectionId: 'rsvp', type: 'rsvp'}]);
    let big = baseDoc();
    for (let i = 0; i < 9; i += 1) big = addSection(big, {type: 'faq', props: {title: ar('x'), items: []}});
    expect(checkDocumentAgainstPlan(big, 'save-the-date').some((v) => v.code === 'too_many_sections')).toBe(true);
    expect(checkDocumentAgainstPlan(big, 'classic').some((v) => v.code === 'too_many_sections')).toBe(false);
  });

  it('detects edits to locked sections, removals and reordering of locked sections', () => {
    const lockedDoc: InvitationDocument = {...baseDoc(), sections: baseDoc().sections.map((item) => (item.type !== 'countdown' ? {...item, locked: true} : item))};
    expect(checkLockedSections(lockedDoc, lockedDoc)).toEqual([]);
    const edited = {...lockedDoc, sections: lockedDoc.sections.map((item) => (item.id === 'hero' ? {...item, props: {...item.props, displayDate: ar('x')}} : item))};
    expect(checkLockedSections(lockedDoc, edited)).toEqual([{code: 'section_locked', sectionId: 'hero'}]);
    const removed = {...lockedDoc, sections: lockedDoc.sections.filter((item) => item.id !== 'rsvp')};
    expect(checkLockedSections(lockedDoc, removed)).toEqual([{code: 'section_locked', sectionId: 'rsvp'}]);
    const reordered = {...lockedDoc, sections: [lockedDoc.sections[2]!, lockedDoc.sections[1]!, lockedDoc.sections[0]!]};
    expect(checkLockedSections(lockedDoc, reordered).map((v) => v.sectionId).sort()).toEqual(['hero', 'rsvp']);
    // moving the unlocked countdown around the locked ones is fine
    const moved = {...lockedDoc, sections: [lockedDoc.sections[1]!, lockedDoc.sections[0]!, lockedDoc.sections[2]!]};
    expect(checkLockedSections(lockedDoc, moved)).toEqual([]);
  });
});
