import {z} from 'zod';

// Environment contract for the API. Everything is validated once at boot via
// `validateEnv` (wired into `ConfigModule.forRoot({ validate })`) so the
// process fails fast with a readable list instead of crashing mid-request.
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
  // Optional: blank/whitespace counts as unset. When set, Supabase JWTs are
  // verified locally (HS256); otherwise the project's JWKS endpoint is used.
  SUPABASE_JWT_SECRET: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value.trim() === '' ? undefined : value)),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  SWAGGER_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true')
});

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
