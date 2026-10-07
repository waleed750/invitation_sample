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
  SUPABASE_URL: 'http://127.0.0.1:9',
  SUPABASE_ANON_KEY: 'openapi-dummy-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'openapi-dummy-service-role-key',
  SUPABASE_JWT_SECRET: 'openapi-dummy-jwt-secret-at-least-32-chars',
  SUPABASE_TIMEOUT_MS: '5000',
  THROTTLE_TTL_MS: '60000',
  THROTTLE_LIMIT: '100',
  PAYMENTS_PROVIDER: 'mock',
  PAYMENTS_MOCK_SECRET: 'openapi-dummy-mock-secret-at-least-32-chars',
  SWAGGER_ENABLED: 'true',
  SENTRY_DSN: ''
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
