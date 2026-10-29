import {describe, expect, it} from 'vitest';
import {inviteLink, inviteShareText, whatsappInviteUrl} from './friend-share';

describe('friend invite sharing', () => {
  const link = 'https://example.test/ar/invite/f-abcd2345';

  it('builds locale-specific links without duplicate slashes', () => {
    expect(inviteLink('https://example.test/', 'ar', 'f-abcd2345')).toBe(link);
    expect(inviteLink('https://example.test', 'en', 'f-abcd2345')).toBe('https://example.test/en/invite/f-abcd2345');
    expect(() => inviteLink('https://example.test', 'ar', 'bad')).toThrow(RangeError);
  });

  it('includes the link in Arabic and English WhatsApp text', () => {
    expect(inviteShareText('ar', link)).toContain(link);
    expect(inviteShareText('ar', link)).toContain('دعوتي');
    expect(inviteShareText('en', link)).toContain('Invitely');
    expect(decodeURIComponent(whatsappInviteUrl('ar', link))).toContain(inviteShareText('ar', link));
  });
});
