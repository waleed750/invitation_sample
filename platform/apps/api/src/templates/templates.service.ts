import {Injectable, ServiceUnavailableException} from '@nestjs/common';
import {catalogEntry, fromDbTier, type CatalogEntry} from '@platform/shared';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {SupabaseService} from '../supabase/supabase.service';

export type PublicCatalogEntry = Omit<CatalogEntry, 'assets'>;

function toEntry(row: unknown): PublicCatalogEntry {
  if (!isRecord(row)) throw new ServiceUnavailableException('Template catalog unavailable');
  const parsed = catalogEntry.safeParse({
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    tier: typeof row.tier === 'string' ? fromDbTier(row.tier) : row.tier,
    priceOverrideEgp: row.price_override_egp === null ? undefined : row.price_override_egp,
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
    private readonly supabase: SupabaseService,
    private readonly logger: AppLogger
  ) {}

  async listLive(): Promise<PublicCatalogEntry[]> {
    try {
      const result: unknown = await this.supabase.public().from('templates')
        .select('slug,name,tagline,tier,price_override_egp,status,featured')
        .eq('status', 'live')
        .order('sort_order', {ascending: true});
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
