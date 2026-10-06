import {describe, expect, it} from 'vitest';
import {TIERS, catalogEntry, fromDbTier, isPubliclyListed, priceFor, toDbTier, type DbTier, type Tier} from '../index';

const entry = {
  slug: 'garden-romance',
  name: {ar: 'حديقة رومانسية', en: 'Garden Romance'},
  tagline: {ar: 'دعوة زفاف', en: 'A wedding invitation'},
  tier: 'classic',
  status: 'live',
  assets: [{path: 'hero.jpg', source: 'original', license: 'owned'}]
} as const;

describe('catalog', () => {
  it('accepts live templates when every asset is licensed', () => {
    const result = catalogEntry.parse(entry);
    expect(result.featured).toBe(false);
  });

  it('rejects live templates with an unlicensed asset', () => {
    const result = catalogEntry.safeParse({...entry, assets: [{path: 'hero.jpg', source: 'original', license: ''}]});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('live templates need a license on every asset');
  });

  it('accepts draft templates with an unlicensed asset', () => {
    expect(catalogEntry.safeParse({...entry, status: 'draft', assets: [{path: 'hero.jpg', source: 'original', license: ''}]}).success).toBe(true);
  });

  it('uses tier prices and same-tier overrides only', () => {
    const parsed = catalogEntry.parse(entry);
    const overridden = catalogEntry.parse({...entry, priceOverrideEgp: 1500});
    expect(priceFor(parsed)).toBe(TIERS.classic.price);
    expect(priceFor(overridden)).toBe(1500);
    expect(priceFor(overridden, 'premium')).toBe(TIERS.premium.price);
  });

  it('identifies live entries as publicly listed', () => {
    expect(isPubliclyListed(catalogEntry.parse(entry))).toBe(true);
    expect(isPubliclyListed(catalogEntry.parse({...entry, status: 'retired'}))).toBe(false);
  });
});

describe('tier mappings and features', () => {
  it.each([
    ['save-the-date', 'save_the_date'],
    ['classic', 'classic'],
    ['premium', 'premium']
  ] satisfies [Tier, DbTier][])('round trips %s through database tier %s', (tier, dbTier) => {
    expect(toDbTier(tier)).toBe(dbTier);
    expect(fromDbTier(dbTier)).toBe(tier);
  });

  it('rejects unknown database tiers', () => expect(() => fromDbTier('enterprise')).toThrow(RangeError));

  it('defines feature access for every tier', () => {
    expect(TIERS['save-the-date']).toMatchObject({rsvpLimit: 0, videoIntro: false, musicUpload: false, guestMessages: false, prioritySupport: false});
    expect(TIERS.classic).toMatchObject({rsvpLimit: 300, videoIntro: false, musicUpload: false, guestMessages: false, prioritySupport: false});
    expect(TIERS.premium).toMatchObject({rsvpLimit: null, videoIntro: true, musicUpload: true, guestMessages: true, prioritySupport: true});
  });
});
