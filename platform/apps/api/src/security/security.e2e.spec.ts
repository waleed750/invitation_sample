import {bootApp} from '../test-helpers';
import {parseTrustProxy} from './client-ip';

describe('API security hardening (e2e)', () => {
  it('sets strict headers and hides x-powered-by', async () => {
    const {app, http} = await bootApp();
    try {
      const res = await http.get('/v1/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['content-security-policy']).toBe("default-src 'none';frame-ancestors 'none'");
      expect(res.headers['strict-transport-security']).toContain('max-age=63072000');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['cross-origin-resource-policy']).toBe('same-site');
      expect(res.headers['x-frame-options']).toBe('DENY');
    } finally {
      await app.close();
    }
  });

  it('rejects bodies over the limit with 413 and honours BODY_LIMIT_KB', async () => {
    const {app, http} = await bootApp({BODY_LIMIT_KB: '1'});
    try {
      const big = await http.post('/v1/public/invitations/x/rsvp').send({pad: 'a'.repeat(2048)});
      expect(big.status).toBe(413);
      const small = await http.post('/v1/public/invitations/x/rsvp').send({pad: 'a'});
      expect(small.status).not.toBe(413);
    } finally {
      await app.close();
    }
  });

  it('allows CORS credentials only for listed origins', async () => {
    const {app, http} = await bootApp();
    try {
      const ok = await http.get('/v1/health').set('Origin', 'http://localhost:3000');
      expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(ok.headers['access-control-allow-credentials']).toBe('true');
      const bad = await http.get('/v1/health').set('Origin', 'https://evil.example');
      expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('returns the consistent 429 envelope with Retry-After', async () => {
    const {app, http} = await bootApp({THROTTLE_LIMIT: '1'});
    try {
      await http.get('/v1/me');
      const limited = await http.get('/v1/me');
      expect(limited.status).toBe(429);
      expect(limited.headers['retry-after']).toBeDefined();
      expect(limited.body).toEqual({error: {code: 'too_many_requests', message: expect.any(String), requestId: expect.any(String)}});
    } finally {
      await app.close();
    }
  });

  describe('throttle keying and TRUST_PROXY', () => {
    it('ignores X-Forwarded-For when no proxy is trusted (cannot be used to dodge limits)', async () => {
      const {app, http} = await bootApp({THROTTLE_LIMIT: '2', TRUST_PROXY: ''});
      try {
        await http.get('/v1/me').set('X-Forwarded-For', '1.1.1.1');
        await http.get('/v1/me').set('X-Forwarded-For', '2.2.2.2');
        const limited = await http.get('/v1/me').set('X-Forwarded-For', '3.3.3.3');
        expect(limited.status).toBe(429);
      } finally {
        await app.close();
      }
    });

    it('keys on the forwarded client IP when the proxy is trusted', async () => {
      const {app, http} = await bootApp({THROTTLE_LIMIT: '1', TRUST_PROXY: 'loopback'});
      try {
        expect((await http.get('/v1/me').set('X-Forwarded-For', '1.1.1.1')).status).toBe(401);
        expect((await http.get('/v1/me').set('X-Forwarded-For', '2.2.2.2')).status).toBe(401);
        expect((await http.get('/v1/me').set('X-Forwarded-For', '1.1.1.1')).status).toBe(429);
      } finally {
        await app.close();
      }
    });

    it('cloudflare mode keys on CF-Connecting-IP from a trusted peer', async () => {
      const {app, http} = await bootApp({THROTTLE_LIMIT: '1', TRUST_PROXY: 'cloudflare'});
      try {
        expect((await http.get('/v1/me').set('CF-Connecting-IP', '8.8.8.8')).status).toBe(401);
        expect((await http.get('/v1/me').set('CF-Connecting-IP', '9.9.9.9')).status).toBe(401);
        expect((await http.get('/v1/me').set('CF-Connecting-IP', '8.8.8.8')).status).toBe(429);
      } finally {
        await app.close();
      }
    });

    it('ignores CF-Connecting-IP outside cloudflare mode', async () => {
      const {app, http} = await bootApp({THROTTLE_LIMIT: '1', TRUST_PROXY: 'loopback'});
      try {
        await http.get('/v1/me').set('CF-Connecting-IP', '8.8.8.8');
        expect((await http.get('/v1/me').set('CF-Connecting-IP', '9.9.9.9')).status).toBe(429);
      } finally {
        await app.close();
      }
    });
  });

  describe('parseTrustProxy', () => {
    it('parses the supported forms', () => {
      expect(parseTrustProxy(undefined)).toEqual({setting: false, cloudflare: false});
      expect(parseTrustProxy('false').setting).toBe(false);
      expect(parseTrustProxy('1').setting).toBe(1);
      expect(parseTrustProxy('loopback, 10.0.0.0/8').setting).toEqual(['loopback', '10.0.0.0/8']);
      expect(parseTrustProxy('cloudflare').cloudflare).toBe(true);
    });
    it('rejects trust-everything and malformed values', () => {
      expect(() => parseTrustProxy('true')).toThrow();
      expect(() => parseTrustProxy('10.0.0.0/99')).toThrow();
      expect(() => parseTrustProxy('nonsense')).toThrow();
      expect(() => parseTrustProxy('loopback,cloudflare')).toThrow();
    });
  });
});
