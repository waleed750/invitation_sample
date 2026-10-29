/* global __ENV */
/**
 * Shared configuration + helpers for the k6 scripts in `platform/loadtest`.
 *
 * k6 runs these files with its own JavaScript engine (goja), *not* with Node
 * and not through npm — that is why this folder has no package.json and no
 * dependencies. `import` paths are relative files, exactly as k6 expects.
 *
 * Every value below comes from the environment so the same script runs against
 * a laptop stack, the e2e stack (scripts/e2e-serve.sh) or a staging box:
 *
 *   API_URL               default http://localhost:3001
 *   WEB_URL               default http://localhost:3000
 *   SLUG                  invitation slug under test (seed: demo-nour-omar)
 *   LOCALE                ar | en (default ar)
 *   LOADTEST_SPREAD_IPS   1 = send a unique X-Forwarded-For per request
 *                         (needs the API started with TRUST_PROXY=loopback)
 */

const TRUTHY = ['1', 'true', 'yes', 'on'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `true` for "1", "true", "yes", "on" (case-insensitive). */
export function truthy(value) {
  return typeof value === 'string' && TRUTHY.indexOf(value.trim().toLowerCase()) !== -1;
}

/** A positive finite number from the environment, otherwise `fallback`. */
export function positiveNumber(raw, fallback) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** A number from the environment that may be 0, otherwise `fallback`. */
export function nonNegativeNumber(raw, fallback) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function withoutTrailingSlash(value) {
  return String(value).trim().replace(/\/+$/, '');
}

export const env = {
  apiUrl: withoutTrailingSlash(__ENV.API_URL || 'http://localhost:3001'),
  webUrl: withoutTrailingSlash(__ENV.WEB_URL || 'http://localhost:3000'),
  slug: (__ENV.SLUG || 'demo-nour-omar').trim(),
  locale: (__ENV.LOCALE || 'ar').trim() === 'en' ? 'en' : 'ar',
  /** When true every request carries its own client IP, so the per-IP limiter does not swallow the load. */
  spreadIps: truthy(__ENV.LOADTEST_SPREAD_IPS),
  /** Extra one-line logging on unexpected answers. */
  debug: truthy(__ENV.LOADTEST_DEBUG)
};

if (!SLUG_PATTERN.test(env.slug)) {
  throw new Error(`SLUG must look like "demo-nour-omar" (got "${env.slug}")`);
}

/** Absolute API URL for a path such as `/v1/public/invitations/x`. */
export function apiPath(path) {
  return `${env.apiUrl}${path}`;
}

/** Absolute web URL for a path such as `/ar/i/x`. */
export function webPath(path) {
  return `${env.webUrl}${path}`;
}

/** `GET /v1/public/invitations/:slug` */
export function invitationApiPath() {
  return `/v1/public/invitations/${env.slug}`;
}

/** `POST /v1/public/invitations/:slug/rsvp` */
export function rsvpApiPath() {
  return `${invitationApiPath()}/rsvp`;
}

/** The public invitation page, `/{locale}/i/{slug}`. */
export function invitationWebPath() {
  return `/${env.locale}/i/${env.slug}`;
}

/**
 * A synthetic client address, unique per (vu, iteration): `10.<vu>.<hi>.<lo>`.
 * Only meaningful when the API trusts the loopback hop (TRUST_PROXY=loopback),
 * because Express then reads the last untrusted X-Forwarded-For entry.
 *
 * 250 × 65536 distinct values are enough for the runs in this folder; a repeat
 * only ever means "one extra request from that IP", which the 5/min bucket on
 * the RSVP route tolerates.
 */
export function syntheticIp(vu, iteration) {
  const block = (Math.abs(Number(vu) || 0) % 250) + 1;
  const host = Math.abs(Number(iteration) || 0) % 65536;
  return `10.${block}.${(host >> 8) & 255}.${host & 255}`;
}

/**
 * JSON request headers. Adds the per-request X-Forwarded-For when custom IPs
 * are on, and any extra headers the caller needs (Authorization, Cookie, ...).
 */
export function jsonHeaders(vu, iteration, extra) {
  const headers = {'Content-Type': 'application/json', Accept: 'application/json'};
  for (const key in extra || {}) headers[key] = extra[key];
  if (env.spreadIps) headers['X-Forwarded-For'] = syntheticIp(vu, iteration);
  return headers;
}

/** Browser-like headers for the Next.js page (no cookies, no assets). */
export function browserHeaders(vu, iteration) {
  const headers = {
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': env.locale === 'en' ? 'en-GB,en;q=0.9' : 'ar-EG,ar;q=0.9',
    'Cache-Control': 'no-cache'
  };
  if (env.spreadIps) headers['X-Forwarded-For'] = syntheticIp(vu, iteration);
  return headers;
}

/** Random integer in `[min, max]` (both included). */
export function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** One element of a non-empty array. */
export function randomFrom(list) {
  return list[randomInt(0, list.length - 1)];
}

function zeroPad(value, length) {
  let text = String(value);
  while (text.length < length) text = `0${text}`;
  return text.slice(-length);
}

/**
 * A valid Egyptian mobile in the `+20…` form every guest form accepts
 * (`normalizeEgyptPhone` → `01[0125]` + 8 digits).
 */
export function egyptianPhone(vu, iteration) {
  const prefix = randomFrom(['010', '011', '012', '015']);
  const tail = (Math.abs(Number(vu) || 0) * 100003 + (Number(iteration) || 0) * 7919) % 100000000;
  return `${prefix}${zeroPad(tail, 8)}`;
}

const FIRST_NAMES = ['نور', 'عمر', 'سلمى', 'كريم', 'هدى', 'طارق', 'ليلى', 'يوسف', 'دينا', 'أحمد', 'منى', 'عادل'];
const LAST_NAMES = ['حسن', 'محمود', 'سعيد', 'فؤاد', 'الشريف', 'عبد الله', 'فهمي'];

/** A guest name (≤80 chars) that is varied but stays readable in the guest list. */
export function guestName(vu, iteration) {
  const index = (Math.abs(Number(vu) || 0) * 31 + (Number(iteration) || 0)) % FIRST_NAMES.length;
  return `${FIRST_NAMES[index]} ${randomFrom(LAST_NAMES)}`;
}

/**
 * An ISO-8601 datetime with an explicit offset, in the exact shape the web
 * checkout sends (`2027-03-20T12:00:00+02:00`). Noon avoids a date that flips
 * to the previous day in the guest's timezone.
 */
export function isoEventDate(daysAhead) {
  const moment = new Date(Date.now() + daysAhead * 86400000);
  const day = `${moment.getUTCFullYear()}-${zeroPad(moment.getUTCMonth() + 1, 2)}-${zeroPad(moment.getUTCDate(), 2)}`;
  return `${day}T12:00:00+02:00`;
}

/** Random lowercase hex — used for idempotency keys and test emails. */
export function randomHex(length) {
  let text = '';
  while (text.length < length) text += zeroPad(Math.floor(Math.random() * 0xffffffff).toString(16), 8);
  return text.slice(0, length);
}

/**
 * Prints the run configuration before any load is generated and shouts when
 * the one-client-IP mode is on (every 429 you then see is the limiter, not a bug).
 */
export function banner(title, rows) {
  console.log(`\n=== ${title} ===`);
  for (const key in rows) console.log(`  ${key}: ${rows[key]}`);
  if (!env.spreadIps) {
    console.warn(
      '  LOADTEST_SPREAD_IPS is off: every request looks like one client IP, so per-IP throttles ' +
        '(RSVP 5/min, checkout 10/min, public read 60/min) will answer 429. Use it only to verify the limiter.'
    );
  } else {
    console.log('  Client IPs: one synthetic X-Forwarded-For per request (API must run with TRUST_PROXY=loopback)');
  }
  console.log('');
}

/** `{error: {code}}` from an API error envelope, or null. Never throws. */
export function errorCode(response) {
  try {
    const body = response.json();
    if (body && body.error && typeof body.error.code === 'string') return body.error.code;
    return null;
  } catch {
    return null;
  }
}

/** One-line debug dump for an unexpected answer. */
export function logUnexpected(label, response) {
  if (!env.debug) return;
  const code = errorCode(response);
  console.error(`${label}: status=${response.status}${code ? ` code=${code}` : ''} body=${String(response.body).slice(0, 200)}`);
}
