import {Injectable} from '@nestjs/common';
import {allJson, firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface MediaVariant {
  width: number;
  key: string;
  bytes: number;
}

export interface MediaRow {
  id: string;
  owner_id: string;
  invitation_id: string | null;
  r2_key: string;
  kind: string | null;
  size_bytes: number | null;
  status: 'processing' | 'ready' | 'rejected';
  original_name: string | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
  variants: MediaVariant[];
  reason: string | null;
  created_at: string;
}

export interface MediaUsage {
  count: number;
  bytes: number;
  uploadsLast24h: number;
}

export interface NewMedia {
  id: string;
  ownerId: string;
  invitationId: string | null;
  key: string;
  kind: 'image' | 'video' | 'audio';
  contentType: string;
  originalName: string | null;
}

export interface ReadyMedia {
  key: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  variants: MediaVariant[];
}

/** Data access for customer media. Reads run as the owner (RLS); writes are server-side (service role). */
@Injectable()
export class MediaRepository {
  constructor(private readonly db: DbService) {}

  /** The tiers of the owner's paid invitations (any order); empty before the first purchase. */
  async paidTiers(userId: string): Promise<string[]> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<{tier: string}[]>`
        select distinct ie.tier from public.invitation_entitlements ie
        join public.invitations i on i.id = ie.invitation_id
        where i.owner_id = ${userId}::uuid`;
      return rows.map((row) => row.tier);
    });
  }

  async usage(userId: string): Promise<MediaUsage> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<JsonRow<MediaUsage>[]>`
        select jsonb_build_object(
          'count', count(*) filter (where status <> 'rejected'),
          'bytes', coalesce(sum(size_bytes) filter (where status <> 'rejected'), 0),
          'uploadsLast24h', count(*) filter (where created_at > now() - interval '24 hours')
        ) as r from public.media where owner_id = ${userId}::uuid`;
      return firstJson(rows) ?? {count: 0, bytes: 0, uploadsLast24h: 0};
    });
  }

  async ownsInvitation(userId: string, invitationId: string): Promise<boolean> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<{id: string}[]>`select id from public.invitations where id = ${invitationId}::uuid and owner_id = ${userId}::uuid`;
      return rows.length > 0;
    });
  }

  async list(userId: string): Promise<MediaRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<MediaRow>[]>`
        select to_jsonb(x) as r from (
          select m.id, m.owner_id, m.invitation_id, m.r2_key, m.kind, m.size_bytes, m.status, m.original_name, m.content_type, m.width, m.height, m.variants, m.reason, m.created_at from public.media m where m.owner_id = ${userId}::uuid order by m.created_at desc limit 500
        ) x`));
  }

  async findOwned(userId: string, id: string): Promise<MediaRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<MediaRow>[]>`
        select to_jsonb(x) as r from (
          select m.id, m.owner_id, m.invitation_id, m.r2_key, m.kind, m.size_bytes, m.status, m.original_name, m.content_type, m.width, m.height, m.variants, m.reason, m.created_at from public.media m where m.id = ${id}::uuid and m.owner_id = ${userId}::uuid
        ) x`));
  }

  /** True when any of the owner's invitations mentions this media (by its storage folder). */
  async isReferenced(userId: string, folder: string): Promise<boolean> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<{used: boolean}[]>`
        select exists (
          select 1 from public.invitations i
          where i.owner_id = ${userId}::uuid and position(${folder}::text in i.data::text) > 0
        ) as used`;
      return rows.some((row) => row.used);
    });
  }

  async insertProcessing(media: NewMedia): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`
        insert into public.media (id, owner_id, invitation_id, r2_key, kind, status, content_type, original_name)
        values (${media.id}::uuid, ${media.ownerId}::uuid, ${media.invitationId}::uuid, ${media.key}::text, ${media.kind}::text,
                'processing', ${media.contentType}::text, ${media.originalName}::text)`;
    });
  }

  async markReady(id: string, ready: ReadyMedia): Promise<void> {
    const variants = JSON.stringify(ready.variants);
    await this.db.asService(async (tx) => {
      await tx`
        update public.media
        set status = 'ready', r2_key = ${ready.key}::text, size_bytes = ${ready.sizeBytes}::bigint,
            width = ${ready.width}::integer, height = ${ready.height}::integer, variants = ${variants}::text::jsonb
        where id = ${id}::uuid`;
    });
  }

  async markRejected(id: string, reason: string): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`update public.media set status = 'rejected', reason = ${reason}::text where id = ${id}::uuid`;
    });
  }

  async deleteRow(id: string): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`delete from public.media where id = ${id}::uuid`;
    });
  }
}
