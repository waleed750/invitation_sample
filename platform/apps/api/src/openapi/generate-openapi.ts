/**
 * Writes `packages/api-client/openapi.json` from the Nest app, in-process:
 * no listening socket, no network (dummy env, Supabase URL is unroutable and
 * never called at boot). Run via `npm run openapi --workspace @platform/api`.
 */
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Dummy, deterministic env — set BEFORE the app modules are imported.
Object.assign(process.env, {
  PORT: '3001',
  NODE_ENV: 'test',
  WEB_ORIGINS: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://app_api:openapi-dummy@127.0.0.1:9/openapi',
  DATABASE_POOL_MAX: '10',
  DATABASE_STATEMENT_TIMEOUT_MS: '5000',
  THROTTLE_TTL_MS: '60000',
  THROTTLE_LIMIT: '100',
  PAYMENTS_PROVIDER: 'mock',
  MANUAL_PAYMENT_INSTRUCTIONS_JSON: '',
  PAYMENTS_MOCK_SECRET: 'openapi-dummy-mock-secret-at-least-32-chars',
  IP_HASH_SECRET: 'openapi-dummy-ip-hash-secret-at-least-32-ch',
  WEB_REVALIDATE_URL: '',
  REVALIDATE_SECRET: '',
  SWAGGER_ENABLED: 'true',
  LIFECYCLE_CRON_ENABLED: 'false',
SENTRY_DSN: '',
  BODY_LIMIT_KB: '100',
  BETTER_AUTH_SECRET: 'openapi-better-auth-secret-32-chars-min',
  BETTER_AUTH_URL: 'http://localhost:3001',
  AUTH_COOKIE_DOMAIN: '',
  PHONE_LOGIN_ENABLED: 'false',
  OTP_DAILY_CAP: '500',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_USER: 'test',
  SMTP_PASS: 'test',
  SMTP_FROM: 'test@example.com',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  PAYMENT_EVENTS_SECRET: '',
  EASYCONFIRM_API_KEY: '',
  EASYCONFIRM_SIGNATURE_HEADER: 'x-signature',
  EASYCONFIRM_TIMESTAMP_HEADER: 'x-timestamp'
});

/** Recursively sort object keys so the output is diff-stable. Arrays keep their order. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, child]) => [key, sortKeys(child)])
    );
  }
  return value;
}

async function main(): Promise<void> {
  const {NestFactory} = await import('@nestjs/core');
  const {AppModule} = await import('../app.module');
  const {buildOpenApiDocument, setupApp} = await import('../setup-app');

  const app = await NestFactory.create(AppModule, {logger: false});
  setupApp(app);
  await app.init();
  const document = buildOpenApiDocument(app);
  const target = resolve(__dirname, '../../../../packages/api-client/openapi.json');
  writeFileSync(target, `${JSON.stringify(sortKeys(document), null, 2)}\n`);
  await app.close();
  process.stdout.write(`wrote ${target}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exit(1);
});
