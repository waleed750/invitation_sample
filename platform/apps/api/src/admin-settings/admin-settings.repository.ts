import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

@Injectable()
export class AdminSettingsRepository {
  constructor(private readonly db: DbService) {}

  async list(): Promise<SettingRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<SettingRow>[]>`select to_jsonb(s) as r from (select key, value, updated_at from public.app_settings order by key) s`));
  }

  async set(adminId: string, key: string, value: unknown): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_set_setting(${adminId}::uuid, ${key}::text, ${JSON.stringify(value)}::text::jsonb) as result`));
  }
}
