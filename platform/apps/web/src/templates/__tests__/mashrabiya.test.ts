import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, it, vi} from 'vitest';

vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({variable: opts.variable || '--mock-font'}),
}));

import {catalogEntry, isPubliclyListed, parseInvitationData, priceFor} from '@platform/shared';
import {getMashrabiyaData, mashrabiyaData} from '../mashrabiya/data';
import {getTemplate, listLiveTemplates} from '../registry';

describe('mashrabiya template', () => {
  it('passes parseInvitationData contract', () => {
    const data = getMashrabiyaData();
    expect(data.template.layoutFamily).toBe('mashrabiya');
    expect(data.template.introType).toBe('tap-to-open');
    expect(data.template.eventType).toBe('wedding');
    expect(data.sections).toHaveLength(12);

    const parseResult = parseInvitationData(mashrabiyaData);
    expect(parseResult.ok).toBe(true);
  });

  it('validates catalog entry, price, and public listing', () => {
    const template = getTemplate('mashrabiya');
    expect(template).toBeDefined();
    if (!template) return;

    const parsedEntry = catalogEntry.parse(template.entry);
    expect(parsedEntry.slug).toBe('mashrabiya');
    expect(parsedEntry.tier).toBe('classic');
    expect(parsedEntry.status).toBe('live');
    expect(isPubliclyListed(parsedEntry)).toBe(true);

    expect(priceFor(parsedEntry)).toBe(1299);

    const liveTemplates = listLiveTemplates();
    expect(liveTemplates.some((item) => item.entry.slug === 'mashrabiya')).toBe(true);
  });

  it('ensures every asset path in the entry exists on disk under apps/web/public', () => {
    const template = getTemplate('mashrabiya');
    expect(template).toBeDefined();
    if (!template) return;

    const publicDir = path.resolve(__dirname, '../../../public');
    for (const asset of template.entry.assets) {
      const relativePath = asset.path.replace(/^\//, '');
      const assetOnDisk = path.join(publicDir, relativePath);
      expect(fs.existsSync(assetOnDisk)).toBe(true);
    }
  });

  it('contains no forbidden strings in data, CSS, or asset list', () => {
    const template = getTemplate('mashrabiya');
    expect(template).toBeDefined();
    if (!template) return;

    const cssPath = path.resolve(__dirname, '../../engine/styles/templates/mashrabiya.css');
    const licensePath = path.resolve(__dirname, '../../../ASSET_LICENSES.md');

    const serializedData = JSON.stringify(mashrabiyaData);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const serializedAssets = JSON.stringify(template.entry.assets);
    const licenseContent = fs.readFileSync(licensePath, 'utf8');

    const forbiddenStrings = ['thedigitalyes', 'typekit', '/assets/demo/video-open'];

    for (const forbidden of forbiddenStrings) {
      expect(serializedData.toLowerCase()).not.toContain(forbidden);
      expect(cssContent.toLowerCase()).not.toContain(forbidden);
      expect(serializedAssets.toLowerCase()).not.toContain(forbidden);
      expect(licenseContent.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('ensures every CSS selector line is scoped under .invitation-shell[data-layout="mashrabiya"]', () => {
    const cssPath = path.resolve(__dirname, '../../engine/styles/templates/mashrabiya.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const lines = cssContent.split('\n');

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]?.trim() ?? '';
      if (!line || line.startsWith('/*') || line.startsWith('*') || line.endsWith('*/')) {
        continue;
      }

      if (line.startsWith('@media') || line.startsWith('@keyframes') || line.startsWith('@font-face')) {
        continue;
      }

      if (line === '{' || line === '}') {
        continue;
      }

      // Check selector lines (ending with { or ,)
      if (line.endsWith('{') || line.endsWith(',')) {
        expect(
          line.startsWith('.invitation-shell[data-layout="mashrabiya"]'),
          `Line ${index + 1} selector lacks data-layout scope: "${line}"`,
        ).toBe(true);
      }
    }
  });

  it('ensures CSS uses logical properties only with no physical left/right rules', () => {
    const cssPath = path.resolve(__dirname, '../../engine/styles/templates/mashrabiya.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const lines = cssContent.split('\n');

    const physicalPatterns = [
      /\bleft\s*:/i,
      /\bright\s*:/i,
      /margin-left\s*:/i,
      /margin-right\s*:/i,
      /padding-left\s*:/i,
      /padding-right\s*:/i,
      /border-left\s*:/i,
      /border-right\s*:/i,
      /text-align:\s*(left|right)/i,
      /float:\s*(left|right)/i,
    ];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      for (const pattern of physicalPatterns) {
        expect(pattern.test(line), `Line ${index + 1} contains physical direction: "${line.trim()}"`).toBe(false);
      }
    }
  });
});
