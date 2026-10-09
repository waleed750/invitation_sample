import {Injectable} from '@nestjs/common';
import {allJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface LiveTemplateRow {
  slug: string;
  name: unknown;
  tagline: unknown;
  tier: string;
  status: string;
  featured: boolean;
  prices: {tier: string; currency: string; amount_minor: number}[];
}

/** Data access for the template catalog. */
@Injectable()
export class TemplatesRepository {
  constructor(private readonly db: DbService) {}

  /**
   * Live templates in catalog order (anonymous role, RLS applies). Each row embeds
   * its visible (active) `prices` rows; the service picks the template-specific EGP one.
   */
  async listLive(): Promise<LiveTemplateRow[]> {
    return this.db.asAnon(async (tx) =>
      allJson(await tx<JsonRow<LiveTemplateRow>[]>`
        select to_jsonb(t) as r from (
          select tpl.slug, tpl.name, tpl.tagline, tpl.tier, tpl.status, tpl.featured, tpl.sort_order,
            coalesce((
              select jsonb_agg(jsonb_build_object('tier', p.tier, 'currency', p.currency, 'amount_minor', p.amount_minor))
              from public.prices p where p.template_id = tpl.id
            ), '[]'::jsonb) as prices
          from public.templates tpl where tpl.status = 'live'
        ) t order by t.sort_order asc`));
  }
}
