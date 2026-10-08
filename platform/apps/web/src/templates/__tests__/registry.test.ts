
import {vi} from 'vitest';
vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({variable: opts.variable || '--mock-font'}),
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
