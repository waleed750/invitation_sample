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
import {getExcellenceData} from '../data';
import {parseInvitationData} from '@platform/shared';
import fs from 'fs';
import path from 'path';

describe('excellence template', () => {
  it('data validates against schema', () => {
    const data = getExcellenceData();
    const result = parseInvitationData(data);
    expect(result.ok).toBe(true);
  });

  it('all assets map to legacy files that actually exist', () => {
    const data = getExcellenceData();
    const assetUrls: string[] = [];
    const findAssets = (obj: unknown) => {
      if (typeof obj === 'string' && obj.startsWith('/assets/drafts/excellence/')) {
        assetUrls.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(findAssets);
      } else if (obj !== null && typeof obj === 'object') {
        Object.values(obj).forEach(findAssets);
      }
    };
    findAssets(data);
    expect(assetUrls.length).toBeGreaterThan(0);

    const monorepoRoot = path.resolve(__dirname, '../../../../../..');
    const legacyAssets = path.join(monorepoRoot, '../public/assets/excellence');
    if (!fs.existsSync(legacyAssets)) {
      console.warn('Legacy assets missing, skipping existence check');
      return;
    }
    for (const url of assetUrls) {
      const filename = url.replace('/assets/drafts/excellence/', '');
      const legacyPath = path.join(legacyAssets, filename);
      expect(fs.existsSync(legacyPath)).toBe(true);
    }
  });
});
