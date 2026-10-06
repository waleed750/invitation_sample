import {describe, expect, it} from 'vitest';
import {sectionKey} from '../section-key';
import {getTimeLeft} from '../countdown';
import {videoOpenData, getVideoOpenData} from '../../data/demo/video-open';
import {parseInvitationData} from '@platform/shared';
import {introKindFor} from '../intro-kind';

describe('intro kinds', () => {
  it.each([
    ['video-open', 'video'],
    ['scratch-reveal', 'scratch'],
    ['tap-to-open', 'shutters'],
    ['envelope', 'envelope'],
    ['none', 'none']
  ] as const)('maps %s to %s', (introType, expected) => {
    expect(introKindFor(introType)).toBe(expected);
  });
});

describe('section keys', () => {
  it('prefers an explicit id, including a deliberately empty id at the helper boundary', () => {
    expect(sectionKey({type: 'welcome', id: 'our-welcome'}, 2)).toBe('our-welcome');
    expect(sectionKey({type: 'welcome', id: ''}, 2)).toBe('');
  });
  it('distinguishes repeated sections by index', () => {
    expect(sectionKey({type: 'imageDivider'}, 0)).toBe('imageDivider-0');
    expect(sectionKey({type: 'imageDivider'}, 1)).toBe('imageDivider-1');
  });
});

describe('remaining countdown time', () => {
  const now = Date.parse('2026-06-18T17:00:00Z');
  it('splits whole days, hours, minutes and seconds', () => {
    expect(getTimeLeft(now + 2 * 86400000 + 3 * 3600000 + 4 * 60000 + 5999, now))
      .toEqual({days: 2, hours: 3, minutes: 4, seconds: 5});
  });
  it('handles the event instant, past dates and invalid timestamps', () => {
    for (const target of [now, now - 1, NaN, Infinity]) {
      expect(getTimeLeft(target, now)).toEqual({days: 0, hours: 0, minutes: 0, seconds: 0});
    }
  });
  it('uses absolute instants across timezone offsets', () => {
    expect(getTimeLeft(Date.parse('2026-06-20T20:00:00+03:00'), Date.parse('2026-06-20T16:59:59Z')))
      .toEqual({days: 0, hours: 0, minutes: 0, seconds: 1});
  });
  it('rolls units over at exact boundaries', () => {
    expect(getTimeLeft(now + 86400000, now)).toEqual({days: 1, hours: 0, minutes: 0, seconds: 0});
    expect(getTimeLeft(now + 86399999, now)).toEqual({days: 0, hours: 23, minutes: 59, seconds: 59});
  });
});

describe('video-open demo contract', () => {
  it('validates without losing data at the render boundary', () => {
    expect(parseInvitationData(videoOpenData)).toEqual({ok: true, data: videoOpenData});
    expect(getVideoOpenData()).toEqual(videoOpenData);
  });
  it('contains the original English and translated Arabic copy', () => {
    expect(getVideoOpenData().couple.headline).toEqual({ar: 'نحتفل بخطوبتنا', en: "We're Getting Engaged"});
  });
});
