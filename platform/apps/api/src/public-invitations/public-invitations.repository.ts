import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

export interface PublicRsvpRow {
  invitation_id: string;
  name: string;
  phone: string | null;
  attending: boolean;
  guests_count: number;
  note: string | null;
  ip_hash: string;
}

/**
 * Guest-facing persistence. Guests never sign in, so every method here uses
 * the service-role client (RLS deliberately has no anon write policies) —
 * hence the `AsServiceRole` suffix. Rate limiting + validation happen in the
 * service/controller layers above. Phones and ip hashes are never returned
 * by the public controller.
 */
@Injectable()
export class PublicInvitationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Published invitation + entitlement by share slug. Raw postgrest envelope. */
  async findPublishedBySlugAsServiceRole(slug: string): Promise<unknown> {
    return this.supabase.admin().from('invitations')
      .select('id,slug,locale,status,data,template:templates(slug),entitlement:invitation_entitlements(tier,online_until)')
      .eq('slug', slug).eq('status', 'published').single();
  }

  /** Latest publish snapshot, newest first. Raw postgrest envelope. */
  async findLatestPublishAsServiceRole(invitationId: string): Promise<unknown> {
    return this.supabase.admin().from('invitation_publishes')
      .select('snapshot,published_at').eq('invitation_id', invitationId)
      .order('published_at', {ascending: false}).limit(1).single();
  }

  /** All RSVPs for tier-limit counting (attending + guest counts). Raw envelope. */
  async listRsvpCountsAsServiceRole(invitationId: string): Promise<unknown> {
    return this.supabase.admin().from('rsvps')
      .select('attending,guests_count').eq('invitation_id', invitationId);
  }

  /** Upsert per (invitation_id, phone); plain insert when there is no phone. */
  async saveRsvpAsServiceRole(row: PublicRsvpRow): Promise<unknown> {
    const client = this.supabase.admin();
    if (row.phone === null) {
      return client.from('rsvps').insert(row);
    }
    return client.from('rsvps').upsert(row, {onConflict: 'invitation_id,phone'});
  }

  async saveMessageAsServiceRole(row: {invitation_id: string; name: string; body: string}): Promise<unknown> {
    return this.supabase.admin().from('messages').insert(row);
  }
}
