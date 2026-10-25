import {Injectable} from '@nestjs/common';
import {allJson, firstJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface TemplateListRow {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  tier: string;
  category: string | null;
  event_type: string | null;
  status: string;
  featured: boolean;
  sort_order: number;
  asset_count: number;
  unlicensed_count: number;
  updated_at: string;
}

export interface TemplateDetailRow extends TemplateListRow {
  tagline: unknown;
  sample_data_ar: unknown;
  sample_data_en: unknown;
}

export interface TemplateAssetRow {
  id: string;
  r2_key: string;
  kind: string | null;
  size_bytes: number | null;
  source: string | null;
  license: string | null;
  license_url: string | null;
  created_at: string;
}

@Injectable()
export class AdminTemplatesRepository {
  constructor(private readonly db: DbService) {}

  async list(): Promise<TemplateListRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<TemplateListRow>[]>`
        select to_jsonb(x) as r from (
          select t.id, t.slug, t.name_ar, t.name_en, t.tier, t.category, t.event_type, t.status, t.featured, t.sort_order, t.updated_at,
                 (select count(*)::int from public.template_assets a where a.template_id = t.id) as asset_count,
                 jsonb_array_length(public.template_unlicensed_assets(t.id)) as unlicensed_count
          from public.templates t order by t.sort_order, t.created_at
        ) x`));
  }

  async find(id: string): Promise<{template: TemplateDetailRow; assets: TemplateAssetRow[]} | null> {
    return this.db.asService(async (tx) => {
      const template = firstJson(await tx<JsonRow<TemplateDetailRow>[]>`
        select to_jsonb(x) as r from (
          select t.id, t.slug, t.name_ar, t.name_en, t.tagline, t.tier, t.category, t.event_type, t.status, t.featured, t.sort_order,
                 t.sample_data_ar, t.sample_data_en, t.updated_at,
                 (select count(*)::int from public.template_assets a where a.template_id = t.id) as asset_count,
                 jsonb_array_length(public.template_unlicensed_assets(t.id)) as unlicensed_count
          from public.templates t where t.id = ${id}::uuid
        ) x`);
      if (template === null) return null;
      const assets = allJson(await tx<JsonRow<TemplateAssetRow>[]>`
        select to_jsonb(a) as r from (
          select id, r2_key, kind, size_bytes, source, license, license_url, created_at
          from public.template_assets where template_id = ${id}::uuid order by created_at
        ) a`);
      return {template, assets};
    });
  }

  async save(adminId: string, id: string | null, data: Record<string, unknown>): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_save_template(${adminId}::uuid, ${id}::uuid, ${JSON.stringify(data)}::text::jsonb) as result`));
  }

  async setStatus(adminId: string, id: string, status: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_set_template_status(${adminId}::uuid, ${id}::uuid, ${status}::text) as result`));
  }

  async saveAsset(adminId: string, templateId: string, assetId: string | null, data: Record<string, unknown>): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_save_template_asset(${adminId}::uuid, ${templateId}::uuid, ${assetId}::uuid, ${JSON.stringify(data)}::text::jsonb) as result`));
  }

  async deleteAsset(adminId: string, templateId: string, assetId: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_delete_template_asset(${adminId}::uuid, ${templateId}::uuid, ${assetId}::uuid) as result`));
  }
}
