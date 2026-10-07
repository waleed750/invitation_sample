import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

const RSVP_COLUMNS = 'id,name,phone,attending,guests_count,note,created_at';
const MESSAGE_COLUMNS = 'id,name,body,created_at';

/**
 * Owner-only guest data. All reads use the caller's JWT so RLS applies;
 * the service first proves ownership via the `invitations` table, so a
 * stranger's invitation is a 404 (not an empty list).
 */
@Injectable()
export class GuestsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** The caller's own invitation (user JWT, RLS applies). Raw envelope. */
  async findInvitationForUser(jwt: string, ownerId: string, invitationId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('invitations').select('id')
      .eq('id', invitationId).eq('owner_id', ownerId).single();
  }

  /** Owner's RSVPs, oldest first (user JWT, RLS applies). Raw envelope. */
  async listRsvpsForUser(jwt: string, invitationId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('rsvps').select(RSVP_COLUMNS)
      .eq('invitation_id', invitationId).order('created_at', {ascending: true});
  }

  /** Owner's guestbook messages, oldest first (user JWT, RLS applies). Raw envelope. */
  async listMessagesForUser(jwt: string, invitationId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('messages').select(MESSAGE_COLUMNS)
      .eq('invitation_id', invitationId).order('created_at', {ascending: true});
  }
}
