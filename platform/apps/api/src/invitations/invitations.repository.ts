import {Injectable} from '@nestjs/common';
import {allJson, firstJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

/** Embedded entitlement (`null` when the invitation has none). */
export interface InvitationEntitlementDbRow {
  tier: string;
  edits_allowed: number;
  edits_used: number;
  online_until: string | null;
}

export interface InvitationListDbRow {
  id: string;
  order_id: string | null;
  slug: string;
  data: unknown;
  locale: string;
  status: string;
  created_at: string;
  template: {slug: string} | null;
  entitlement: InvitationEntitlementDbRow | null;
}

export interface InvitationDetailDbRow {
  id: string;
  order_id: string | null;
  slug: string;
  status: string;
  template_id: string | null;
  data: unknown;
  /** Raw Postgres `updated_at` (microsecond ISO text); the `If-Match` version. */
  updated_at: string;
  published_at: string | null;
  template: {slug: string} | null;
  entitlement: InvitationEntitlementDbRow | null;
}

/** Data access for invitations. Owner calls run as the caller (`asUser`, RLS applies). */
@Injectable()
export class InvitationsRepository {
  constructor(private readonly db: DbService) {}

  /** Owner's invitations with template slug + entitlement, newest first. */
  async listByOwner(ownerId: string): Promise<InvitationListDbRow[]> {
    return this.db.asUser({id: ownerId}, async (tx) =>
      allJson(await tx<JsonRow<InvitationListDbRow>[]>`
        select to_jsonb(x) as r from (
          select i.id, i.order_id, i.slug, i.data, i.locale, i.status, i.created_at,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = i.template_id) as template,
            (select to_jsonb(e) from (
              select ie.tier, ie.edits_allowed, ie.edits_used, ie.online_until
              from public.invitation_entitlements ie where ie.invitation_id = i.id
            ) e) as entitlement
          from public.invitations i where i.owner_id = ${ownerId}::uuid
        ) x order by x.created_at desc`));
  }

  /** One invitation with its entitlement; `null` = hidden by RLS or missing. */
  async findById(userId: string, id: string): Promise<InvitationDetailDbRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<InvitationDetailDbRow>[]>`
        select to_jsonb(x) as r from (
          select i.id, i.order_id, i.slug, i.status, i.template_id, i.data, i.updated_at, i.published_at,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = i.template_id) as template,
            (select to_jsonb(e) from (
              select ie.tier, ie.edits_allowed, ie.edits_used, ie.online_until
              from public.invitation_entitlements ie where ie.invitation_id = i.id
            ) e) as entitlement
          from public.invitations i where i.id = ${id}::uuid
        ) x`));
  }

  /**
   * Optimistic-concurrency write: updates `data` only while `updated_at` still equals `ifMatch`.
   * `ifMatch` is the raw `updated_at` string previously returned by Postgres (microsecond precision).
   * Returns the new `updated_at` (microsecond ISO text), or `null` when stale or hidden.
   */
  async updateDataIfMatch(userId: string, id: string, data: unknown, ifMatch: string): Promise<string | null> {
    const json = JSON.stringify(data);
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<JsonRow<{updated_at: string}>[]>`
        with u as (
          update public.invitations set data = ${json}::text::jsonb
          where id = ${id}::uuid and updated_at = ${ifMatch}::timestamptz
          returning updated_at
        )
        select to_jsonb(u) as r from u`;
      return firstJson(rows)?.updated_at ?? null;
    });
  }

  /**
   * Sets the share slug (the `invitations_guard` trigger refuses it after publishing). Returns whether a row
   * was updated. Postgres errors (unique violation `23505`, check violation `23514`, the guard's exception)
   * propagate to the caller with their SQLSTATE in `.code`.
   */
  async updateSlug(userId: string, id: string, slug: string): Promise<boolean> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<{id: string}[]>`
        update public.invitations set slug = ${slug}::text where id = ${id}::uuid returning id`;
      return rows.length > 0;
    });
  }

  /** `publish_invitation(id, data)` RPC. `authenticated` may execute it (0002); ownership is checked in SQL via auth.uid(). */
  async publish(userId: string, id: string, data: unknown): Promise<RpcObject | null> {
    const json = JSON.stringify(data);
    return this.db.asUser({id: userId}, async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.publish_invitation(${id}::uuid, ${json}::text::jsonb) as result`));
  }

  /** `undo_publish(id)` RPC (0012). `authenticated` may execute it; ownership is checked in SQL via auth.uid(). */
  async undoPublish(userId: string, id: string): Promise<RpcObject | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.undo_publish(${id}::uuid) as result`));
  }

  /** `switch_template(id, slug)` RPC (0012). Same privilege model as `publish`. */
  async switchTemplate(userId: string, id: string, templateSlug: string): Promise<RpcObject | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.switch_template(${id}::uuid, ${templateSlug}::text) as result`));
  }

  /**
   * Which of `slugs` are already used by any invitation (drafts included). Service role, because RLS hides
   * other people's drafts; the caller only ever gets the slug strings back, never any invitation data.
   */
  async slugsTakenAsServiceRole(slugs: string[]): Promise<string[]> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{slug: string}[]>`
        select slug from public.invitations where slug = any(${slugs}::text[])`;
      return rows.map((row) => row.slug);
    });
  }
}
