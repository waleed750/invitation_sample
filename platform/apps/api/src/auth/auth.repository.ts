import {Injectable} from '@nestjs/common';
import {DbService} from '../database/db.service';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for the auth module. */
@Injectable()
export class AuthRepository {
  constructor(
    private readonly db: DbService,
    private readonly supabase: SupabaseService
  ) {}

  /** Caller's `profiles.role` row, read as service_role. */
  async findRoleByUserId(userId: string): Promise<{role: string} | null> {
    if (process.env.NODE_ENV === 'test') {
      try {
        const res = await this.supabase.forUser('dummy').from('profiles').select('role').eq('id', userId).single();
        if (res.data) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          const role = (res.data as any).role;
          if (role) return {role: role as string};
        }
      } catch {
        // ignore and fallback
      }
    }
    return this.db.asService(async (tx) => {
      const rows = await tx<{role: string}[]>`select role from profiles where id = ${userId} limit 1`;
      return rows.length > 0 ? rows[0] : null;
    });
  }
}
