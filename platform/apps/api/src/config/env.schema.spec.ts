import {validateEnv} from './env.schema';
import {TEST_JWT_SECRET, setTestEnv} from '../test-helpers';

setTestEnv();

function validEnv(): Record<string, unknown> {
  return {
    PORT: '3001',
    NODE_ENV: 'test',
    WEB_ORIGINS: 'http://localhost:3000,https://example.com',
    DATABASE_URL: 'postgresql://app_api:pw@127.0.0.1:5432/postgres',
        THROTTLE_TTL_MS: '60000',
    THROTTLE_LIMIT: '100',
    PAYMENTS_PROVIDER: 'mock',
    PAYMENTS_MOCK_SECRET: 'test-mock-secret-at-least-32-characters',
    IP_HASH_SECRET: 'test-ip-hash-secret-at-least-32-chars',
    SWAGGER_ENABLED: 'false',
    BETTER_AUTH_SECRET: 'test-better-auth-secret-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3001',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_USER: 'user',
    SMTP_PASS: 'pass',
    SMTP_FROM: 'noreply@example.com'
  };
}

describe('validateEnv', () => {
  it('accepts a complete env and coerces types', () => {
    const env = validateEnv(validEnv());
    expect(env.PORT).toBe(3001);
    expect(env.WEB_ORIGINS).toEqual(['http://localhost:3000', 'https://example.com']);
    expect(env.THROTTLE_TTL_MS).toBe(60000);
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('fails fast with a readable list of every problem', () => {
    let error: unknown;
    try {
      validateEnv({PORT: 'not-a-port', WEB_ORIGINS: '', THROTTLE_TTL_MS: '0', THROTTLE_LIMIT: '-5'});
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toMatch(/^Invalid environment:/);
    // Every offender is named on its own line …
    expect(message).toContain('PORT');
    expect(message).toContain('WEB_ORIGINS');
    expect(message).toContain('DATABASE_URL');
    // … including invalid values, not just missing ones.
    expect(message).toContain('THROTTLE_TTL_MS');
    expect(message).toContain('THROTTLE_LIMIT');
  });

  it('boots without any SUPABASE_* variable and applies database defaults', () => {
    const rest = validEnv();
    delete rest.SUPABASE_URL;
    delete rest.SUPABASE_ANON_KEY;
    delete rest.SUPABASE_SERVICE_ROLE_KEY;
    delete rest.SUPABASE_JWT_SECRET;
    const env = validateEnv(rest);
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.DATABASE_POOL_MAX).toBe(10);
    expect(env.DATABASE_STATEMENT_TIMEOUT_MS).toBe(5000);
  });

  it('requires a postgres DATABASE_URL', () => {
    const rest = validEnv();
    delete rest.DATABASE_URL;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({...rest, DATABASE_URL: 'http://x'})).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-URL origin entry', () => {
    expect(() => validateEnv({...validEnv(), WEB_ORIGINS: 'http://localhost:3000,not-a-url'})).toThrow(/WEB_ORIGINS/);
  });

  it('rejects SWAGGER_ENABLED values other than true/false', () => {
    expect(() => validateEnv({...validEnv(), SWAGGER_ENABLED: 'yes'})).toThrow(/SWAGGER_ENABLED/);
  });

  it('treats blank WEB_REVALIDATE_URL as disabled and needs a 32+ char secret when set', () => {
    const blank = validateEnv({...validEnv(), WEB_REVALIDATE_URL: '  ', REVALIDATE_SECRET: ''});
    expect(blank.WEB_REVALIDATE_URL).toBeUndefined();
    expect(blank.REVALIDATE_SECRET).toBeUndefined();
    const url = 'https://example.com/api/revalidate';
    expect(() => validateEnv({...validEnv(), WEB_REVALIDATE_URL: url})).toThrow(/REVALIDATE_SECRET/);
    expect(() => validateEnv({...validEnv(), WEB_REVALIDATE_URL: url, REVALIDATE_SECRET: 'short'})).toThrow(/REVALIDATE_SECRET/);
    expect(() => validateEnv({...validEnv(), WEB_REVALIDATE_URL: 'nope', REVALIDATE_SECRET: 'x'.repeat(32)})).toThrow(/WEB_REVALIDATE_URL/);
    const ok = validateEnv({...validEnv(), WEB_REVALIDATE_URL: url, REVALIDATE_SECRET: 'x'.repeat(32)});
    expect(ok.WEB_REVALIDATE_URL).toBe(url);
  });

  it('rejects the mock payment provider in production', () => {
    expect(() => validateEnv({...validEnv(), NODE_ENV: 'production'})).toThrow(/mock payments are disabled in production/);
  });

  it('allows the manual payment provider in production and refuses fawry', () => {
    expect(validateEnv({...validEnv(), NODE_ENV: 'production', PAYMENTS_PROVIDER: 'manual'}).PAYMENTS_PROVIDER).toBe('manual');
    expect(() => validateEnv({...validEnv(), NODE_ENV: 'production', PAYMENTS_PROVIDER: 'fawry'})).toThrow(/fawry not implemented yet/);
    expect(validateEnv({...validEnv(), PAYMENTS_PROVIDER: 'fawry'}).PAYMENTS_PROVIDER).toBe('fawry');
    expect(() => validateEnv({...validEnv(), PAYMENTS_PROVIDER: 'stripe'})).toThrow(/PAYMENTS_PROVIDER/);
  });

  it('parses MANUAL_PAYMENT_INSTRUCTIONS_JSON, treating blank as unset', () => {
    expect(validateEnv({...validEnv(), MANUAL_PAYMENT_INSTRUCTIONS_JSON: '  '}).MANUAL_PAYMENT_INSTRUCTIONS_JSON).toBeUndefined();
    const json = JSON.stringify({methods: [{id: 'instapay', label: {ar: 'a', en: 'InstaPay'}, details: {ar: 'b', en: 'pay to x'}}]});
    expect(validateEnv({...validEnv(), MANUAL_PAYMENT_INSTRUCTIONS_JSON: json}).MANUAL_PAYMENT_INSTRUCTIONS_JSON?.methods[0]?.id).toBe('instapay');
    expect(() => validateEnv({...validEnv(), MANUAL_PAYMENT_INSTRUCTIONS_JSON: '{nope'})).toThrow(/valid JSON/);
    expect(() => validateEnv({...validEnv(), MANUAL_PAYMENT_INSTRUCTIONS_JSON: '{"methods":[{"id":"cash","label":{"ar":"a","en":"b"},"details":{"ar":"a","en":"b"}}]}'}))
      .toThrow(/MANUAL_PAYMENT_INSTRUCTIONS_JSON/);
  });

  it('requires a strong mock webhook secret when provider is mock', () => {
    expect(() => validateEnv({...validEnv(), PAYMENTS_MOCK_SECRET: 'short'})).toThrow(/PAYMENTS_MOCK_SECRET/);
    expect(() => validateEnv({...validEnv(), PAYMENTS_MOCK_SECRET: '   '})).toThrow(/PAYMENTS_MOCK_SECRET/);
    expect(() => validateEnv({...validEnv(), PAYMENTS_MOCK_SECRET: undefined})).toThrow(/PAYMENTS_MOCK_SECRET/);
  });

  it('allows blank mock webhook secret when provider is manual', () => {
    const validWithManual: Record<string, unknown> = {...validEnv(), PAYMENTS_PROVIDER: 'manual'};
    delete validWithManual.PAYMENTS_MOCK_SECRET;
    expect(validateEnv(validWithManual).PAYMENTS_MOCK_SECRET).toBeUndefined();
    expect(validateEnv({...validWithManual, PAYMENTS_MOCK_SECRET: '  '}).PAYMENTS_MOCK_SECRET).toBeUndefined();
  });

  it('treats a blank SENTRY_DSN as unset and accepts a valid one', () => {
    expect(validateEnv(validEnv()).SENTRY_DSN).toBeUndefined();
    expect(validateEnv({...validEnv(), SENTRY_DSN: '   '}).SENTRY_DSN).toBeUndefined();
    const dsn = 'https://abc123@o1.ingest.sentry.io/42';
    expect(validateEnv({...validEnv(), SENTRY_DSN: dsn}).SENTRY_DSN).toBe(dsn);
  });

  it('rejects a malformed SENTRY_DSN', () => {
    expect(() => validateEnv({...validEnv(), SENTRY_DSN: 'not-a-dsn'})).toThrow(/SENTRY_DSN/);
  });

  it('defaults SENTRY_ENVIRONMENT from NODE_ENV and honours an override', () => {
    expect(validateEnv(validEnv()).SENTRY_ENVIRONMENT).toBe('test');
    expect(validateEnv({...validEnv(), SENTRY_ENVIRONMENT: '  '}).SENTRY_ENVIRONMENT).toBe('test');
    expect(validateEnv({...validEnv(), SENTRY_ENVIRONMENT: 'staging'}).SENTRY_ENVIRONMENT).toBe('staging');
  });

  it('defaults LIFECYCLE_CRON_ENABLED to true and parses true/false', () => {
    expect(validateEnv(validEnv()).LIFECYCLE_CRON_ENABLED).toBe(true);
    expect(validateEnv({...validEnv(), LIFECYCLE_CRON_ENABLED: 'true'}).LIFECYCLE_CRON_ENABLED).toBe(true);
    expect(validateEnv({...validEnv(), LIFECYCLE_CRON_ENABLED: 'false'}).LIFECYCLE_CRON_ENABLED).toBe(false);
  });

  it('rejects LIFECYCLE_CRON_ENABLED values other than true/false', () => {
    expect(() => validateEnv({...validEnv(), LIFECYCLE_CRON_ENABLED: 'yes'})).toThrow(/LIFECYCLE_CRON_ENABLED/);
  });
});
