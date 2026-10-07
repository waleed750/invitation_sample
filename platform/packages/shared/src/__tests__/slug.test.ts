import {describe, expect, it} from 'vitest';
import {RESERVED_SLUGS, isReservedSlug, isValidSlug, slugCandidates, slugProblem} from '../index';

describe('slug', () => {
  it('accepts well-formed slugs', () => {
    for (const s of ['abc', 'ahmed-mona-2026', 'a1b', 'x'.repeat(60)]) expect(isValidSlug(s)).toBe(true);
  });

  it('rejects malformed slugs', () => {
    const bad = ['', 'ab', 'x'.repeat(61), 'Ahmed', '-abc', 'abc-', 'a--b', 'a_b', 'a b', 'أحمد', 'a.b', 'a/b'];
    for (const s of bad) expect(isValidSlug(s)).toBe(false);
  });

  it('flags reserved words', () => {
    for (const s of ['admin', 'api', 'app', 'www', 'i', 'edit', 'ar', 'en', 'login', 'pricing', 'templates', 'checkout', 'support', 'help', 'about', 'terms', 'privacy']) {
      expect(isReservedSlug(s)).toBe(true);
    }
    expect(isReservedSlug('ahmed-mona')).toBe(false);
  });

  it('reserved words are lowercase and unique', () => {
    expect(new Set(RESERVED_SLUGS).size).toBe(RESERVED_SLUGS.length);
    for (const s of RESERVED_SLUGS) expect(s).toBe(s.toLowerCase());
  });

  it('slugProblem prefers invalid over reserved', () => {
    expect(slugProblem('Admin')).toBe('invalid');
    expect(slugProblem('admin')).toBe('reserved');
    expect(slugProblem('ahmed-mona')).toBeNull();
  });

  it('builds valid candidates', () => {
    const list = slugCandidates('ahmed-mona', 2026, () => 7);
    expect(list.slice(0, 3)).toEqual(['ahmed-mona-2026', 'ahmed-mona-2', 'ahmed-mona-007']);
    expect(list.every(isValidSlug)).toBe(true);
  });

  it('drops candidates that would exceed the length limit', () => {
    expect(slugCandidates('x'.repeat(59), 2026, () => 1)).toEqual([]);
  });
});
