import {Body, Controller, Get, HttpCode, Param, Put} from '@nestjs/common';
import {CurrentUser, Public, Roles, type RequestUser} from '../common/decorators';
import {AdminSettingsService, SettingBody, SettingKeyParams, type PublicSettings} from './admin-settings.service';
import type {SettingRow} from './admin-settings.repository';

@Roles('admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  list(): Promise<SettingRow[]> {
    return this.settings.list();
  }

  @Put(':key')
  @HttpCode(200)
  update(@CurrentUser() admin: RequestUser, @Param() params: SettingKeyParams, @Body() body: SettingBody): Promise<{ok: true}> {
    return this.settings.update(admin, params.key, body.value);
  }
}

/** What the pay pages show: the support WhatsApp number and the transfer instructions. */
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Public()
  @Get('public')
  publicSettings(): Promise<PublicSettings> {
    return this.settings.publicSettings();
  }
}
