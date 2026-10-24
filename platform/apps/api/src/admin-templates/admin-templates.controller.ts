import {Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put} from '@nestjs/common';
import {CurrentUser, Roles, type RequestUser} from '../common/decorators';
import {
  AdminTemplatesService, CreateAssetBody, CreateTemplateBody, TemplateAssetParams, TemplateIdParams, TemplateStatusBody, UpdateAssetBody, UpdateTemplateBody
} from './admin-templates.service';
import type {TemplateAssetRow, TemplateDetailRow, TemplateListRow} from './admin-templates.repository';

@Roles('admin')
@Controller('admin/templates')
export class AdminTemplatesController {
  constructor(private readonly templates: AdminTemplatesService) {}

  @Get()
  list(): Promise<TemplateListRow[]> {
    return this.templates.list();
  }

  @Post()
  create(@CurrentUser() admin: RequestUser, @Body() body: CreateTemplateBody): Promise<{id: string}> {
    return this.templates.create(admin, body);
  }

  @Get(':id')
  get(@Param() params: TemplateIdParams): Promise<{template: TemplateDetailRow; assets: TemplateAssetRow[]}> {
    return this.templates.get(params.id);
  }

  @Put(':id')
  update(@CurrentUser() admin: RequestUser, @Param() params: TemplateIdParams, @Body() body: UpdateTemplateBody): Promise<{id: string}> {
    return this.templates.update(admin, params.id, body);
  }

  /** draft -> live -> retired. Going live is refused while any asset lacks a source or a licence. */
  @Post(':id/status')
  @HttpCode(200)
  setStatus(@CurrentUser() admin: RequestUser, @Param() params: TemplateIdParams, @Body() body: TemplateStatusBody): Promise<{ok: true}> {
    return this.templates.setStatus(admin, params.id, body.status);
  }

  @Post(':id/assets')
  addAsset(@CurrentUser() admin: RequestUser, @Param() params: TemplateIdParams, @Body() body: CreateAssetBody): Promise<{id: string}> {
    return this.templates.addAsset(admin, params.id, body);
  }

  @Patch(':id/assets/:assetId')
  updateAsset(@CurrentUser() admin: RequestUser, @Param() params: TemplateAssetParams, @Body() body: UpdateAssetBody): Promise<{id: string}> {
    return this.templates.updateAsset(admin, params.id, params.assetId, body);
  }

  @Delete(':id/assets/:assetId')
  @HttpCode(200)
  deleteAsset(@CurrentUser() admin: RequestUser, @Param() params: TemplateAssetParams): Promise<{ok: true}> {
    return this.templates.deleteAsset(admin, params.id, params.assetId);
  }
}
