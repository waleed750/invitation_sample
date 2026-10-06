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

  it('requires a strong mock webhook secret', () => {
    expect(() => validateEnv({...validEnv(), PAYMENTS_MOCK_SECRET: 'short'})).toThrow(/PAYMENTS_MOCK_SECRET/);
  });
});
