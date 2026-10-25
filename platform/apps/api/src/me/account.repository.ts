import {Injectable} from '@nestjs/common';
import {firstJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

/** Whole-account operations. They run as the service role with an explicit user id (the API passes the signed-in user's own id). */
@Injectable()
export class AccountRepository {
  constructor(private readonly db: DbService) {}

  /** The caller's own data as one JSON document (see `export_account_data`). */
  async exportData(userId: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.export_account_data(${userId}::uuid) as result`));
  }

  /** Account email recorded on the profile (used to confirm a deletion). */
  async profileEmail(userId: string): Promise<string | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<{email: string | null}>[]>`
        select to_jsonb(p) as r from (select email from public.profiles where id = ${userId}::uuid) p`)?.email ?? null);
  }

  /** Anonymises the account and removes its sign-in (see `anonymize_account`). */
  async anonymize(userId: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.anonymize_account(${userId}::uuid) as result`));
  }
}
