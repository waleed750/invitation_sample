import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {ConfigService} from '@nestjs/config';
import {SignJWT} from 'jose';
import type {NestExpressApplication} from '@nestjs/platform-express';
import request from 'supertest';
import {AppModule} from './app.module';
import {setupApp} from './setup-app';
import {AppConfigService} from './config/app-config.service';
import {validateEnv} from './config/env.schema';
import {SupabaseService} from './supabase/supabase.service';
import {TEST_JWT_SECRET, setTestEnv} from './testing/env';

export {TEST_JWT_SECRET, setTestEnv};

export interface TestTokenOptions {
  subject?: string;
  audience?: string;
  /** Seconds from now; negative = already expired. */
  expiresInSeconds?: number;
  secret?: string;
}

/** Signs an HS256 JWT the `AuthGuard` accepts when `SUPABASE_JWT_SECRET` matches. */
export async function signTestToken(options: TestTokenOptions = {}): Promise<string> {
  const {subject = 'user-123', audience = 'authenticated', expiresInSeconds = 3600, secret = TEST_JWT_SECRET} = options;
  const key = new TextEncoder().encode(secret);
  return new SignJWT({})
    .setProtectedHeader({alg: 'HS256'})
    .setSubject(subject)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(key);
}

export interface MockSingleResult {
  data: unknown;
  error: {code: string} | null;
}

/** Minimal structural stub for the `from().select().eq().single()` chain. */
export interface StubSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {eq: (column: string, value: string) => {single: () => Promise<MockSingleResult>}};
  };
}

export function mockSupabaseClient(result: MockSingleResult): StubSupabaseClient {
  return {from: () => ({select: () => ({eq: () => ({single: () => Promise.resolve(result)})})})};
}

export function pgNotFound(): MockSingleResult {
  return {data: null, error: {code: 'PGRST116'}};
}

/** In-process HTTP client returned by `bootApp` (supertest agent). */
export type HttpClient = ReturnType<typeof request>;

/** Boots the real `AppModule` in-process (no port) with production settings applied.
 *
 * `@nestjs/config` validates eagerly at import time, so per-boot `overrides`
 * would otherwise be ignored: the validated `AppConfigService` is rebuilt
 * here from the current `process.env` and overridden for every boot.
 * Pass `supabaseResult` to replace the real Supabase client with a stub that
 * resolves `{ data, error }` instantly (the real client retries unreachable
 * hosts for seconds — fine in production, too slow for tests).
 */
export async function bootApp(
  overrides: Record<string, string> = {},
  supabaseResult?: MockSingleResult
): Promise<{
  app: INestApplication;
  http: HttpClient;
}> {
  setTestEnv(overrides);
  const freshConfig = new AppConfigService(new ConfigService(validateEnv({...process.env})));
  const builder = Test.createTestingModule({imports: [AppModule]})
    .overrideProvider(AppConfigService)
    .useValue(freshConfig);
  if (supabaseResult !== undefined) {
    builder.overrideProvider(SupabaseService).useValue({forUser: () => mockSupabaseClient(supabaseResult)});
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({logger: false});
  setupApp(app);
  await app.init();
  return {app, http: request(app.getHttpServer())};
}
