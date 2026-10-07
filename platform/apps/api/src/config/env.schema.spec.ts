import {validateEnv} from './env.schema';
import {TEST_JWT_SECRET, setTestEnv} from '../test-helpers';

setTestEnv();

function validEnv(): Record<string, unknown> {
  return {
    PORT: '3001',
    NODE_ENV: 'test',
    WEB_ORIGINS: 'http://localhost:3000,https://example.com',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    SUPABASE_JWT_SECRET: TEST_JWT_SECRET,
    THROTTLE_TTL_MS: '60000',
    THROTTLE_LIMIT: '100',
    PAYMENTS_PROVIDER: 'mock',
    PAYMENTS_MOCK_SECRET: 'test-mock-secret-at-least-32-characters',
    IP_HASH_SECRET: 'test-ip-hash-secret-at-least-32-chars',
    SWAGGER_ENABLED: 'false'
  };
}

describe('validateEnv', () => {
  it('accepts a complete env and coerces types', () => {
    const env = validateEnv(validEnv());
    expect(env.PORT).toBe(3001);
    expect(env.WEB_ORIGINS).toEqual(['http://localhost:3000', 'https://example.com']);
    expect(env.THROTTLE_TTL_MS).toBe(60000);
    expect(env.SWAGGER_ENABLED).toBe(false);
    expect(env.SUPABASE_JWT_SECRET).toBe(TEST_JWT_SECRET);
  });

  it('defaults SUPABASE_TIMEOUT_MS to 5000 and rejects values under 100', () => {
    expect(validateEnv(validEnv()).SUPABASE_TIMEOUT_MS).toBe(5000);
    expect(validateEnv({...validEnv(), SUPABASE_TIMEOUT_MS: '100'}).SUPABASE_TIMEOUT_MS).toBe(100);
    expect(() => validateEnv({...validEnv(), SUPABASE_TIMEOUT_MS: '50'})).toThrow(/SUPABASE_TIMEOUT_MS/);
  });

  it('treats a blank SUPABASE_JWT_SECRET as unset (JWKS mode)', () => {
    const env = validateEnv({...validEnv(), SUPABASE_JWT_SECRET: '   '});
    expect(env.SUPABASE_JWT_SECRET).toBeUndefined();
  });

  it('fails fast with a readable list of every problem', () => {
    let error: unknown;
    try {
      validateEnv({PORT: 'not-a-port', WEB_ORIGINS: '', SUPABASE_URL: 'nope', THROTTLE_TTL_MS: '0', THROTTLE_LIMIT: '-5'});
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toMatch(/^Invalid environment:/);
    // Every offender is named on its own line …
    expect(message).toContain('PORT');
    expect(message).toContain('WEB_ORIGINS');
    expect(message).toContain('SUPABASE_URL');
    expect(message).toContain('SUPABASE_ANON_KEY');
    expect(message).toContain('SUPABASE_SERVICE_ROLE_KEY');
    // … including invalid values, not just missing ones.
    expect(message).toContain('THROTTLE_TTL_MS');
    expect(message).toContain('THROTTLE_LIMIT');
  });

  it('rejects a non-URL origin entry', () => {
    expect(() => validateEnv({...validEnv(), WEB_ORIGINS: 'http://localhost:3000,not-a-url'})).toThrow(/WEB_ORIGINS/);
  });

  it('rejects SWAGGER_ENABLED values other than true/false', () => {
    expect(() => validateEnv({...validEnv(), SWAGGER_ENABLED: 'yes'})).toThrow(/SWAGGER_ENABLED/);
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

  it('requires a strong mock webhook secret', () => {
    expect(() => validateEnv({...validEnv(), PAYMENTS_MOCK_SECRET: 'short'})).toThrow(/PAYMENTS_MOCK_SECRET/);
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
