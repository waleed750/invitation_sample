import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import type {AppEnv, ManualPaymentInstructions} from './env.schema';

/** Typed, fail-loud accessor over the validated environment. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  /** Optional string setting; unset and blank both read as `undefined`. */
  private optional(key: keyof AppEnv): string | undefined {
    const value = this.config.get<string | undefined>(key);
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
  }

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

  get trustProxy(): string {
    return this.required('TRUST_PROXY');
  }

  get bodyLimitKb(): number {
    return this.required('BODY_LIMIT_KB');
  }

  get betterAuthSecret(): string {
    return this.required('BETTER_AUTH_SECRET');
  }

  get betterAuthUrl(): string {
    return this.required('BETTER_AUTH_URL');
  }

  get authCookieDomain(): string | undefined {
    return this.optional('AUTH_COOKIE_DOMAIN');
  }

  get phoneLoginEnabled(): boolean {
    return this.required('PHONE_LOGIN_ENABLED');
  }

  get otpDailyCap(): number {
    return this.required('OTP_DAILY_CAP');
  }

  get smtpHost(): string {
    return this.required('SMTP_HOST');
  }

  get smtpPort(): number {
    return this.required('SMTP_PORT');
  }

  get smtpUser(): string {
    return this.required('SMTP_USER');
  }

  get smtpPass(): string {
    return this.required('SMTP_PASS');
  }

  get smtpFrom(): string {
    return this.required('SMTP_FROM');
  }

  /** `smtp` in production unless overridden; `log` elsewhere unless `EMAIL_SENDER=smtp`. */
  get emailChannel(): 'smtp' | 'log' {
    const override = this.optional('EMAIL_SENDER');
    if (override === 'smtp' || override === 'log') return override;
    return this.isProduction ? 'smtp' : 'log';
  }

  /** Launch mode: purchases are paid from the credit balance (or wait as "awaiting balance"). */
  get purchasesViaBalance(): boolean {
    return this.required('PURCHASES_VIA_BALANCE');
  }

  /** Auto-confirm from payment notifications. Off by default (manual confirmation only). */
  get paymentEventsEnabled(): boolean {
    return this.required('PAYMENT_EVENTS_ENABLED');
  }

  get mediaStorage(): 'local' | 's3' {
    return this.required('MEDIA_STORAGE');
  }

  get mediaDir(): string {
    return this.required('MEDIA_DIR');
  }

  /** Base URL files are served from; defaults to the API's own /media route. */
  get mediaPublicBaseUrl(): string {
    return this.optional('MEDIA_PUBLIC_BASE_URL') ?? `${this.betterAuthUrl.replace(/\/+$/, '')}/media`;
  }

  get mediaServeFromApi(): boolean {
    return this.required('MEDIA_SERVE_FROM_API');
  }

  get mediaS3(): {endpoint?: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string; forcePathStyle: boolean} | null {
    const bucket = this.optional('MEDIA_S3_BUCKET');
    const region = this.optional('MEDIA_S3_REGION');
    const accessKeyId = this.optional('MEDIA_S3_ACCESS_KEY');
    const secretAccessKey = this.optional('MEDIA_S3_SECRET_KEY');
    if (bucket === undefined || region === undefined || accessKeyId === undefined || secretAccessKey === undefined) return null;
    const endpoint = this.optional('MEDIA_S3_ENDPOINT');
    return {...(endpoint === undefined ? {} : {endpoint}), region, bucket, accessKeyId, secretAccessKey, forcePathStyle: this.required('MEDIA_S3_FORCE_PATH_STYLE')};
  }

  /** Test-only sign-in code capture; the schema refuses it in production. */
  get e2eCaptureEmails(): boolean {
    return this.config.get<boolean | undefined>('E2E_CAPTURE_EMAILS') === true;
  }

  get notificationsEmailEnabled(): boolean {
    return this.required('NOTIFICATIONS_EMAIL_ENABLED');
  }

  get googleClientId(): string | undefined {
    return this.optional('GOOGLE_CLIENT_ID');
  }

  get googleClientSecret(): string | undefined {
    return this.optional('GOOGLE_CLIENT_SECRET');
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
    return this.optional('SENTRY_DSN');
  }

  get sentryEnvironment(): string {
    return this.required('SENTRY_ENVIRONMENT');
  }
  // L3 payment events: optional config must not use required().
  get paymentEventsSecret(): string | undefined { return this.config.get<string>('PAYMENT_EVENTS_SECRET'); }
  get easyconfirmApiKey(): string | undefined { return this.config.get<string>('EASYCONFIRM_API_KEY'); }
  get easyconfirmSignatureHeader(): string { return this.required('EASYCONFIRM_SIGNATURE_HEADER'); }
  get easyconfirmTimestampHeader(): string { return this.required('EASYCONFIRM_TIMESTAMP_HEADER'); }
  // End L3 payment events.
}
