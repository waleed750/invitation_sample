import {Injectable} from '@nestjs/common';
import {allJson, firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface RsvpDbRow {
  id: string;
  name: string;
  phone: string | null;
  attending: boolean;
  guests_count: number;
  note: string | null;
  created_at: string;
}

export interface MessageDbRow {
  id: string;
  name: string;
  body: string;
  created_at: string;
}

/**
 * Owner-only guest data. All reads run as the caller (`asUser`) so RLS applies;
 * the service first proves ownership via the `invitations` table, so a
 * stranger's invitation is a 404 (not an empty list).
 */
@Injectable()
export class GuestsRepository {
  constructor(private readonly db: DbService) {}

  /** The caller's own invitation id, or `null`. */
  async findInvitationForUser(ownerId: string, invitationId: string): Promise<{id: string} | null> {
    return this.db.asUser({id: ownerId}, async (tx) =>
      firstJson(await tx<JsonRow<{id: string}>[]>`
        select to_jsonb(i) as r from (
          select id from public.invitations
          where id = ${invitationId}::uuid and owner_id = ${ownerId}::uuid
        ) i`));
  }

  /** Owner's RSVPs, oldest first. */
  async listRsvpsForUser(userId: string, invitationId: string): Promise<RsvpDbRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<RsvpDbRow>[]>`
        select to_jsonb(x) as r from (
          select id, name, phone, attending, guests_count, note, created_at
          from public.rsvps where invitation_id = ${invitationId}::uuid
        ) x order by x.created_at asc`));
  }

  /** Owner's guestbook messages, oldest first. */
  async listMessagesForUser(userId: string, invitationId: string): Promise<MessageDbRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<MessageDbRow>[]>`
        select to_jsonb(x) as r from (
          select id, name, body, created_at
          from public.messages where invitation_id = ${invitationId}::uuid
        ) x order by x.created_at asc`));
  }
}
