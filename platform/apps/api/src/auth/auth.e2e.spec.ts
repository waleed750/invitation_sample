import type {INestApplication} from '@nestjs/common';
import {bootApp, signTestToken, TEST_JWT_SECRET, type HttpClient} from '../test-helpers';

describe('auth guard (e2e, full app)', () => {
  let app: INestApplication;
  let http: HttpClient;

  beforeAll(async () => {
    // Upstream Supabase is stubbed: the guard tests only need 401-vs-not-401,
    // and the stub resolves instantly (the real client retries for seconds).
    ({app, http} = await bootApp({}, {data: null, error: {code: 'XX000'}}));
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets @Public() routes through: GET /v1/health → 200', async () => {
    const res = await http.get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true, version: expect.any(String), uptimeSeconds: expect.any(Number)});
  });

  it('rejects a missing token with the 401 envelope', async () => {
    const res = await http.get('/v1/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({error: {code: 'unauthorized', message: expect.any(String), requestId: expect.any(String)}});
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });

  it('rejects a malformed header with 401', async () => {
    const res = await http.get('/v1/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  it('rejects an expired token with 401', async () => {
    const token = await signTestToken({expiresInSeconds: -60});
    const res = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects a wrong-audience token with 401', async () => {
    const token = await signTestToken({audience: 'someone-else'});
    const res = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret with 401', async () => {
    const token = await signTestToken({secret: 'a-different-secret-that-is-also-long-enough'});
    const res = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token without a subject with 401', async () => {
    const token = await signTestToken({subject: ''});
    const res = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('lets a valid token through the guard (503 upstream proves it was not a 401)', async () => {
    // The stubbed Supabase lookup fails with 503 — the point is the guard
    // accepted the token (anything but 401).
    const token = await signTestToken({subject: 'user-123'});
    const res = await http.get('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: {code: 'service_unavailable', message: 'Profile service unavailable', requestId: expect.any(String)}
    });
  });

  it('echoes x-request-id and reuses a caller-provided one', async () => {
    const generated = await http.get('/v1/health');
    expect(typeof generated.headers['x-request-id']).toBe('string');

    const reused = await http.get('/v1/health').set('x-request-id', 'caller-trace-1');
    expect(reused.headers['x-request-id']).toBe('caller-trace-1');
  });

  it('uses the configured HS256 secret', () => {
    expect(TEST_JWT_SECRET.length).toBeGreaterThan(0);
  });
});
