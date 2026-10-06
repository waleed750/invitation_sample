
import {vi} from 'vitest';
vi.mock('next/font/google', () => ({
  Tajawal: () => ({variable: '--font-tajawal'}),
  Amiri: () => ({variable: '--font-amiri'}),
  Aref_Ruqaa: () => ({variable: '--font-aref-ruqaa'}),
  Fraunces: () => ({variable: '--font-fraunces'}),
  IBM_Plex_Sans_Arabic: () => ({variable: '--font-ibm-plex-sans-arabic'}),
  IBM_Plex_Sans: () => ({variable: '--font-ibm-plex-sans'}),
}));
import {describe, expect, it} from 'vitest';
import {getAfricaData} from '../data';
import {parseInvitationData} from '@platform/shared';
import fs from 'fs';
import path from 'path';

describe('africa template', () => {
  it('data validates against schema', () => {
    const data = getAfricaData();
    const result = parseInvitationData(data);
    expect(result.ok).toBe(true);
  });

  it('all assets map to legacy files that actually exist', () => {
    const data = getAfricaData();
    // find all asset paths
    const assetUrls: string[] = [];
    const findAssets = (obj: unknown) => {
      if (typeof obj === 'string' && obj.startsWith('/assets/drafts/africa/')) {
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
    const legacyAssets = path.join(monorepoRoot, '../public/assets/africa');
    if (!fs.existsSync(legacyAssets)) {
      console.warn('Legacy assets missing, skipping existence check');
      return;
    }
    for (const url of assetUrls) {
      const filename = url.replace('/assets/drafts/africa/', '');
      const legacyPath = path.join(legacyAssets, filename);
      expect(fs.existsSync(legacyPath)).toBe(true);
    }
  });
});
