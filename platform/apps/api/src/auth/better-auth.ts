/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-member-access */
import { betterAuth } from 'better-auth';
import { emailOTP, phoneNumber, bearer } from 'better-auth/plugins';
import { Pool } from 'pg';
import { AppConfigService } from '../config/app-config.service';
import crypto from 'node:crypto';
import { toNodeHandler } from 'better-auth/node';
import type { LoginCodeDelivery } from './login-code';
import { ensureAuthUser } from './auth-user';

let authInstance: any = null;
// Set once at boot (setupApp); read lazily so it does not matter who builds the instance first.
let loginCodeDelivery: LoginCodeDelivery | undefined;

export function setLoginCodeDelivery(deliver: LoginCodeDelivery): void {
  loginCodeDelivery = deliver;
}

export function getBetterAuth(config: AppConfigService): any {
  if (authInstance) return authInstance;

  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: config.databasePoolMax,
    statement_timeout: config.databaseStatementTimeoutMs,
    options: '-c search_path=better_auth,public'
  });

  authInstance = betterAuth({
    database: pool,
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    // The web client and the Nest middleware both use /v1/auth (Better Auth defaults to /api/auth).
    basePath: '/v1/auth',
    advanced: {
      defaultCookieAttributes: {
        domain: config.authCookieDomain,
        sameSite: 'lax',
        secure: config.isProduction,
        httpOnly: true
      },
      // better_auth.* ids are uuid columns; Better Auth's default ids are random strings.
      database: { generateId: () => crypto.randomUUID() }
    },
    trustedOrigins: config.webOrigins,
    emailAndPassword: {
      enabled: false
    },
    rateLimit: {
      storage: "memory", 
      window: 60,
      max: 100
    },
    databaseHooks: {
      user: {
        create: {
          // A user without an auth.users/profiles row cannot do anything, so a failure must surface.
          after: async (user: any) => {
            await ensureAuthUser(pool, user.id);
          }
        }
      },
      session: {
        create: {
          // Self-heal: guarantees the profile exists on every sign-in (idempotent).
          before: async (session: any) => {
            await ensureAuthUser(pool, session.userId);
          }
        }
      }
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 5 * 60,
        async sendVerificationOTP({ email, otp }) {
          if (!loginCodeDelivery) {
            throw new Error('login code delivery is not configured');
          }
          await loginCodeDelivery(email, otp);
        }
      }),
      config.phoneLoginEnabled ? phoneNumber({
        sendOTP: async ({ phoneNumber }) => {
          console.log(`[DEV ONLY] Phone OTP for ${phoneNumber} sent`);
        }
      }) : null,
      bearer()
    ].filter(Boolean) as any[]
  });

  return authInstance;
}

export function getBetterAuthHandler(config: AppConfigService): any {
  return toNodeHandler(getBetterAuth(config));
}
