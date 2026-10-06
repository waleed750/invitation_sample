import {z} from 'zod';
import {localizedText} from './localized';
import {TIERS, TIER_ORDER, type Tier} from './entitlement';

const asset = z.object({path: z.string().min(1), source: z.string().min(1), license: z.string()}).strict();

export const catalogEntry = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: localizedText,
  tagline: localizedText,
  tier: z.enum(TIER_ORDER),
  priceOverrideEgp: z.number().int().positive().optional(),
  status: z.enum(['draft', 'live', 'retired']),
  featured: z.boolean().default(false),
  assets: z.array(asset)
}).strict().refine(entry => entry.status !== 'live' || entry.assets.every(item => item.license.length > 0), {
  message: 'live templates need a license on every asset'
});
export type CatalogEntry = z.infer<typeof catalogEntry>;

export function priceFor(entry: CatalogEntry, tier: Tier = entry.tier): number {
  return entry.priceOverrideEgp !== undefined && tier === entry.tier ? entry.priceOverrideEgp : TIERS[tier].price;
}

export function isPubliclyListed(entry: CatalogEntry): boolean {
  return entry.status === 'live';
}
