import {describe, expect, it} from 'vitest';
import {parseFriendCookie, parseRefCookie} from './ref';

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

describe('parseFriendCookie', () => {
  it('accepts only the friend code format', () => {
    expect(parseFriendCookie('f-abcd2345')).toBe('f-abcd2345');
    for (const value of [undefined, 'f-ABCD2345', 'f-abc01234', 'f-abcdo234', 'f-abcd2345.extra', 'mona10']) {
      expect(parseFriendCookie(value)).toBeUndefined();
    }
  });
});
