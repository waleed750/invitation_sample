import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for entitlements. The only file here that talks to Supabase. */
@Injectable()
export class EntitlementsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** One invitation's entitlement row (user JWT, RLS decides visibility). Raw postgrest envelope. */
  async findByInvitationId(jwt: string, invitationId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitation_entitlements')
      .select('edits_allowed,edits_used,online_until')
      .eq('invitation_id', invitationId)
      .single();
  }
}
