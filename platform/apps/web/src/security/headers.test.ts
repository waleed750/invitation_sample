import {describe, expect, it} from 'vitest';
// Same matcher Next.js uses for `headers()` sources.
import {pathToRegexp} from 'next/dist/compiled/path-to-regexp';
import nextConfig from '../../next.config';
import robots from '../app/robots';
import {buildCsp} from './headers';

async function headersFor(path: string): Promise<Record<string, string>> {
  const rules = await nextConfig.headers!();
  const out: Record<string, string> = {};
  for (const rule of rules) {
    if (pathToRegexp(rule.source).test(path)) {
      for (const {key, value} of rule.headers) out[key] = value;
    }
  }
  return out;
}

describe('next.config security headers', () => {
  it('disables x-powered-by', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it.each(['/', '/en', '/ar/pricing', '/en/i/nour-omar', '/ar/preview/riwaq', '/en/app/points'])(
    'sends the baseline headers on %s',
    async (path) => {
      const h = await headersFor(path);
      expect(h['Strict-Transport-Security']).toContain('max-age=63072000');
      expect(h['X-Content-Type-Options']).toBe('nosniff');
      expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(h['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    }
  );

  it.each(['/', '/ar', '/en/pricing', '/ar/i/nour-omar', '/en/checkout/pay/abc', '/ar/app'])(
    'forbids framing and reports CSP on %s',
    async (path) => {
      const h = await headersFor(path);
      expect(h['X-Frame-Options']).toBe('DENY');
      expect(h['Content-Security-Policy-Report-Only']).toContain("frame-ancestors 'none'");
      expect(h['Content-Security-Policy']).toBeUndefined();
    }
  );

  it.each(['/ar/preview/riwaq', '/en/preview/x/y', '/ar/demo/video-open'])('allows same-origin framing on %s', async (path) => {
    const h = await headersFor(path);
    expect(h['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(h['Content-Security-Policy-Report-Only']).toContain("frame-ancestors 'self'");
  });

  it.each(['/ar/i/nour-omar', '/en/i/a/b', '/ar/app', '/en/app/points', '/en/admin/x', '/ar/checkout/pay/1', '/ar/sign-in'])(
    'marks %s noindex',
    async (path) => {
      expect((await headersFor(path))['X-Robots-Tag']).toBe('noindex, nofollow');
    }
  );

  it.each(['/', '/en', '/ar/pricing', '/en/templates', '/ar/preview/riwaq'])('keeps %s indexable', async (path) => {
    expect((await headersFor(path))['X-Robots-Tag']).toBeUndefined();
  });
});

describe('buildCsp', () => {
  it('has no wildcard source and no unsafe-eval in production', () => {
    const csp = buildCsp({NODE_ENV: 'production', API_BASE_URL: 'https://api.example.com/x', NEXT_PUBLIC_SUPABASE_URL: 'https://p.supabase.co'}, false);
    expect(csp).not.toMatch(/(^|[\s;])\*([\s;]|$)/);
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("connect-src 'self' https://api.example.com https://p.supabase.co wss://p.supabase.co");
    expect(csp).toContain("object-src 'none'");
  });
  it('allows unsafe-eval only outside production', () => {
    expect(buildCsp({NODE_ENV: 'development'}, false)).toContain("'unsafe-eval'");
  });
});

describe('robots', () => {
  it('disallows private areas and keeps marketing open', () => {
    const rule = (robots().rules as {userAgent: string; allow: string; disallow: string[]}[])[0]!;
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toEqual(expect.arrayContaining(['/*/i/', '/*/app', '/*/admin', '/*/checkout', '/api/']));
  });
});
