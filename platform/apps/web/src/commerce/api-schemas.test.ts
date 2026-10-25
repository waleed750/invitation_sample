import {describe, expect, it} from 'vitest';
import {migrate} from '@platform/shared';
import {extractCoupleAndDate} from './api-schemas';

describe('extractCoupleAndDate', () => {
  it('reads checkout-seeded data', () => {
    expect(extractCoupleAndDate({couple: {first: 'سارة', second: 'علي'}, eventDate: '2027-06-15T12:00:00+02:00'}))
      .toEqual({couple: {first: 'سارة', second: 'علي'}, eventDate: '2027-06-15'});
  });

  it('reads a saved editor document (names and date live under meta)', () => {
    const doc = migrate({couple: {first: 'سارة', second: 'علي'}, eventDate: '2027-06-15'});
    const out = extractCoupleAndDate(doc);
    expect(out.couple.first).toBe('سارة');
    expect(out.eventDate).toBe('2027-06-15');
  });

  it('never throws on junk', () => {
    expect(extractCoupleAndDate(null)).toEqual({couple: {first: '', second: ''}, eventDate: ''});
  });
});
