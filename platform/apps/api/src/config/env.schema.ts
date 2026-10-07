import {z} from 'zod';

// Environment contract for the API. Everything is validated once at boot via
// `validateEnv` (wired into `ConfigModule.forRoot({ validate })`) so the
// process fails fast with a readable list instead of crashing mid-request.
const localized = z.object({ar: z.string().min(1), en: z.string().min(1)}).strict();

/** Manual payment instructions shown to the customer after checkout (admin-editable later). */
export const manualPaymentInstructionsSchema = z.object({
  methods: z.array(z.object({
    id: z.enum(['instapay', 'wallet', 'bank']),
    label: localized,
    details: localized
  }).strict()).min(1)
}).strict();
export type ManualPaymentInstructions = z.output<typeof manualPaymentInstructionsSchema>;

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Comma-separated browser origins, e.g. `https://a.com,https://b.com`.
  WEB_ORIGINS: z
    .string()
    .min(1, 'WEB_ORIGINS must be a non-empty comma-separated list of origins')
    .transform((raw) =>
      raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    )
    .pipe(
      z
        .array(z.url('each WEB_ORIGINS entry must be a valid URL origin'))
        .min(1, 'WEB_ORIGINS must contain at least one origin')
    ),
  SUPABASE_URL: z.url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY must not be empty'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY must not be empty'),
  // Hard cap on any single Supabase HTTP call. Without it an outage hangs
  // every authenticated request (postgrest retries + no timeout).
  SUPABASE_TIMEOUT_MS: z.coerce.number().int().min(100, 'SUPABASE_TIMEOUT_MS must be at least 100').default(5000),
  // Optional: blank/whitespace counts as unset. When set, Supabase JWTs are
  // verified locally (HS256); otherwise the project's JWKS endpoint is used.
  SUPABASE_JWT_SECRET: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value)),
  // Optional: blank/whitespace counts as unset. Sentry only initialises when a DSN is set.
  SENTRY_DSN: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim()))
    .pipe(z.url('SENTRY_DSN must be a valid URL').optional()),
  // Optional label for Sentry events; blank falls back to NODE_ENV (see the final transform).
  SENTRY_ENVIRONMENT: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim())),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  PAYMENTS_PROVIDER: z.enum(['mock', 'manual', 'fawry']).default('mock'),
  // Optional: blank/whitespace counts as unset. JSON `{methods:[{id,label:{ar,en},details:{ar,en}}]}`.
  MANUAL_PAYMENT_INSTRUCTIONS_JSON: z
    .string()
    .optional()
    .transform((value, context): unknown => {
      if (value === undefined || value.trim() === '') return undefined;
      try {
        return JSON.parse(value) as unknown;
      } catch {
        context.addIssue({code: 'custom', message: 'MANUAL_PAYMENT_INSTRUCTIONS_JSON must be valid JSON'});
        return z.NEVER;
      }
    })
    .pipe(manualPaymentInstructionsSchema.optional()),
  PAYMENTS_MOCK_SECRET: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim())),
  // HMAC secret for guest IP hashing (server only, never returned). Raw IPs are never stored.
  IP_HASH_SECRET: z.string().min(32, 'IP_HASH_SECRET must be at least 32 characters'),
  // Optional: blank/whitespace counts as unset (revalidation then only logs). Web route that revalidates a published page.
  WEB_REVALIDATE_URL: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim()))
    .pipe(z.url('WEB_REVALIDATE_URL must be a valid URL').optional()),
  // HMAC-SHA256 key for the revalidation webhook. Required when WEB_REVALIDATE_URL is set.
  REVALIDATE_SECRET: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim())),
  SWAGGER_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  // Kill-switch for the daily lifecycle cron (B4). Off in tests via NODE_ENV,
  // but this flag also lets ops pause the job without a redeploy.
  LIFECYCLE_CRON_ENABLED: z.enum(['true', 'false']).default('true').transform((value) => value === 'true')
}).superRefine((env, context) => {
  if (env.WEB_REVALIDATE_URL !== undefined && (env.REVALIDATE_SECRET === undefined || env.REVALIDATE_SECRET.length < 32)) {
    context.addIssue({
      code: 'custom', path: ['REVALIDATE_SECRET'],
      message: 'REVALIDATE_SECRET (at least 32 characters) is required when WEB_REVALIDATE_URL is set'
    });
  }
  if (env.NODE_ENV === 'production') {
    if (env.PAYMENTS_PROVIDER === 'mock') {
      context.addIssue({code: 'custom', path: ['PAYMENTS_PROVIDER'], message: 'mock payments are disabled in production'});
    }
    if (env.PAYMENTS_PROVIDER === 'fawry') {
      context.addIssue({code: 'custom', path: ['PAYMENTS_PROVIDER'], message: 'fawry not implemented yet'});
    }
  }
  if (env.PAYMENTS_PROVIDER === 'mock') {
    if (!env.PAYMENTS_MOCK_SECRET || env.PAYMENTS_MOCK_SECRET.length < 32) {
      context.addIssue({code: 'custom', path: ['PAYMENTS_MOCK_SECRET'], message: 'PAYMENTS_MOCK_SECRET must be at least 32 characters when provider is mock'});
    }
  }
}).transform((env) => ({...env, SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV}));

export type AppEnv = z.output<typeof envSchema>;

/** Parse + validate the raw environment. Throws one readable Error listing every problem. */
export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => {
      const name = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `- ${name}: ${issue.message}`;
    });
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return parsed.data;
}
