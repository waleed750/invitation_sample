import {Injectable} from '@nestjs/common';
import {rpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database/db.service';

/** Data access for the auth module. */
@Injectable()
export class AuthRepository {
  constructor(private readonly db: DbService) {}

  /** Caller's `profiles.role` row, read as service_role. */
  async findRoleByUserId(userId: string): Promise<{role: string} | null> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{role: string}[]>`select role from profiles where id = ${userId} limit 1`;
      return rows.length > 0 ? rows[0] : null;
    });
  }

  /** The invitation (and its owner) a private edit link opens, or `null` when the link is unknown, revoked or expired. */
  async resolveEditLink(tokenHash: string): Promise<{linkId: string; invitationId: string; ownerId: string} | null> {
    return this.db.asService(async (tx) => {
      const result = rpcObject(await tx<RpcRow<unknown>[]>`select public.resolve_edit_link(${tokenHash}::text) as result`);
      if (result?.found !== true) return null;
      const {link_id: linkId, invitation_id: invitationId, owner_id: ownerId} = result;
      if (typeof linkId !== 'string' || typeof invitationId !== 'string' || typeof ownerId !== 'string') return null;
      return {linkId, invitationId, ownerId};
    });
  }
}
