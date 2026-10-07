import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, it, vi} from 'vitest';

vi.mock('next/font/google', () => ({
  Tajawal: () => ({variable: '--font-tajawal'}),
  Amiri: () => ({variable: '--font-amiri'}),
  Aref_Ruqaa: () => ({variable: '--font-aref-ruqaa'}),
  Fraunces: () => ({variable: '--font-fraunces'}),
  IBM_Plex_Sans_Arabic: () => ({variable: '--font-ibm-plex-sans-arabic'}),
  IBM_Plex_Sans: () => ({variable: '--font-ibm-plex-sans'}),
  Cormorant_Garamond: () => ({variable: '--font-cormorant-garamond'}),
  Inter: () => ({variable: '--font-inter'}),
}));

import {catalogEntry, isPubliclyListed, parseInvitationData, priceFor} from '@platform/shared';
import {getRiwaqData, riwaqData} from '../riwaq/data';
import {getTemplate, getTemplateAny, listDraftTemplates, listLiveTemplates} from '../registry';

const cssPath = path.resolve(__dirname, '../../engine/styles/templates/riwaq.css');
const publicDir = path.resolve(__dirname, '../../../public');
const scope = '.invitation-shell[data-template="riwaq"]';

describe('riwaq template', () => {
  it('passes parseInvitationData with the video-open intro and no scraped media', () => {
    const data = getRiwaqData();
    expect(data.template.introType).toBe('video-open');
    expect(data.template.layoutFamily).toBe('classic');
    expect(data.media.introVideoUrl).toBe('/assets/demo/riwaq/intro-video.mp4');
    expect(data.media.musicUrl).toBe('/assets/demo/riwaq/background-music.mp3');
    expect(parseInvitationData(riwaqData).ok).toBe(true);
  });

  it('is a private draft: valid catalog entry, classic price, not publicly listed', () => {
    const template = getTemplateAny('riwaq');
    expect(template).toBeDefined();
    if (!template) return;
    const entry = catalogEntry.parse(template.entry);
    expect(entry.status).toBe('draft');
    expect(entry.featured).toBe(false);
    expect(isPubliclyListed(entry)).toBe(false);
    expect(priceFor(entry)).toBe(1299);
    expect(getTemplate('riwaq')).toBeUndefined();
    expect(listLiveTemplates().some((item) => item.entry.slug === 'riwaq')).toBe(false);
    expect(listDraftTemplates().some((item) => item.entry.slug === 'riwaq')).toBe(true);
  });

  it('lists only original assets that exist on disk, and every asset the data/CSS use', () => {
    const template = getTemplateAny('riwaq');
    if (!template) throw new Error('missing riwaq');
    const listed = new Set(template.entry.assets.map((asset) => asset.path));
    for (const asset of template.entry.assets) {
      expect(asset.source).toBe('ai-generated');
      expect(asset.license.length).toBeGreaterThan(20);
      expect(asset.license).not.toMatch(/thedigitalyes|scrape/i);
      expect(fs.existsSync(path.join(publicDir, asset.path.replace(/^\//, '')))).toBe(true);
    }
    const used = `${JSON.stringify(riwaqData)}\n${fs.readFileSync(cssPath, 'utf8')}`.match(/\/assets\/[^"')\s]+/g) ?? [];
    for (const asset of used) expect(listed.has(asset), `${asset} not in catalog assets`).toBe(true);
  });

  it('contains no forbidden strings in data, CSS, assets or the licence list', () => {
    const template = getTemplateAny('riwaq');
    if (!template) throw new Error('missing riwaq');
    const licence = fs.readFileSync(path.resolve(publicDir, '../ASSET_LICENSES.md'), 'utf8').toLowerCase();
    const haystacks = [JSON.stringify(riwaqData), fs.readFileSync(cssPath, 'utf8'), JSON.stringify(template.entry.assets)].map((s) => s.toLowerCase());
    for (const forbidden of ['thedigitalyes', 'typekit', '/assets/drafts', '/assets/demo/video-open', 'peninsula', 'bosphorus', 'istanbul', 'legacy-scrape']) {
      for (const text of haystacks) expect(text).not.toContain(forbidden);
      if (!['/assets/drafts', 'peninsula', 'bosphorus', 'istanbul', 'legacy-scrape'].includes(forbidden)) expect(licence).not.toContain(forbidden);
    }
  });

  it('scopes every CSS selector under the riwaq data-template', () => {
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
    const urls = JSON.stringify(riwaqData).match(/https?:\/\/[^"]+/g) ?? [];
    for (const url of urls) expect(url).toContain('google.com/maps');
    expect(fs.readFileSync(cssPath, 'utf8')).not.toMatch(/url\(\s*["']?https?:/i);
  });
});
