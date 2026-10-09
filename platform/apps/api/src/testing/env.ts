/** Test-only env defaults. Import-free of the app so `jest.setup.ts` can load it first. */
export const TEST_JWT_SECRET = 'test-only-jwt-secret-at-least-32-chars-long';

export const BASE_ENV: Record<string, string> = {
  PORT: '3101',
  NODE_ENV: 'test',
  WEB_ORIGINS: 'http://localhost:3000',
  // Unroutable on purpose: postgres.js connects lazily, so no spec touches a DB.
  DATABASE_URL: 'postgresql://app_api:test@127.0.0.1:9/test',
  DATABASE_POOL_MAX: '10',
  DATABASE_STATEMENT_TIMEOUT_MS: '5000',
  // Legacy (optional). Unroutable on purpose: no spec may touch the network. Any Supabase call
  // fails fast (connection refused) and services map it to 503.
  SUPABASE_URL: 'http://127.0.0.1:9',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  SUPABASE_JWT_SECRET: TEST_JWT_SECRET,
  SUPABASE_TIMEOUT_MS: '5000',
  THROTTLE_TTL_MS: '60000',
  THROTTLE_LIMIT: '100',
  PAYMENTS_PROVIDER: 'mock',
  MANUAL_PAYMENT_INSTRUCTIONS_JSON: '',
  PAYMENTS_MOCK_SECRET: 'test-mock-secret-at-least-32-characters',
  IP_HASH_SECRET: 'test-ip-hash-secret-at-least-32-chars',
  WEB_REVALIDATE_URL: '',
  REVALIDATE_SECRET: '',
  SWAGGER_ENABLED: 'false',
  LIFECYCLE_CRON_ENABLED: 'true'
  // L3 payment events: disabled by default in test/OpenAPI environments.
  , PAYMENT_EVENTS_SECRET: '',
  EASYCONFIRM_API_KEY: '',
  EASYCONFIRM_SIGNATURE_HEADER: 'x-signature',
  EASYCONFIRM_TIMESTAMP_HEADER: 'x-timestamp'
  // End L3 payment events.

};

/** Deterministic env for specs. `jest.setup.ts` calls this before any import. */
export function setTestEnv(overrides: Record<string, string> = {}): void {
  for (const [key, value] of Object.entries({...BASE_ENV, ...overrides})) {
    process.env[key] = value;
  }
}
