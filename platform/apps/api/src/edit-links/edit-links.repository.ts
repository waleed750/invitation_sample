import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface EditLinkRow {
  id: string;
  label: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  claimed_at: string | null;
}

@Injectable()
export class EditLinksRepository {
  constructor(private readonly db: DbService) {}

  async issue(adminId: string, invitationId: string, tokenHash: string, label: string | null): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_issue_edit_link(${adminId}::uuid, ${invitationId}::uuid, ${tokenHash}::text, ${label}::text) as result`));
  }

  async revoke(adminId: string, linkId: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_revoke_edit_link(${adminId}::uuid, ${linkId}::uuid) as result`));
  }

  /** Links of an invitation. The token itself is never stored, so it cannot be listed. */
  async list(invitationId: string): Promise<EditLinkRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<EditLinkRow>[]>`
        select to_jsonb(l) as r from (
          select id, label, created_at, expires_at, revoked_at, last_used_at, claimed_at
          from public.invitation_access_links where invitation_id = ${invitationId}::uuid order by created_at desc limit 50
        ) l`));
  }

  async resolve(tokenHash: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.resolve_edit_link(${tokenHash}::text) as result`));
  }

  async claim(userId: string, tokenHash: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.claim_invitation(${userId}::uuid, ${tokenHash}::text) as result`));
  }
}
