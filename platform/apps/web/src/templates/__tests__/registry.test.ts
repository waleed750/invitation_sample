
import {vi} from 'vitest';
vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({variable: opts.variable || '--mock-font'}),
}));
import {describe, expect, it} from 'vitest';
import {parseInvitationData, resolveText} from '@platform/shared';
import {listLiveTemplates, listDraftTemplates, getTemplate, getTemplateAny, templates} from '../registry';

function assertHasArAndEn(value: unknown, path = ''): void {
  if (!value || typeof value !== 'object') return;
  if ('ar' in value || 'en' in value) {
    const loc = value as {ar?: unknown; en?: unknown};
    const hasAr = typeof loc.ar === 'string' && loc.ar.trim().length > 0;
    const hasEn = typeof loc.en === 'string' && loc.en.trim().length > 0;
    if (hasAr || hasEn) {
      expect(hasAr, `has en but missing ar at ${path}: "${String(loc.en)}"`).toBe(true);
      expect(hasEn, `has ar but missing en at ${path}: "${String(loc.ar)}"`).toBe(true);
    }
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertHasArAndEn(item, `${path}[${index}]`));
  } else {
    for (const [key, val] of Object.entries(value)) {
      if (key !== 'ar' && key !== 'en') {
        assertHasArAndEn(val, `${path}.${key}`);
      }
    }
  }
}

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

  describe('every registered template validates against shared Zod model and has ar + en text', () => {
    for (const [slug, template] of Object.entries(templates)) {
      it(`validates ${slug} contract and bilingual text`, () => {
        const nameAr = resolveText(template.entry.name, 'ar');
        const nameEn = resolveText(template.entry.name, 'en');
        const taglineAr = resolveText(template.entry.tagline, 'ar');
        const taglineEn = resolveText(template.entry.tagline, 'en');
        expect(nameAr.trim().length).toBeGreaterThan(0);
        expect(nameEn.trim().length).toBeGreaterThan(0);
        expect(taglineAr.trim().length).toBeGreaterThan(0);
        expect(taglineEn.trim().length).toBeGreaterThan(0);

        const data = template.getData();
        const parseResult = parseInvitationData(data);
        expect(parseResult.ok, `${slug} failed parseInvitationData: ${JSON.stringify(parseResult.ok ? null : parseResult.errors)}`).toBe(true);

        assertHasArAndEn(data, slug);
      });
    }
  });
});
