import {Injectable} from '@nestjs/common';
import {firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface ProfileRow {
  id: string;
  name: string | null;
  preferred_locale: string;
  role: string;
  level: string;
  purchases_count: number;
  points_balance: number;
}

/** Data access for the caller's own profile (RLS applies: `asUser`). */
@Injectable()
export class MeRepository {
  constructor(private readonly db: DbService) {}

  /** Caller's profile row, or `null` when RLS hides it / it does not exist. */
  async findProfile(userId: string): Promise<ProfileRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<ProfileRow>[]>`
        select to_jsonb(p) as r from (
          select id, name, preferred_locale, role, level, purchases_count, points_balance
          from public.profiles where id = ${userId}::uuid
        ) p`));
  }

  /** Updates the caller's own language and/or display name; `null` when no row was updated. */
  async updateProfile(userId: string, changes: {locale?: 'ar' | 'en'; name?: string}): Promise<ProfileRow | null> {
    const locale = changes.locale ?? null;
    const name = changes.name ?? null;
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<ProfileRow>[]>`
        with u as (
          update public.profiles
          set preferred_locale = coalesce(${locale}::text, preferred_locale), name = coalesce(${name}::text, name)
          where id = ${userId}::uuid
          returning id, name, preferred_locale, role, level, purchases_count, points_balance
        )
        select to_jsonb(u) as r from u`));
  }
}
