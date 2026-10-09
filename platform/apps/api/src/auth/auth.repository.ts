import {Injectable} from '@nestjs/common';
import {DbService} from '../database/db.service';

/** Data access for the auth module. */
@Injectable()
export class AuthRepository {
  constructor(private readonly db: DbService) {}

  /** Caller's `profiles.role` row, read as service_role. */
  async findRoleByUserId(userId: string): Promise<{role: string} | null> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{role: string}[]>`select role from profiles where id = ${userId} limit 1`;
      return rows.length > 0 ? rows[0] : null;
    });
  }
}
