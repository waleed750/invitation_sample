import {describe, expect, it} from 'vitest';
import {THEME_PRESETS, migrate, type InvitationDocument} from '@platform/shared';
import {HISTORY_LIMIT, canRedo, canUndo, initialState, reducer, type EditorState} from './state';

const t = (value: string) => ({ar: value, en: value});
function doc(): InvitationDocument {
  return migrate({
    template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
    theme: {background: '#fbf6ee', foreground: '#2a2118', muted: '#7a6a58', ivory: '#fffdf8'},
    couple: {firstName: t('A'), secondName: t('B')}, event: {date: t('2027-01-01')}, media: {}, copy: {},
    sections: [
      {type: 'hero', id: 'hero', props: {firstName: t('A'), secondName: t('B'), displayDate: t('soon')}},
      {type: 'faq', id: 'faq', props: {title: t('FAQ'), items: []}}
    ]
  });
}
const start = (): EditorState => initialState(doc(), 'v1');
const withTitle = (state: EditorState, title: string): InvitationDocument => ({
  ...state.doc, sections: state.doc.sections.map((s) => (s.id === 'faq' ? {...s, props: {...s.props, title: t(title)}} : s))
});

describe('editor reducer', () => {
  it('applies section operations through the shared pure functions and selects the new section', () => {
    let s = reducer(start(), {type: 'addSection', section: {type: 'faq', props: {title: t('x'), items: []}}, index: 1});
    expect(s.doc.sections.map((x) => x.type)).toEqual(['hero', 'faq', 'faq']);
    expect(s.selectedId).toBe(s.doc.sections[1]?.id);
    s = reducer(s, {type: 'moveSection', id: 'faq', toIndex: 0});
    expect(s.doc.sections[0]?.id).toBe('faq');
    s = reducer(s, {type: 'duplicateSection', id: 'hero'});
    expect(s.doc.sections.filter((x) => x.type === 'hero')).toHaveLength(2);
    s = reducer(s, {type: 'toggleHidden', id: 'hero'});
    expect(s.doc.sections.find((x) => x.id === 'hero')?.hidden).toBe(true);
    s = reducer(s, {type: 'setVariant', id: 'hero', variant: 'v2'});
    expect(s.doc.sections.find((x) => x.id === 'hero')?.variant).toBe('v2');
    s = reducer(s, {type: 'applyTheme', preset: THEME_PRESETS[1]!});
    expect(s.doc.theme.presetId).toBe('midnight-gold');
    expect(s.status).toBe('unsaved');
  });

  it('undoes and redoes every step', () => {
    let s = reducer(start(), {type: 'removeSection', id: 'faq'});
    expect(canUndo(s)).toBe(true);
    s = reducer(s, {type: 'undo'});
    expect(s.doc.sections.map((x) => x.id)).toEqual(['hero', 'faq']);
    expect(s.status).toBe('saved');
    expect(canRedo(s)).toBe(true);
    s = reducer(s, {type: 'redo'});
    expect(s.doc.sections.map((x) => x.id)).toEqual(['hero']);
    expect(reducer(start(), {type: 'undo'})).toEqual(start());
  });

  it('keeps only the last 50 steps', () => {
    let s = start();
    for (let i = 0; i < HISTORY_LIMIT + 20; i += 1) s = reducer(s, {type: 'toggleHidden', id: 'faq'});
    expect(s.past).toHaveLength(HISTORY_LIMIT);
  });

  it('a new edit clears redo', () => {
    let s = reducer(start(), {type: 'removeSection', id: 'faq'});
    s = reducer(s, {type: 'undo'});
    s = reducer(s, {type: 'toggleHidden', id: 'faq'});
    expect(canRedo(s)).toBe(false);
  });

  it('reports a refused operation instead of throwing, and keeps the document', () => {
    const locked = {...start().doc, sections: start().doc.sections.map((x) => (x.id === 'hero' ? {...x, locked: true} : x))};
    let s = initialState(locked, 'v1');
    s = reducer(s, {type: 'removeSection', id: 'hero'});
    expect(s.errorCode).toBe('section_locked');
    expect(s.doc).toEqual(locked);
    expect(s.past).toHaveLength(0);
  });

  it('merges typing in one field into a single undo step', () => {
    let s = start();
    for (const title of ['F', 'FA', 'FAQ?']) s = reducer(s, {type: 'edit', doc: withTitle(s, title), coalesceKey: `faq.title.${title.length > 0 ? 'k' : ''}`});
    expect(s.past).toHaveLength(1);
    s = reducer(s, {type: 'undo'});
    expect((s.doc.sections[1]?.props.title as {ar: string}).ar).toBe('FAQ');
  });

  it('tracks save status: saving, saved, offline, conflict and edits during a save', () => {
    let s = reducer(start(), {type: 'toggleHidden', id: 'faq'});
    expect(s.status).toBe('unsaved');
    s = reducer(s, {type: 'saveStarted'});
    expect(s.status).toBe('saving');
    const inFlight = s.doc;
    s = reducer(s, {type: 'toggleHidden', id: 'faq'});
    s = reducer(s, {type: 'saveSucceeded', savedDoc: inFlight, version: 'v2'});
    expect(s.version).toBe('v2');
    expect(s.status).toBe('unsaved');
    s = reducer(s, {type: 'saveFailed', status: 'offline'});
    expect(s.status).toBe('offline');
    s = reducer(s, {type: 'online'});
    expect(s.status).toBe('unsaved');
    s = reducer(s, {type: 'saveFailed', status: 'conflict', errorCode: 'edit_conflict'});
    expect(s.status).toBe('conflict');
    expect(reducer(s, {type: 'saveStarted'}).status).toBe('conflict');
    expect(reducer(s, {type: 'toggleHidden', id: 'faq'}).status).toBe('conflict');
  });
});
