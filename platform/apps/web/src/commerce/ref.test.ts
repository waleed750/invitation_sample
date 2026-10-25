import {describe, expect, it} from 'vitest';
import {parseRefCookie} from './ref';

const now = new Date('2026-10-24T12:00:00Z');
const secs = (date: string) => Math.floor(new Date(date).getTime() / 1000);

describe('parseRefCookie', () => {
  it('reads a fresh cookie', () => {
    expect(parseRefCookie(`mona10.${secs('2026-10-20T10:00:00Z')}`, now)).toEqual({code: 'mona10', at: '2026-10-20T10:00:00.000Z'});
  });
  it('ignores a click older than 30 days', () => {
    expect(parseRefCookie(`mona10.${secs('2026-09-20T10:00:00Z')}`, now)).toBeUndefined();
  });
  it('ignores a click from the future, junk and nothing', () => {
    expect(parseRefCookie(`mona10.${secs('2026-10-30T10:00:00Z')}`, now)).toBeUndefined();
    expect(parseRefCookie('not a cookie', now)).toBeUndefined();
    expect(parseRefCookie('MONA10.1', now)).toBeUndefined();
    expect(parseRefCookie(undefined, now)).toBeUndefined();
  });
});
