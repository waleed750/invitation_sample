import type {INestApplication} from '@nestjs/common';
import {bootApp, signTestToken, type HttpClient} from './test-helpers';

describe('app wiring (e2e)', () => {
  describe('with SWAGGER_ENABLED=true', () => {
    let app: INestApplication;
    let http: HttpClient;

    beforeAll(async () => {
      ({app, http} = await bootApp({SWAGGER_ENABLED: 'true'}));
    });

    afterAll(async () => {
      await app.close();
    });

    it('serves OpenAPI at /docs (unprefixed)', async () => {
      const res = await http.get('/docs');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });

    it('serves the OpenAPI JSON at /docs-json (unprefixed)', async () => {
      const res = await http.get('/docs-json');
      expect(res.status).toBe(200);
      expect((res.body as {openapi: string}).openapi).toMatch(/^3\./);
    });
  });

  describe('with SWAGGER_ENABLED=false', () => {
    let app: INestApplication;
    let http: HttpClient;

    beforeAll(async () => {
      ({app, http} = await bootApp({SWAGGER_ENABLED: 'false'}));
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 404 for /docs', async () => {
      const res = await http.get('/docs');
      expect(res.status).toBe(404);
    });
  });

  describe('routes', () => {
    let app: INestApplication;
    let http: HttpClient;

    beforeAll(async () => {
      ({app, http} = await bootApp({}, {data: null, error: {code: 'XX000'}}));
    });

    afterAll(async () => {
      await app.close();
    });

    it('validates :id as a UUID with Zod → 400 envelope', async () => {
      const token = await signTestToken({subject: 'user-123'});
      const res = await http.get('/v1/invitations/not-a-uuid/entitlement').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: {code: 'bad_request', message: expect.any(String), requestId: expect.any(String)}
      });
    });

    it('passes a valid UUID + token through to the service (503 upstream, not 401)', async () => {
      const token = await signTestToken({subject: 'user-123'});
      const res = await http
        .get('/v1/invitations/11111111-1111-4111-8111-111111111111/entitlement')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('service_unavailable');
    });
  });
});
