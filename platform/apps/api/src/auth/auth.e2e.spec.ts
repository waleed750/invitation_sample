/* eslint-disable @typescript-eslint/no-explicit-any */
import type {INestApplication} from '@nestjs/common';
import {bootApp, type HttpClient} from '../test-helpers';
import * as betterAuthMod from './better-auth';

describe('auth guard (e2e, full app)', () => {
  let app: INestApplication;
  let http: HttpClient;

  beforeAll(async () => {
    ({app, http} = await bootApp());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lets @Public() routes through: GET /v1/health → 200', async () => {
    const res = await http.get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true, version: expect.any(String), uptimeSeconds: expect.any(Number)});
  });

  it('rejects a missing token with the 401 envelope', async () => {
    // If no header is provided, it might throw 401 before checking Better Auth? 
    // Actually our guard reads Better Auth which handles missing headers by returning null.
    const res = await http.get('/v1/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({error: {code: 'unauthorized', message: expect.any(String), requestId: expect.any(String)}});
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });

  it('rejects an invalid token with 401', async () => {
    // Better Auth will return null for invalid tokens
    jest.spyOn(betterAuthMod, 'getBetterAuth').mockReturnValue({
      api: {
        getSession: jest.fn().mockResolvedValue(null)
      }
    } as any);
    const res = await http.get('/v1/me').set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('lets a valid token through the guard', async () => {
    // mock a successful session
    jest.spyOn(betterAuthMod, 'getBetterAuth').mockReturnValue({
      api: {
        getSession: jest.fn().mockResolvedValue({
          session: { token: 'good-token' },
          user: { id: 'user-123', email: 'test@example.com' }
        })
      }
    } as any);

    const res = await http.get('/v1/me').set('Authorization', `Bearer good-token`);
    // since db is unroutable, hitting /v1/me might result in 500 or 503 from the endpoint itself trying to do a query
    // just checking it is not 401 or 403
    expect(res.status).not.toBe(401);
  });
});
