import {Injectable} from '@nestjs/common';
import {allJson, firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface PublicRsvpRow {
  invitation_id: string;
  name: string;
  phone: string | null;
  attending: boolean;
  guests_count: number;
  note: string | null;
  ip_hash: string;
}

export interface PublishedInvitationDbRow {
  id: string;
  slug: string;
  locale: string;
  status: string;
  data: unknown;
  template: {slug: string} | null;
  entitlement: {tier: string; online_until: string | null} | null;
}

export interface LatestPublishDbRow {
  snapshot: unknown;
  published_at: string;
}

/**
 * Guest-facing persistence. Guests never sign in, so every method here runs
 * as the service role (RLS deliberately has no anon write policies) — hence
 * the `AsServiceRole` suffix. Rate limiting + validation happen in the
 * service/controller layers above. Phones and ip hashes are never returned
 * by the public controller.
 */
@Injectable()
export class PublicInvitationsRepository {
  constructor(private readonly db: DbService) {}

  /** Published invitation + entitlement by share slug, or `null`. */
  async findPublishedBySlugAsServiceRole(slug: string): Promise<PublishedInvitationDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<PublishedInvitationDbRow>[]>`
        select to_jsonb(x) as r from (
          select i.id, i.slug, i.locale, i.status, i.data,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = i.template_id) as template,
            (select to_jsonb(e) from (
              select ie.tier, ie.online_until from public.invitation_entitlements ie where ie.invitation_id = i.id
            ) e) as entitlement
          from public.invitations i where i.slug = ${slug}::text and i.status = 'published'
        ) x`));
  }

  /** Latest publish snapshot, or `null` when the invitation was never published. */
  async findLatestPublishAsServiceRole(invitationId: string): Promise<LatestPublishDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<LatestPublishDbRow>[]>`
        select to_jsonb(p) as r from (
          select snapshot, published_at from public.invitation_publishes
          where invitation_id = ${invitationId}::uuid
          order by published_at desc limit 1
        ) p`));
  }

  /** All RSVPs for tier-limit counting (attending + guest counts). */
  async listRsvpCountsAsServiceRole(invitationId: string): Promise<{attending: boolean; guests_count: number}[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<{attending: boolean; guests_count: number}>[]>`
        select to_jsonb(c) as r from (
          select attending, guests_count from public.rsvps where invitation_id = ${invitationId}::uuid
        ) c`));
  }

  /** Upsert per (invitation_id, phone); plain insert when there is no phone. */
  async saveRsvpAsServiceRole(row: PublicRsvpRow): Promise<void> {
    await this.db.asService(async (tx) => {
      if (row.phone === null) {
        await tx`
          insert into public.rsvps (invitation_id, name, phone, attending, guests_count, note, ip_hash)
          values (${row.invitation_id}::uuid, ${row.name}::text, null, ${row.attending}::boolean,
                  ${row.guests_count}::integer, ${row.note}::text, ${row.ip_hash}::text)`;
        return;
      }
      await tx`
        insert into public.rsvps (invitation_id, name, phone, attending, guests_count, note, ip_hash)
        values (${row.invitation_id}::uuid, ${row.name}::text, ${row.phone}::text, ${row.attending}::boolean,
                ${row.guests_count}::integer, ${row.note}::text, ${row.ip_hash}::text)
        on conflict (invitation_id, phone) do update set
          name = excluded.name,
          attending = excluded.attending,
          guests_count = excluded.guests_count,
          note = excluded.note,
          ip_hash = excluded.ip_hash`;
    });
  }

  async saveMessageAsServiceRole(row: {invitation_id: string; name: string; body: string}): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`
        insert into public.messages (invitation_id, name, body)
        values (${row.invitation_id}::uuid, ${row.name}::text, ${row.body}::text)`;
    });
  }
}
