import type {Invitation} from './types';

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createShareSlug(couple: {first: string; second: string}, randomSuffix = crypto.randomUUID().replaceAll('-', '').slice(0, 6)): string {
  const names = `${couple.first}-${couple.second}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return names || `invite-${randomSuffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6).padEnd(6, '0')}`;
}

export function legacyShareSlug(id: string): string {
  const suffix = id.toLowerCase().replace(/[^a-z0-9]/g, '').slice(-6).padStart(6, '0');
  return `invite-${suffix}`;
}

export function shareUrl(invitation: Pick<Invitation, 'id'> & Partial<Pick<Invitation, 'shareSlug'>>, locale: 'ar' | 'en'): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const base = new URL(configured);
  if (base.protocol !== 'http:' && base.protocol !== 'https:') throw new RangeError('Invalid public site URL');
  const slug = invitation.shareSlug && SAFE_SLUG.test(invitation.shareSlug)
    ? invitation.shareSlug
    : legacyShareSlug(invitation.id);
  return new URL(`/${locale}/i/${slug}`, base).toString();
}
