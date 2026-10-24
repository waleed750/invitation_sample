import {Injectable, NotFoundException} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {unwrapRpc} from '../common/rpc-result';
import type {RequestUser} from '../common/decorators';
import {AdminTemplatesRepository, type TemplateAssetRow, type TemplateDetailRow, type TemplateListRow} from './admin-templates.repository';

const idParam = z.object({id: z.uuid()});
export class TemplateIdParams extends createZodDto(idParam) {}
const assetParams = z.object({id: z.uuid(), assetId: z.uuid()});
export class TemplateAssetParams extends createZodDto(assetParams) {}

const templateFields = {
  nameAr: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  taglineAr: z.string().trim().max(240).optional(),
  taglineEn: z.string().trim().max(240).optional(),
  tier: z.enum(['save_the_date', 'classic', 'premium']),
  category: z.string().trim().max(60).optional(),
  eventType: z.string().trim().max(60).optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
  featured: z.boolean().optional(),
  sampleDataAr: z.record(z.string(), z.unknown()).optional(),
  sampleDataEn: z.record(z.string(), z.unknown()).optional()
};
const createSchema = z.object({slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60), ...templateFields}).strict();
export class CreateTemplateBody extends createZodDto(createSchema) {}
const updateSchema = z.object(templateFields).strict();
export class UpdateTemplateBody extends createZodDto(updateSchema) {}

const statusSchema = z.object({status: z.enum(['draft', 'live', 'retired'])}).strict();
export class TemplateStatusBody extends createZodDto(statusSchema) {}

const assetSchema = z.object({
  r2Key: z.string().trim().min(1).max(300).regex(/^[A-Za-z0-9._\-/]+$/),
  kind: z.enum(['image', 'video', 'audio', 'font', 'other']).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  source: z.string().trim().max(500).optional(),
  license: z.string().trim().max(200).optional(),
  licenseUrl: z.url().max(500).optional()
}).strict();
export class CreateAssetBody extends createZodDto(assetSchema) {}
const assetUpdate = z.object({
  kind: z.enum(['image', 'video', 'audio', 'font', 'other']).optional(),
  source: z.string().trim().max(500).optional(),
  license: z.string().trim().max(200).optional(),
  licenseUrl: z.url().max(500).optional()
}).strict();
export class UpdateAssetBody extends createZodDto(assetUpdate) {}

type TemplateFields = z.infer<typeof updateSchema>;

function toSqlData(body: TemplateFields & {slug?: string}): Record<string, unknown> {
  return {
    ...(body.slug === undefined ? {} : {slug: body.slug}),
    name_ar: body.nameAr, name_en: body.nameEn, tagline_ar: body.taglineAr, tagline_en: body.taglineEn, tier: body.tier,
    category: body.category ?? '', event_type: body.eventType ?? '', sort_order: body.sortOrder, featured: body.featured,
    sample_data_ar: body.sampleDataAr, sample_data_en: body.sampleDataEn
  };
}

@Injectable()
export class AdminTemplatesService {
  constructor(private readonly repository: AdminTemplatesRepository) {}

  list(): Promise<TemplateListRow[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<{template: TemplateDetailRow; assets: TemplateAssetRow[]}> {
    const found = await this.repository.find(id);
    if (found === null) throw new NotFoundException({code: 'not_found', message: 'Template not found'});
    return found;
  }

  async create(admin: RequestUser, body: CreateTemplateBody): Promise<{id: string}> {
    const result = unwrapRpc(await this.repository.save(admin.id, null, toSqlData(body)));
    return {id: String(result.id)};
  }

  async update(admin: RequestUser, id: string, body: UpdateTemplateBody): Promise<{id: string}> {
    const result = unwrapRpc(await this.repository.save(admin.id, id, toSqlData(body)));
    return {id: String(result.id)};
  }

  async setStatus(admin: RequestUser, id: string, status: 'draft' | 'live' | 'retired'): Promise<{ok: true}> {
    unwrapRpc(await this.repository.setStatus(admin.id, id, status));
    return {ok: true};
  }

  async addAsset(admin: RequestUser, id: string, body: CreateAssetBody): Promise<{id: string}> {
    const result = unwrapRpc(await this.repository.saveAsset(admin.id, id, null, {
      r2_key: body.r2Key, kind: body.kind, size_bytes: body.sizeBytes, source: body.source, license: body.license, license_url: body.licenseUrl
    }));
    return {id: String(result.id)};
  }

  async updateAsset(admin: RequestUser, id: string, assetId: string, body: UpdateAssetBody): Promise<{id: string}> {
    const result = unwrapRpc(await this.repository.saveAsset(admin.id, id, assetId, {
      kind: body.kind, source: body.source, license: body.license, license_url: body.licenseUrl
    }));
    return {id: String(result.id)};
  }

  async deleteAsset(admin: RequestUser, id: string, assetId: string): Promise<{ok: true}> {
    unwrapRpc(await this.repository.deleteAsset(admin.id, id, assetId));
    return {ok: true};
  }
}
