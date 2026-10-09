import {Injectable} from '@nestjs/common';
import {allJson, firstJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface CustomerSearchInput {
  /** Normalised E.164 phone, when the query looked like an Egyptian mobile. */
  phone: string | null;
  /** Already LIKE-escaped (backslash, `%` and `_` escaped with a backslash). */
  likeText: string;
  /** Owners of invitations whose slug matched. */
  ownerIds: string[];
  limit: number;
}

export interface CustomerProfileDbRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  level: string;
  purchases_count: number;
  points_balance: number;
  created_at: string;
}

export interface CustomerOrderDbRow {
  id: string;
  kind: string;
  tier: string;
  status: string;
  amount_minor: number;
  currency: string;
  provider: string;
  created_at: string;
}

export interface CustomerInvitationDbRow {
  id: string;
  slug: string;
  status: string;
  templates: {slug: string} | null;
  invitation_entitlements: {edits_allowed: number; edits_used: number; online_until: string | null} | null;
}

export interface CustomerLedgerDbRow {
  id: string;
  delta: number;
  reason: string;
  order_id: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Data access for the admin customer tools. Admin actions are not RLS-scoped
 * to the caller, so every method runs as the service role; the controller is
 * `@Roles('admin')`.
 */
@Injectable()
export class AdminCustomersRepository {
  constructor(private readonly db: DbService) {}

  /** Owner ids of invitations whose slug contains the (escaped) text. */
  async findSlugOwnersAsServiceRole(likeText: string, limit: number): Promise<string[]> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{owner_id: string}[]>`
        select owner_id::text as owner_id from public.invitations
        where slug ilike '%' || ${likeText}::text || '%' and owner_id is not null
        limit ${limit}::integer`;
      return rows.map((row) => row.owner_id);
    });
  }

  /** Profiles matching phone, email, name or one of the slug owners, newest first. */
  async searchProfilesAsServiceRole(input: CustomerSearchInput): Promise<CustomerProfileDbRow[]> {
    const {phone, likeText, ownerIds, limit} = input;
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CustomerProfileDbRow>[]>`
        select to_jsonb(x) as r from (
          select p.id, p.name, p.phone, p.email, p.level, p.purchases_count, p.points_balance, p.created_at
          from public.profiles p
          where (${phone}::text is not null and p.phone = ${phone}::text)
             or (${likeText}::text <> '' and (
                  p.email ilike '%' || ${likeText}::text || '%'
               or p.name ilike '%' || ${likeText}::text || '%'
               or (${phone}::text is null and p.phone ilike '%' || ${likeText}::text || '%')))
             or p.id = any(${ownerIds}::uuid[])
        ) x order by x.created_at desc limit ${limit}::integer`));
  }

  /** Newest profiles (empty query). */
  async listRecentProfilesAsServiceRole(limit: number): Promise<CustomerProfileDbRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CustomerProfileDbRow>[]>`
        select to_jsonb(x) as r from (
          select id, name, phone, email, level, purchases_count, points_balance, created_at
          from public.profiles
        ) x order by x.created_at desc limit ${limit}::integer`));
  }

  async findProfileAsServiceRole(userId: string): Promise<CustomerProfileDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<CustomerProfileDbRow>[]>`
        select to_jsonb(x) as r from (
          select id, name, phone, email, level, purchases_count, points_balance, created_at
          from public.profiles where id = ${userId}::uuid
        ) x`));
  }

  async listOrdersAsServiceRole(userId: string): Promise<CustomerOrderDbRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CustomerOrderDbRow>[]>`
        select to_jsonb(x) as r from (
          select id, kind, tier, status, amount_minor, currency, provider, created_at
          from public.orders where user_id = ${userId}::uuid
        ) x order by x.created_at desc`));
  }

  async listInvitationsAsServiceRole(userId: string): Promise<CustomerInvitationDbRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CustomerInvitationDbRow>[]>`
        select to_jsonb(x) as r from (
          select i.id, i.slug, i.status, i.created_at,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = i.template_id) as templates,
            (select to_jsonb(e) from (
              select ie.edits_allowed, ie.edits_used, ie.online_until
              from public.invitation_entitlements ie where ie.invitation_id = i.id
            ) e) as invitation_entitlements
          from public.invitations i where i.owner_id = ${userId}::uuid
        ) x order by x.created_at desc`));
  }

  async listPointsLedgerAsServiceRole(userId: string, limit: number): Promise<CustomerLedgerDbRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CustomerLedgerDbRow>[]>`
        select to_jsonb(x) as r from (
          select id, delta, reason, order_id, expires_at, created_at
          from public.points_ledger where user_id = ${userId}::uuid
        ) x order by x.created_at desc limit ${limit}::integer`));
  }

  /** `admin_adjust_entitlement` RPC (service role only in SQL). */
  async adjustEntitlementAsServiceRole(
    adminId: string, invitationId: string, addEdits: number, extendDays: number, reason: string
  ): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_adjust_entitlement(
          ${adminId}::uuid, ${invitationId}::uuid, ${addEdits}::integer, ${extendDays}::integer, ${reason}::text
        ) as result`));
  }

  /** `admin_adjust_points` RPC (service role only in SQL). */
  async adjustPointsAsServiceRole(adminId: string, userId: string, delta: number, reason: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_adjust_points(${adminId}::uuid, ${userId}::uuid, ${delta}::integer, ${reason}::text) as result`));
  }
}
