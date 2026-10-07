import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for invitations. The only file here that talks to Supabase. */
@Injectable()
export class InvitationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Owner's invitations with template slug + entitlement, newest first (user JWT, RLS applies). Raw envelope. */
  async listByOwner(jwt: string, ownerId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitations')
      .select('id,order_id,slug,data,locale,status,created_at,template:templates(slug),entitlement:invitation_entitlements(tier,edits_allowed,edits_used,online_until)')
      .eq('owner_id', ownerId).order('created_at', {ascending: false});
  }
}
