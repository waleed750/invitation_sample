import {vi} from 'vitest';
vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({variable: opts.variable || '--mock-font'}),
}));
import {describe, expect, it} from 'vitest';
import {getCitystarsData} from '../data';
import {parseInvitationData} from '@platform/shared';
import fs from 'fs';
import path from 'path';

describe('citystars template', () => {
  it('data validates against schema', () => {
    const data = getCitystarsData();
    const result = parseInvitationData(data);
    expect(result.ok).toBe(true);
  });

  it('all assets map to legacy files that actually exist', () => {
    const data = getCitystarsData();
    const assetUrls: string[] = [];
    const findAssets = (obj: unknown) => {
      if (typeof obj === 'string' && obj.startsWith('/assets/drafts/citystars/')) {
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
    const legacyAssets = path.join(monorepoRoot, '../public/assets/citystars');
    if (!fs.existsSync(legacyAssets)) {
      console.warn('Legacy assets missing, skipping existence check');
      return;
    }
    for (const url of assetUrls) {
      const filename = url.replace('/assets/drafts/citystars/', '');
      const legacyPath = path.join(legacyAssets, filename);
      expect(fs.existsSync(legacyPath)).toBe(true);
    }
  });
});
