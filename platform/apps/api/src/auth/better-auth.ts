/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { betterAuth } from 'better-auth';
import { emailOTP, phoneNumber, bearer } from 'better-auth/plugins';
import { Pool } from 'pg';
import { AppConfigService } from '../config/app-config.service';
import crypto from 'node:crypto';
import { toNodeHandler } from 'better-auth/node';

let authInstance: any = null;

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
    advanced: {
      defaultCookieAttributes: {
        domain: config.authCookieDomain,
        sameSite: 'lax',
        secure: config.isProduction,
        httpOnly: true
      },
      generateId: () => crypto.randomUUID()
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
          after: async (user: any) => {
            try {
               await pool.query(
                 `INSERT INTO auth.users (id, aud, role, email, phone, raw_user_meta_data, raw_app_meta_data)
                  VALUES ($1, 'authenticated', 'authenticated', $2, $3, $4, $5)`,
                 [
                   user.id,
                   user.email ?? null,
                   user.phoneNumber ?? null,
                   JSON.stringify({ name: user.name }), 
                   JSON.stringify({ provider: 'email' })
                 ]
               );
            } catch (err) {
               console.error("Failed to insert into auth.users", err);
            }
          }
        }
      }
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 5 * 60,
        async sendVerificationOTP({ email }) {
          if (config.isProduction) {
            // SMTP
          } else {
            console.log(`[DEV ONLY] OTP for ${email} sent`);
          }
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
