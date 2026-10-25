import {migrate, toggleHidden} from '@platform/shared';
import {describe, expect, it} from 'vitest';
import {getMashrabiyaData} from '../templates/mashrabiya/data';
import {applyPersonalization, renderDocument} from './personalize';
import type {PublishedSnapshot} from './store';

const snapshot = (tier: PublishedSnapshot['tier']): PublishedSnapshot => ({
  shareSlug: 'nour-ali', templateSlug: 'mashrabiya', tier,
  couple: {first: 'نور', second: 'علي'}, eventDate: '2026-06-20',
  publishedAt: '2026-01-01T00:00:00.000Z', onlineUntil: '2026-07-20T00:00:00.000Z', locale: 'ar',
});

describe('applyPersonalization', () => {
  it('returns a new validated invitation with Arabic personalization and a countdown-safe date', () => {
    const source = getMashrabiyaData();
    const result = applyPersonalization(source, snapshot('premium'), 'ar');
    expect(result).not.toBe(source);
    expect(result.couple).toMatchObject({firstName: 'نور', secondName: 'علي'});
    expect(result.event).toMatchObject({date: '2026-06-20T19:30:00+02:00', displayDate: '20 يونيو 2026'});
    expect(source.couple.firstName).not.toBe('نور');
  });

  it('formats English dates and updates hero/countdown section data', () => {
    const result = applyPersonalization(getMashrabiyaData(), {...snapshot('premium'), couple: {first: 'Nour', second: 'Ali'}}, 'en');
    expect(result.event.displayDate).toBe('20 June 2026');
    expect(result.sections.find((section) => section.type === 'hero')?.props).toMatchObject({firstName: 'Nour', secondName: 'Ali', displayDate: '20 June 2026'});
    expect(result.sections.find((section) => section.type === 'countdown')?.props).toMatchObject({date: '2026-06-20T19:30:00+02:00'});
  });

  it('removes forms that are unavailable in the purchased tier', () => {
    expect(applyPersonalization(getMashrabiyaData(), snapshot('save-the-date'), 'ar').sections.some((section) => section.type === 'rsvp' || section.type === 'messageForm')).toBe(false);
    const classic = applyPersonalization(getMashrabiyaData(), snapshot('classic'), 'ar');
    expect(classic.sections.some((section) => section.type === 'rsvp')).toBe(true);
    expect(classic.sections.some((section) => section.type === 'messageForm')).toBe(false);
    const premium = applyPersonalization(getMashrabiyaData(), snapshot('premium'), 'ar');
    expect(premium.sections.some((section) => section.type === 'rsvp')).toBe(true);
    expect(premium.sections.some((section) => section.type === 'messageForm')).toBe(true);
  });
});

describe('renderDocument', () => {
  const t = (v: string) => ({ar: v, en: v});
  const doc = (types: string[]) => migrate({
    template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
    theme: {background: '#fbf6ee', foreground: '#2a2118', muted: '#7a6a58', ivory: '#fffdf8'},
    couple: {firstName: t('A'), secondName: t('B')}, event: {date: t('2027-01-01')}, media: {}, copy: {},
    sections: types.map((type) => type === 'hero'
      ? {type, id: type, props: {firstName: t('A'), secondName: t('B'), displayDate: t('d')}}
      : type === 'rsvp' ? {type, id: type, props: {title: t('r'), subtitle: t('s')}} : {type, id: type, props: {title: t('m'), subtitle: t('s')}})
  });

  it('renders the published sections and drops hidden ones', () => {
    const hidden = toggleHidden(doc(['hero', 'rsvp']), 'rsvp');
    expect(renderDocument(hidden, 'classic').sections.map((s) => s.type)).toEqual(['hero']);
  });

  it('drops sections the plan does not include (rsvp for save-the-date, guestbook below premium)', () => {
    const all = doc(['hero', 'rsvp', 'messageForm']);
    expect(renderDocument(all, 'save-the-date').sections.map((s) => s.type)).toEqual(['hero']);
    expect(renderDocument(all, 'classic').sections.map((s) => s.type)).toEqual(['hero', 'rsvp']);
    expect(renderDocument(all, 'premium').sections.map((s) => s.type)).toEqual(['hero', 'rsvp', 'messageForm']);
  });
});
