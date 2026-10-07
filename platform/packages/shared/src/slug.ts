/** Share-link slug rules. Mirrors the DB check on `invitations.slug` (0001_core.sql). */
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 60;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Paths and names the public site (or us) may need. Never assignable as a share slug. */
export const RESERVED_SLUGS: readonly string[] = [
  'admin', 'api', 'app', 'www', 'i', 'edit', 'ar', 'en', 'login', 'logout', 'signup', 'signin', 'register',
  'pricing', 'templates', 'template', 'checkout', 'support', 'help', 'about', 'terms', 'privacy', 'contact',
  'dashboard', 'account', 'settings', 'static', 'assets', 'public', 'docs', 'blog', 'health', 'status',
  'auth', 'webhooks', 'v1', 'invitation', 'invitations', 'preview', 'demo', 'root', 'null', 'undefined'
];

const RESERVED = new Set(RESERVED_SLUGS);

/** Format only: lowercase a-z0-9 and single hyphens, 3-60 chars, no leading/trailing hyphen. */
export function isValidSlug(value: string): boolean {
  return value.length >= SLUG_MIN_LENGTH && value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value);
}

export function isReservedSlug(value: string): boolean {
  return RESERVED.has(value);
}

export type SlugProblem = 'invalid' | 'reserved';

/** `null` when the slug is well-formed and not reserved (it may still be taken). */
export function slugProblem(value: string): SlugProblem | null {
  if (!isValidSlug(value)) return 'invalid';
  return isReservedSlug(value) ? 'reserved' : null;
}

/**
 * Alternative slugs to offer when `base` is unavailable, in preference order:
 * `<base>-<year>`, `<base>-2`, `<base>-<3 digits>`. Only valid, non-reserved ones.
 * `randomThreeDigits` is injected so callers/tests control randomness.
 */
export function slugCandidates(base: string, year: number, randomThreeDigits: () => number): string[] {
  const digits = (): string => String(randomThreeDigits()).padStart(3, '0').slice(-3);
  const raw = [`${base}-${String(year)}`, `${base}-2`, `${base}-${digits()}`, `${base}-${digits()}`, `${base}-3`];
  return [...new Set(raw)].filter((candidate) => slugProblem(candidate) === null);
}
