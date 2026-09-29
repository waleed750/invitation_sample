import {bootApp, signTestToken} from '../test-helpers';

describe('rate limiting (e2e)', () => {
  it('applies the stricter @Throttle example on the public ping route: 429 after 5/min', async () => {
    const {app, http} = await bootApp();
    try {
      for (let i = 0; i < 5; i += 1) {
        const res = await http.get('/v1/health/ping');
        expect(res.status).toBe(200);
      }
      const limited = await http.get('/v1/health/ping');
      expect(limited.status).toBe(429);
      expect(limited.body).toEqual({
        error: {code: 'too_many_requests', message: expect.any(String), requestId: expect.any(String)}
      });
    } finally {
      await app.close();
    }
  });

  it('does not throttle the health probe itself', async () => {
    const {app, http} = await bootApp();
    try {
      for (let i = 0; i < 8; i += 1) {
        const res = await http.get('/v1/health');
        expect(res.status).toBe(200);
      }
    } finally {
      await app.close();
    }
  });

  it('returns 429 after the configured global limit (throttler runs before auth)', async () => {
    const {app, http} = await bootApp({THROTTLE_LIMIT: '3'});
    try {
      // Unauthenticated 401s still count: the guard runs before AuthGuard.
      for (let i = 0; i < 3; i += 1) {
        const res = await http.get('/v1/me');
        expect(res.status).toBe(401);
      }
      const limited = await http.get('/v1/me');
      expect(limited.status).toBe(429);
      expect(limited.body.error.code).toBe('too_many_requests');
    } finally {
      await app.close();
    }
  });

  it('counts authenticated traffic against the global limit too', async () => {
    const {app, http} = await bootApp({THROTTLE_LIMIT: '2'}, {data: null, error: {code: 'XX000'}});
    try {
      const token = await signTestToken({subject: 'user-9'});
      for (let i = 0; i < 2; i += 1) {
        const res = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(503); // guard passed; upstream unreachable in tests
      }
      const limited = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
      expect(limited.status).toBe(429);
    } finally {
      await app.close();
    }
  });
});
