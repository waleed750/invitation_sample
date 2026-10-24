import {BadRequestException, Injectable} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {unwrapRpc} from '../common/rpc-result';
import type {RequestUser} from '../common/decorators';
import {AdminSettingsRepository, type SettingRow} from './admin-settings.repository';

const localized = z.object({ar: z.string().trim().max(2000), en: z.string().trim().max(2000)}).strict();

/** One schema per key: what an admin may store. */
export const SETTING_SCHEMAS = {
  payment_instructions: localized,
  support_whatsapp: z.string().trim().regex(/^(\+?[0-9]{8,15})?$/, 'digits only, optional leading +'),
  email_texts: z.record(z.string().regex(/^[a-z_]{2,40}$/), localized)
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;

const keyParam = z.object({key: z.enum(['payment_instructions', 'support_whatsapp', 'email_texts'])});
export class SettingKeyParams extends createZodDto(keyParam) {}
const body = z.object({value: z.unknown()}).strict();
export class SettingBody extends createZodDto(body) {}

export interface PublicSettings {
  supportWhatsapp: string;
  paymentInstructions: {ar: string; en: string};
}

@Injectable()
export class AdminSettingsService {
  constructor(private readonly repository: AdminSettingsRepository) {}

  list(): Promise<SettingRow[]> {
    return this.repository.list();
  }

  async update(admin: RequestUser, key: SettingKey, value: unknown): Promise<{ok: true}> {
    const parsed = SETTING_SCHEMAS[key].safeParse(value);
    if (!parsed.success) throw new BadRequestException({code: 'invalid_value', message: 'The value does not fit this setting', issues: parsed.error.issues.map((issue) => issue.message)});
    unwrapRpc(await this.repository.set(admin.id, key, parsed.data));
    return {ok: true};
  }

  /** The parts of the settings customers may see (never email templates). */
  async publicSettings(): Promise<PublicSettings> {
    const rows = await this.repository.list();
    const get = (key: string): unknown => rows.find((row) => row.key === key)?.value;
    const whatsapp = z.string().safeParse(get('support_whatsapp'));
    const instructions = localized.safeParse(get('payment_instructions'));
    return {
      supportWhatsapp: whatsapp.success ? whatsapp.data : '',
      paymentInstructions: instructions.success ? instructions.data : {ar: '', en: ''}
    };
  }
}
