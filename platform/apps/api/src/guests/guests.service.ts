import {Injectable, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {buildRsvpCsv, type RsvpCsvRow} from '@platform/shared';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {GuestsRepository} from './guests.repository';

/** Owner routes under `/v1/invitations` — `:id` is a UUID, validated by Zod. */
const invitationIdSchema = z.object({id: z.uuid('invitation id must be a UUID')});
export class GuestInvitationIdParams extends createZodDto(invitationIdSchema) {}

export interface OwnerRsvp {
  id: string;
  name: string;
  phone: string | null;
  attending: boolean;
  guests: number;
  note: string | null;
  createdAt: string;
}

export interface OwnerMessage {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

function toRsvp(value: unknown): OwnerRsvp {
  if (!isRecord(value)) throw new ServiceUnavailableException('Guest service unavailable');
  const {id, name, phone, attending, guests_count, note, created_at} = value;
  if (
    typeof id !== 'string' || typeof name !== 'string' ||
    !(typeof phone === 'string' || phone === null) || typeof attending !== 'boolean' ||
    typeof guests_count !== 'number' || !(typeof note === 'string' || note === null) ||
    typeof created_at !== 'string'
  ) throw new ServiceUnavailableException('Guest service unavailable');
  return {id, name, phone, attending, guests: guests_count, note, createdAt: created_at};
}

function toMessage(value: unknown): OwnerMessage {
  if (!isRecord(value)) throw new ServiceUnavailableException('Guest service unavailable');
  const {id, name, body, created_at} = value;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof body !== 'string' || typeof created_at !== 'string') {
    throw new ServiceUnavailableException('Guest service unavailable');
  }
  return {id, name, text: body, createdAt: created_at};
}

function toCsvRow(rsvp: OwnerRsvp): RsvpCsvRow {
  return {
    name: rsvp.name, phone: rsvp.phone ?? undefined, attending: rsvp.attending,
    guests: rsvp.guests, note: rsvp.note ?? undefined, createdAt: rsvp.createdAt
  };
}

/**
 * Owner-only guest lists + CSV export. Phones appear here (the owner owns
 * them) but never on the public routes. CSV reuses the shared builder, so
 * the BOM + formula-injection defence match the web export byte for byte.
 */
@Injectable()
export class GuestsService {
  constructor(private readonly repository: GuestsRepository, private readonly logger: AppLogger) {}

  async listRsvps(user: RequestUser, invitationId: string): Promise<OwnerRsvp[]> {
    await this.requireOwnership(user, invitationId);
    try {
      const result: unknown = await this.repository.listRsvpsForUser(user.jwt, invitationId);
      if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) {
        throw new ServiceUnavailableException('Guest service unavailable');
      }
      return result.data.map(toRsvp);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('rsvp list failed');
      throw new ServiceUnavailableException('Guest service unavailable');
    }
  }

  async listMessages(user: RequestUser, invitationId: string): Promise<OwnerMessage[]> {
    await this.requireOwnership(user, invitationId);
    try {
      const result: unknown = await this.repository.listMessagesForUser(user.jwt, invitationId);
      if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) {
        throw new ServiceUnavailableException('Guest service unavailable');
      }
      return result.data.map(toMessage);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('message list failed');
      throw new ServiceUnavailableException('Guest service unavailable');
    }
  }

  async exportRsvpsCsv(user: RequestUser, invitationId: string): Promise<string> {
    const rsvps = await this.listRsvps(user, invitationId);
    return buildRsvpCsv(rsvps.map(toCsvRow));
  }

  /** 404 unless the invitation belongs to the caller (RLS decides). */
  private async requireOwnership(user: RequestUser, invitationId: string): Promise<void> {
    try {
      const result: unknown = await this.repository.findInvitationForUser(user.jwt, user.id, invitationId);
      if (!isRecord(result)) throw new ServiceUnavailableException('Guest service unavailable');
      if (result.error !== null) {
        if (isRecord(result.error) && result.error.code === 'PGRST116') {
          throw new NotFoundException({code: 'invitation_not_found', message: 'Invitation not found'});
        }
        throw new ServiceUnavailableException('Guest service unavailable');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('invitation ownership check failed');
      throw new ServiceUnavailableException('Guest service unavailable');
    }
  }
}
