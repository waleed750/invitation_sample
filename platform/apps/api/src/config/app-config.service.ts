import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import type {AppEnv, ManualPaymentInstructions} from './env.schema';

/** Typed, fail-loud accessor over the validated environment. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  private required<K extends keyof AppEnv>(key: K): AppEnv[K] {
    const value = this.config.get<AppEnv[K]>(key as string);
    if (value === undefined) {
      // Unreachable when `validateEnv` ran (every key has a value or default),
      // but keeps callers free of `undefined` without non-null assertions.
      throw new Error(`Missing validated config: ${key as string}`);
    }
    return value;
  }

  get port(): number {
    return this.required('PORT');
  }

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.required('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get webOrigins(): string[] {
    return this.required('WEB_ORIGINS');
  }

  get databaseUrl(): string {
    return this.required('DATABASE_URL');
  }

  get databasePoolMax(): number {
    return this.required('DATABASE_POOL_MAX');
  }

  get databaseStatementTimeoutMs(): number {
    return this.required('DATABASE_STATEMENT_TIMEOUT_MS');
  }

  /** LEGACY: optional now; throws only when a Supabase code path actually runs without it. */
  private legacySupabase(key: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
    const value = this.config.get<string | undefined>(key);
    if (value === undefined) {
      throw new Error(`${key} is not configured (Supabase is being removed; this code path still needs it)`);
    }
    return value;
  }

  get supabaseUrl(): string {
    return this.legacySupabase('SUPABASE_URL');
  }

  get supabaseAnonKey(): string {
    return this.legacySupabase('SUPABASE_ANON_KEY');
  }

  get supabaseServiceRoleKey(): string {
    return this.legacySupabase('SUPABASE_SERVICE_ROLE_KEY');
  }

  get supabaseJwtSecret(): string | undefined {
    return this.required('SUPABASE_JWT_SECRET');
  }

  get supabaseTimeoutMs(): number {
    return this.required('SUPABASE_TIMEOUT_MS');
  }

  get throttleTtlMs(): number {
    return this.required('THROTTLE_TTL_MS');
  }

  get throttleLimit(): number {
    return this.required('THROTTLE_LIMIT');
  }

  get paymentsProvider(): AppEnv['PAYMENTS_PROVIDER'] {
    return this.required('PAYMENTS_PROVIDER');
  }

  /** Manual-payment instructions; `undefined` when unset (checkout then returns no methods). */
  get manualPaymentInstructions(): ManualPaymentInstructions | undefined {
    return this.config.get<ManualPaymentInstructions | undefined>('MANUAL_PAYMENT_INSTRUCTIONS_JSON');
  }

  get paymentsMockSecret(): string | undefined {
    return this.config.get<string | undefined>('PAYMENTS_MOCK_SECRET');
  }

  get ipHashSecret(): string {
    return this.required('IP_HASH_SECRET');
  }

  get swaggerEnabled(): boolean {
    return this.required('SWAGGER_ENABLED');
  }

  get lifecycleCronEnabled(): boolean {
    return this.required('LIFECYCLE_CRON_ENABLED');
  }

  /** Web route to POST revalidation to; `undefined` = disabled. */
  get webRevalidateUrl(): string | undefined {
    return this.config.get<string | undefined>('WEB_REVALIDATE_URL');
  }

  get revalidateSecret(): string | undefined {
    return this.config.get<string | undefined>('REVALIDATE_SECRET');
  }

  get sentryDsn(): string | undefined {
    return this.required('SENTRY_DSN');
  }

  get sentryEnvironment(): string {
    return this.required('SENTRY_ENVIRONMENT');
  }
}
