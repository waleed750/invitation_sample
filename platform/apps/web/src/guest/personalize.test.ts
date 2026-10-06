import {describe, expect, it} from 'vitest';
import {getMashrabiyaData} from '../templates/mashrabiya/data';
import {applyPersonalization} from './personalize';
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
