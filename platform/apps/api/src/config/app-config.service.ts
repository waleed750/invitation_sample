import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import type {AppEnv} from './env.schema';

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

  get supabaseUrl(): string {
    return this.required('SUPABASE_URL');
  }

  get supabaseAnonKey(): string {
    return this.required('SUPABASE_ANON_KEY');
  }

  get supabaseServiceRoleKey(): string {
    return this.required('SUPABASE_SERVICE_ROLE_KEY');
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

  get paymentsMockSecret(): string {
    return this.required('PAYMENTS_MOCK_SECRET');
  }

  get ipHashSecret(): string {
    return this.required('IP_HASH_SECRET');
  }

  get swaggerEnabled(): boolean {
    return this.required('SWAGGER_ENABLED');
  }

  get sentryDsn(): string | undefined {
    return this.required('SENTRY_DSN');
  }

  get sentryEnvironment(): string {
    return this.required('SENTRY_ENVIRONMENT');
  }
}
