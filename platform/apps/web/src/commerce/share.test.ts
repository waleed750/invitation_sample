import {afterEach, describe, expect, it} from 'vitest';
import {createShareSlug, legacyShareSlug, shareUrl} from './share';

afterEach(() => { delete process.env.NEXT_PUBLIC_SITE_URL; });

describe('invitation sharing', () => {
  it('uses slugified Latin couple names and a safe fallback', () => {
    expect(createShareSlug({first: 'Nour Hán', second: 'Omar'}, 'abcdef')).toBe('nour-han-omar');
    expect(createShareSlug({first: 'نور', second: 'عمر'}, 'ABC123')).toBe('invite-abc123');
    expect(legacyShareSlug('inv_order_123')).toBe('invite-der123');
  });

  it('builds a localized absolute URL and supports invitations from old cookies', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://invite.example/base';
    expect(shareUrl({id: 'inv_1', shareSlug: 'nour-omar'}, 'ar')).toBe('https://invite.example/ar/i/nour-omar');
    expect(shareUrl({id: 'inv_123'}, 'en')).toBe('https://invite.example/en/i/invite-inv123');
  });
});
