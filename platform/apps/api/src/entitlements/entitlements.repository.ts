import {Injectable} from '@nestjs/common';
import {firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface EntitlementDbRow {
  edits_allowed: number;
  edits_used: number;
  online_until: string | null;
}

/** Data access for entitlements (RLS applies: `asUser`). */
@Injectable()
export class EntitlementsRepository {
  constructor(private readonly db: DbService) {}

  /** One invitation's entitlement row, or `null` when RLS hides it / it does not exist. */
  async findByInvitationId(userId: string, invitationId: string): Promise<EntitlementDbRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<EntitlementDbRow>[]>`
        select to_jsonb(e) as r from (
          select edits_allowed, edits_used, online_until
          from public.invitation_entitlements where invitation_id = ${invitationId}::uuid
        ) e`));
  }
}
