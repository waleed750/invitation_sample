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
import {AuthRepository} from './auth/auth.repository';
import {TEST_JWT_SECRET, setTestEnv} from './testing/env';

export {TEST_JWT_SECRET, setTestEnv};

export interface TestTokenOptions {
  subject?: string;
  audience?: string;
  /** Seconds from now; negative = already expired. */
  expiresInSeconds?: number;
  secret?: string;
}

/** Signs an HS256 JWT the `AuthGuard` accepts when `BETTER_AUTH_SECRET` matches. */
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

/** In-process HTTP client returned by `bootApp` (supertest agent). */
export type HttpClient = ReturnType<typeof request>;

/** Boots the real `AppModule` in-process (no port) with production settings applied.
 *
 * `@nestjs/config` validates eagerly at import time, so per-boot `overrides`
 * would otherwise be ignored: the validated `AppConfigService` is rebuilt
 * here from the current `process.env` and overridden for every boot.
 * Pass `roleResult` to stub the role lookup (`AuthRepository`) so the
 * `RolesGuard` resolves instantly.
 * Non-admin routes never touch it; repository data comes from the real
 * `DbService` (unroutable `DATABASE_URL` in tests, so upstream failures
 * surface as 503, which is what the wiring specs assert).
 */
export async function bootApp(
  overrides: Record<string, string> = {},
  roleResult?: MockSingleResult
): Promise<{
  app: INestApplication;
  http: HttpClient;
}> {
  setTestEnv(overrides);
  const freshConfig = new AppConfigService(new ConfigService(validateEnv({...process.env})));
  const builder = Test.createTestingModule({imports: [AppModule]})
    .overrideProvider(AppConfigService)
    .useValue(freshConfig);
  if (roleResult !== undefined) {
    builder.overrideProvider(AuthRepository).useValue({
      findRoleByUserId: () => {
        if (roleResult.error) return Promise.reject(new Error('DB Error'));
        const data = roleResult.data as {role?: string} | undefined | null;
        return Promise.resolve(data?.role ? {role: data.role} : null);
      }
    });
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({logger: false});
  setupApp(app);
  await app.init();
  return {app, http: request(app.getHttpServer())};
}
