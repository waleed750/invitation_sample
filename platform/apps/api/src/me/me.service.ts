import {Injectable, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import type {RequestUser} from '../common/decorators';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {SupabaseService} from '../supabase/supabase.service';
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
    private readonly supabase: SupabaseService,
    private readonly logger: AppLogger
  ) {}

  async getMe(user: RequestUser): Promise<MeResponse> {
    const client = this.supabase.forUser(user.jwt);
    try {
      // The postgrest response is typed `any` without generated table types —
      // pin it to `unknown` first and narrow from there (never `any`).
      const result: unknown = await client
        .from('profiles')
        .select('id,name,preferred_locale,role,level,purchases_count,points_balance')
        .eq('id', user.id)
        .single();
      if (!isRecord(result)) {
        this.logger.error('profiles lookup failed (malformed response)');
        throw new ServiceUnavailableException('Profile service unavailable');
      }
      const {data, error}: {data: unknown; error: unknown} = result as {data: unknown; error: unknown};
      if (error !== null) {
        // No row visible under RLS = unknown profile.
        if (isRecord(error) && error.code === 'PGRST116') throw new NotFoundException('Profile not found');
        // Anything else (real Supabase outage): generic 503, detail in logs only.
        this.logger.error('profiles lookup failed (upstream error)');
        throw new ServiceUnavailableException('Profile service unavailable');
      }
      if (data === null) throw new NotFoundException('Profile not found');
      return toMeResponse(data);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ServiceUnavailableException) throw err;
      // Network/DNS failure talking to Supabase: never leak the cause.
      this.logger.error('profiles lookup failed (unreachable)');
      throw new ServiceUnavailableException('Profile service unavailable');
    }
  }

  async updateLocale(user: RequestUser, locale: 'ar' | 'en'): Promise<MeResponse> {
    const client = this.supabase.forUser(user.jwt);
    try {
      const result: unknown = await client.from('profiles').update({preferred_locale: locale}).eq('id', user.id)
        .select('id,name,preferred_locale,role,level,purchases_count,points_balance').single();
      if (!isRecord(result)) throw new ServiceUnavailableException('Profile service unavailable');
      const {data, error}: {data: unknown; error: unknown} = result as {data: unknown; error: unknown};
      if (error !== null || data === null) {
        if (isRecord(error) && error.code === 'PGRST116') throw new NotFoundException('Profile not found');
        this.logger.error('profile locale update failed (upstream error)');
        throw new ServiceUnavailableException('Profile service unavailable');
      }
      return toMeResponse(data);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('profile locale update failed (unreachable)');
      throw new ServiceUnavailableException('Profile service unavailable');
    }
  }
}
