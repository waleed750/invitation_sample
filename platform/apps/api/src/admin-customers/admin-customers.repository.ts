import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

export interface CustomerSearchInput {
  /** Normalised E.164 phone, when the query looked like an Egyptian mobile. */
  phone: string | null;
  /** Already LIKE-escaped (no `%`, `_` or `\` left unescaped, no or-syntax characters). */
  likeText: string;
  /** Owners of invitations whose slug matched. */
  ownerIds: string[];
  limit: number;
}

const PROFILE_COLUMNS = 'id,name,phone,email,level,purchases_count,points_balance,created_at';

/**
 * Data access for the admin customer tools. Admin actions are not RLS-scoped
 * to the caller, so every method uses the service-role client; the controller
 * is `@Roles('admin')`. Methods return the raw postgrest envelope.
 */
@Injectable()
export class AdminCustomersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Owner ids of invitations whose slug contains the (escaped) text. */
  async findSlugOwnersAsServiceRole(likeText: string, limit: number): Promise<unknown> {
    return this.supabase.admin().from('invitations')
      .select('owner_id')
      .ilike('slug', `%${likeText}%`)
      .not('owner_id', 'is', null)
      .limit(limit);
  }

  /** Profiles matching phone, email, name or one of the slug owners. */
  async searchProfilesAsServiceRole(input: CustomerSearchInput): Promise<unknown> {
    const filters: string[] = [];
    if (input.phone !== null) filters.push(`phone.eq.${input.phone}`);
    if (input.likeText !== '') {
      filters.push(`email.ilike.%${input.likeText}%`, `name.ilike.%${input.likeText}%`);
      if (input.phone === null) filters.push(`phone.ilike.%${input.likeText}%`);
    }
    if (input.ownerIds.length > 0) filters.push(`id.in.(${input.ownerIds.join(',')})`);
    return this.supabase.admin().from('profiles')
      .select(PROFILE_COLUMNS)
      .or(filters.join(','))
      .order('created_at', {ascending: false})
      .limit(input.limit);
  }

  /** Newest profiles (empty query). */
  async listRecentProfilesAsServiceRole(limit: number): Promise<unknown> {
    return this.supabase.admin().from('profiles')
      .select(PROFILE_COLUMNS)
      .order('created_at', {ascending: false})
      .limit(limit);
  }

  async findProfileAsServiceRole(userId: string): Promise<unknown> {
    return this.supabase.admin().from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();
  }

  async listOrdersAsServiceRole(userId: string): Promise<unknown> {
    return this.supabase.admin().from('orders')
      .select('id,kind,tier,status,amount_minor,currency,provider,created_at')
      .eq('user_id', userId)
      .order('created_at', {ascending: false});
  }

  async listInvitationsAsServiceRole(userId: string): Promise<unknown> {
    return this.supabase.admin().from('invitations')
      .select('id,slug,status,templates(slug),invitation_entitlements(edits_allowed,edits_used,online_until)')
      .eq('owner_id', userId)
      .order('created_at', {ascending: false});
  }

  async listPointsLedgerAsServiceRole(userId: string, limit: number): Promise<unknown> {
    return this.supabase.admin().from('points_ledger')
      .select('id,delta,reason,order_id,expires_at,created_at')
      .eq('user_id', userId)
      .order('created_at', {ascending: false})
      .limit(limit);
  }

  /** `admin_adjust_entitlement` RPC (service role only in SQL). */
  async adjustEntitlementAsServiceRole(
    adminId: string, invitationId: string, addEdits: number, extendDays: number, reason: string
  ): Promise<unknown> {
    return this.supabase.admin().rpc('admin_adjust_entitlement', {
      p_admin_id: adminId,
      p_invitation_id: invitationId,
      p_add_edits: addEdits,
      p_extend_days: extendDays,
      p_reason: reason
    });
  }

  /** `admin_adjust_points` RPC (service role only in SQL). */
  async adjustPointsAsServiceRole(adminId: string, userId: string, delta: number, reason: string): Promise<unknown> {
    return this.supabase.admin().rpc('admin_adjust_points', {
      p_admin_id: adminId,
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason
    });
  }
}
