/**
 * Security response headers for the Next.js app (consumed by `next.config.ts`).
 * Kept in a plain module so it can be unit-tested without booting Next.
 */

export interface HeaderRule {
  source: string;
  headers: {key: string; value: string}[];
}

/** Pages designed to be framed by our own site (landing-page phone/preview widgets). */
export const EMBEDDABLE_SOURCE = '/:locale(ar|en)/(preview|demo|pick-preview)/:path*';
/** Everything except the embeddable pages (negative lookahead keeps the two rule sets disjoint). */
const NON_EMBEDDABLE_SOURCE = '/((?!(?:ar|en)/(?:preview|demo|pick-preview)(?:/|$)).*)';

function origin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export interface CspEnv {
  API_BASE_URL?: string | undefined;
  NEXT_PUBLIC_API_URL?: string | undefined;
  NODE_ENV?: string | undefined;
}

/**
 * Content-Security-Policy, shipped as Report-Only first.
 *
 * - script-src: Next.js injects inline bootstrap/flight scripts and we do not
 *   run a nonce middleware yet, hence 'unsafe-inline' (dev adds 'unsafe-eval'
 *   for React refresh). Tighten with nonces before enforcing.
 * - style-src: React `style=` attributes and next/font inline rules.
 * - font-src: next-font-google self-hosts the files at build time.
 * - img/media-src: invitation content (gallery, music, video) comes from
 *   https URLs chosen by the customer, so `https:` is the
 *   narrowest scheme that works; no `*` and no plain http.
 * - connect-src: the API.
 * - frame-src: the venue map iframe embeds Google Maps.
 */
export function buildCsp(env: CspEnv, embeddable: boolean): string {
  const connect = ["'self'"];
  const apiOrigin = origin(env.API_BASE_URL) || origin(env.NEXT_PUBLIC_API_URL);
  if (apiOrigin) connect.push(apiOrigin);
  const scripts = ["'self'", "'unsafe-inline'"];
  if (env.NODE_ENV !== 'production') scripts.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    `script-src ${scripts.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src ${connect.join(' ')}`,
    'frame-src https://www.google.com https://maps.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${embeddable ? "'self'" : "'none'"}`
  ].join('; ');
}

const NOINDEX = {key: 'X-Robots-Tag', value: 'noindex, nofollow'};
export const NOINDEX_SOURCES = [
  '/:locale(ar|en)/i/:path*',
  '/:locale(ar|en)/app/:path*',
  '/:locale(ar|en)/admin/:path*',
  '/:locale(ar|en)/checkout/:path*',
  '/:locale(ar|en)/pick-preview/:path*',
  '/:locale(ar|en)/sign-in'
];

export function securityHeaders(env: CspEnv = process.env): HeaderRule[] {
  return [
    {
      source: '/:path*',
      headers: [
        {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains'},
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'}
      ]
    },
    {
      source: NON_EMBEDDABLE_SOURCE,
      headers: [
        {key: 'X-Frame-Options', value: 'DENY'},
        {key: 'Content-Security-Policy-Report-Only', value: buildCsp(env, false)}
      ]
    },
    {
      source: EMBEDDABLE_SOURCE,
      headers: [
        {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
        {key: 'Content-Security-Policy-Report-Only', value: buildCsp(env, true)}
      ]
    },
    ...NOINDEX_SOURCES.map((source) => ({source, headers: [NOINDEX]}))
  ];
}
