import {Injectable, ServiceUnavailableException} from '@nestjs/common';
import {catalogEntry, fromDbTier, fromMinor, type CatalogEntry} from '@platform/shared';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {TemplatesRepository} from './templates.repository';

export type PublicCatalogEntry = Omit<CatalogEntry, 'assets'>;

/** Template-specific EGP price in whole major units, if the template has one. */
function overrideEgp(row: Record<string, unknown>): number | undefined {
  if (!Array.isArray(row.prices)) return undefined;
  for (const price of row.prices) {
    if (!isRecord(price) || price.currency !== 'EGP' || price.tier !== row.tier) continue;
    const minor = price.amount_minor;
    // The shared catalog contract only carries whole-EGP overrides.
    if (typeof minor === 'number' && Number.isSafeInteger(minor) && minor > 0 && minor % 100 === 0) return fromMinor(minor);
  }
  return undefined;
}

function toEntry(row: unknown): PublicCatalogEntry {
  if (!isRecord(row)) throw new ServiceUnavailableException('Template catalog unavailable');
  const parsed = catalogEntry.safeParse({
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    tier: typeof row.tier === 'string' ? fromDbTier(row.tier) : row.tier,
    priceOverrideEgp: overrideEgp(row),
    status: row.status,
    featured: row.featured,
    assets: []
  });
  if (!parsed.success) throw new ServiceUnavailableException('Template catalog unavailable');
  return {
    slug: parsed.data.slug,
    name: parsed.data.name,
    tagline: parsed.data.tagline,
    tier: parsed.data.tier,
    ...(parsed.data.priceOverrideEgp === undefined ? {} : {priceOverrideEgp: parsed.data.priceOverrideEgp}),
    status: parsed.data.status,
    featured: parsed.data.featured
  };
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly repository: TemplatesRepository,
    private readonly logger: AppLogger
  ) {}

  async listLive(): Promise<PublicCatalogEntry[]> {
    try {
      const result: unknown = await this.repository.listLive();
      if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) {
        this.logger.error('templates catalog lookup failed');
        throw new ServiceUnavailableException('Template catalog unavailable');
      }
      return result.data.map(toEntry);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('templates catalog lookup failed (unreachable)');
      throw new ServiceUnavailableException('Template catalog unavailable');
    }
  }
}
