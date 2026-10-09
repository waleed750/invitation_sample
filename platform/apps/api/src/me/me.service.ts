import {Injectable, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import type {RequestUser} from '../common/decorators';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {MeRepository} from './me.repository';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';

const updateMeSchema = z.object({locale: z.enum(['ar', 'en'])}).strict();
export class UpdateMeBody extends createZodDto(updateMeSchema) {}

/** The caller's own profile row. Never contains another person's contact details. */
export interface MeResponse {
  id: string;
  name: string | null;
  preferred_locale: string;
  role: string;
  level: string;
  purchases_count: number;
  points_balance: number;
}

function toMeResponse(row: unknown): MeResponse {
  if (!isRecord(row)) throw new ServiceUnavailableException('Profile service unavailable');
  const {id, name, preferred_locale, role, level, purchases_count, points_balance} = row;
  if (
    typeof id !== 'string' ||
    !(typeof name === 'string' || name === null) ||
    typeof preferred_locale !== 'string' ||
    typeof role !== 'string' ||
    typeof level !== 'string' ||
    typeof purchases_count !== 'number' ||
    typeof points_balance !== 'number'
  ) {
    throw new ServiceUnavailableException('Profile service unavailable');
  }
  return {id, name, preferred_locale, role, level, purchases_count, points_balance};
}

@Injectable()
export class MeService {
  constructor(
    private readonly repository: MeRepository,
    private readonly logger: AppLogger
  ) {}

  async getMe(user: RequestUser): Promise<MeResponse> {
    try {
      const row = await this.repository.findProfile(user.id);
      // No row visible under RLS = unknown profile.
      if (row === null) throw new NotFoundException('Profile not found');
      return toMeResponse(row);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ServiceUnavailableException) throw err;
      // Database failure: never leak the cause.
      this.logger.error('profiles lookup failed (upstream error)');
      throw new ServiceUnavailableException('Profile service unavailable');
    }
  }

  async updateLocale(user: RequestUser, locale: 'ar' | 'en'): Promise<MeResponse> {
    try {
      const row = await this.repository.updatePreferredLocale(user.id, locale);
      if (row === null) throw new NotFoundException('Profile not found');
      return toMeResponse(row);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('profile locale update failed (upstream error)');
      throw new ServiceUnavailableException('Profile service unavailable');
    }
  }
}
