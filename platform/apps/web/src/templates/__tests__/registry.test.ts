
import {vi} from 'vitest';
vi.mock('next/font/google', () => ({
  Tajawal: () => ({variable: '--font-tajawal'}),
  Amiri: () => ({variable: '--font-amiri'}),
  Aref_Ruqaa: () => ({variable: '--font-aref-ruqaa'}),
  Fraunces: () => ({variable: '--font-fraunces'}),
  IBM_Plex_Sans_Arabic: () => ({variable: '--font-ibm-plex-sans-arabic'}),
  IBM_Plex_Sans: () => ({variable: '--font-ibm-plex-sans'}),
  Cormorant_Garamond: () => ({variable: "--font-cormorant-garamond"}),
  Inter: () => ({variable: "--font-inter"}),
}));
import {describe, expect, it} from 'vitest';
import {listLiveTemplates, listDraftTemplates, getTemplate, getTemplateAny} from '../registry';

describe('registry', () => {
  it('does not list draft templates as live', () => {
    const live = listLiveTemplates();
    expect(live.some(t => t.entry.slug === 'africa')).toBe(false);
  });

  it('lists draft templates separately', () => {
    const drafts = listDraftTemplates();
    expect(drafts.some(t => t.entry.slug === 'africa')).toBe(true);
  });

  it('getTemplate only finds live templates', () => {
    expect(getTemplate('mashrabiya')).toBeDefined();
    expect(getTemplate('africa')).toBeUndefined();
  });

  it('getTemplateAny finds all templates', () => {
    expect(getTemplateAny('mashrabiya')).toBeDefined();
    expect(getTemplateAny('africa')).toBeDefined();
  });
});
