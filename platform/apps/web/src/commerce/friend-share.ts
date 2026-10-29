import {FRIEND_CODE} from './ref';

export function inviteLink(siteUrl: string, locale: 'ar' | 'en', code: string): string {
  if (!FRIEND_CODE.test(code)) throw new RangeError('Invalid friend code');
  return `${siteUrl.replace(/\/+$/, '')}/${locale}/invite/${code}`;
}

export function inviteShareText(locale: 'ar' | 'en', link: string): string {
  return locale === 'ar'
    ? `أنشئ دعوتك على دعوتي من خلال رابط دعوتي: ${link}`
    : `Create your invitation on Invitely with my invite link: ${link}`;
}

export function whatsappInviteUrl(locale: 'ar' | 'en', link: string): string {
  return `https://wa.me/?text=${encodeURIComponent(inviteShareText(locale, link))}`;
}
