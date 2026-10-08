import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, it, vi} from 'vitest';

vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({variable: opts.variable || '--mock-font'}),
}));

import {catalogEntry, isPubliclyListed, parseInvitationData, priceFor} from '@platform/shared';
import {getRawdaData, rawdaData} from '../rawda/data';
import {getTemplate, getTemplateAny, listDraftTemplates, listLiveTemplates} from '../registry';

const cssPath = path.resolve(__dirname, '../../engine/styles/templates/rawda.css');
const publicDir = path.resolve(__dirname, '../../../public');
const scope = '.invitation-shell[data-template="rawda"]';

describe('rawda template', () => {
  it('passes parseInvitationData with the curtain intro and no media', () => {
    const data = getRawdaData();
    expect(data.template.introType).toBe('tap-to-open');
    expect(data.template.layoutFamily).toBe('classic');
    expect(data.media.introVideoUrl).toBeUndefined();
    expect(data.media.musicUrl).toBeUndefined();
    expect(parseInvitationData(rawdaData).ok).toBe(true);
  });

  it('is a private draft: valid catalog entry, classic price, not publicly listed', () => {
    const template = getTemplateAny('rawda');
    expect(template).toBeDefined();
    if (!template) return;
    const entry = catalogEntry.parse(template.entry);
    expect(entry.status).toBe('draft');
    expect(entry.featured).toBe(false);
    expect(isPubliclyListed(entry)).toBe(false);
    expect(priceFor(entry)).toBe(1299);
    expect(getTemplate('rawda')).toBeUndefined();
    expect(listLiveTemplates().some((item) => item.entry.slug === 'rawda')).toBe(false);
    expect(listDraftTemplates().some((item) => item.entry.slug === 'rawda')).toBe(true);
  });

  it('lists only original assets that exist on disk, and every asset the data/CSS use', () => {
    const template = getTemplateAny('rawda');
    if (!template) throw new Error('missing rawda');
    const listed = new Set(template.entry.assets.map((asset) => asset.path));
    for (const asset of template.entry.assets) {
      expect(asset.source).toBe('original');
      expect(asset.license).toBe('original, © Invitely');
      expect(fs.existsSync(path.join(publicDir, asset.path.replace(/^\//, '')))).toBe(true);
    }
    const used = `${JSON.stringify(rawdaData)}\n${fs.readFileSync(cssPath, 'utf8')}`.match(/\/assets\/[^"')\s]+/g) ?? [];
    for (const asset of used) expect(listed.has(asset), `${asset} not in catalog assets`).toBe(true);
  });

  it('contains no forbidden strings in data, CSS, assets or the licence list', () => {
    const template = getTemplateAny('rawda');
    if (!template) throw new Error('missing rawda');
    const licence = fs.readFileSync(path.resolve(publicDir, '../ASSET_LICENSES.md'), 'utf8').toLowerCase();
    const haystacks = [JSON.stringify(rawdaData), fs.readFileSync(cssPath, 'utf8'), JSON.stringify(template.entry.assets)].map((s) => s.toLowerCase());
    for (const asset of template.entry.assets) haystacks.push(fs.readFileSync(path.join(publicDir, asset.path), 'utf8').toLowerCase());
    for (const forbidden of ['thedigitalyes', 'typekit', '/assets/drafts', '/assets/demo/video-open']) {
      for (const text of haystacks) expect(text).not.toContain(forbidden);
      if (forbidden !== '/assets/drafts') expect(licence).not.toContain(forbidden);
    }
  });

  it('scopes every CSS selector under the rawda data-template', () => {
    const css = fs.readFileSync(cssPath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    const preludes = [...css.matchAll(/([^{};]+)\{/g)].map((match) => match[1].trim());
    expect(preludes.length).toBeGreaterThan(20);
    for (const prelude of preludes) {
      if (prelude.startsWith('@')) continue;
      for (const selector of prelude.split(/,(?![^(]*\))/)) {
        expect(selector.trim().startsWith(scope), `unscoped selector: "${selector.trim()}"`).toBe(true);
      }
    }
  });

  it('uses logical properties only', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    for (const pattern of [/\bleft\s*:/i, /\bright\s*:/i, /(margin|padding|border)-(left|right)\s*:/i, /text-align:\s*(left|right)/i, /float:\s*(left|right)/i]) {
      expect(pattern.test(css), String(pattern)).toBe(false);
    }
  });

  it('has no external image URLs (only the maps link is https)', () => {
    const urls = JSON.stringify(rawdaData).match(/https?:\/\/[^"]+/g) ?? [];
    for (const url of urls) expect(url).toContain('google.com/maps');
    expect(fs.readFileSync(cssPath, 'utf8')).not.toMatch(/url\(\s*["']?https?:/i);
  });
});
