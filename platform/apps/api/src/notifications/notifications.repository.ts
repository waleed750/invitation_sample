import {Injectable} from '@nestjs/common';
import {DbService} from '../database/db.service';

export interface RecipientProfile {
  email: string | null;
  preferredLocale: 'ar' | 'en';
  name: string | null;
}

/** Data access for recipient profiles. Runs via asService (service role). */
@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DbService) {}

  async getUserRecipient(userId: string): Promise<RecipientProfile | null> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{email: string | null; preferred_locale: string | null; name: string | null}[]>`
        select email, preferred_locale, name
        from public.profiles
        where id = ${userId}::uuid
        limit 1`;
      const row = rows.at(0);
      if (!row) return null;
      return {
        email: row.email ?? null,
        preferredLocale: row.preferred_locale === 'en' ? 'en' : 'ar',
        name: row.name ?? null
      };
    });
  }

  async getOrderRecipient(orderId: string): Promise<RecipientProfile | null> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{email: string | null; preferred_locale: string | null; name: string | null}[]>`
        select p.email, p.preferred_locale, p.name
        from public.orders o
        join public.profiles p on p.id = o.user_id
        where o.id = ${orderId}::uuid
        limit 1`;
      const row = rows.at(0);
      if (!row) return null;
      return {
        email: row.email ?? null,
        preferredLocale: row.preferred_locale === 'en' ? 'en' : 'ar',
        name: row.name ?? null
      };
    });
  }
}
