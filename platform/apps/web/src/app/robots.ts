import type {MetadataRoute} from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * Private, per-guest and transactional areas are kept out of search indexes
 * (also enforced with `X-Robots-Tag` in next.config). Marketing pages stay open.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/i/', '/*/app', '/*/admin', '/*/checkout', '/*/pick-preview', '/*/sign-in', '/api/']
      }
    ],
    host: SITE_URL
  };
}
