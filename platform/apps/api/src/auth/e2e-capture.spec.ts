import {LoginCodeCapture, mountLoginCodeCapture} from './e2e-capture';
import {bootApp, type HttpClient} from '../test-helpers';
import type {INestApplication} from '@nestjs/common';
import express from 'express';
import request from 'supertest';

describe('LoginCodeCapture', () => {
  it('keeps the latest code per address, case-insensitively, and still delivers', async () => {
    const delivered: string[] = [];
    const capture = new LoginCodeCapture();
    const deliver = capture.wrap((email, code) => {
      delivered.push(`${email}:${code}`);
      return Promise.resolve();
    });
    await deliver('A@Example.test', '111111');
    await deliver('a@example.test', '222222');
    expect(capture.latest('a@EXAMPLE.test')).toBe('222222');
    expect(capture.latest('nobody@example.test')).toBeUndefined();
    expect(delivered).toEqual(['A@Example.test:111111', 'a@example.test:222222']);
  });

  it('bounds memory by dropping the oldest address', () => {
    const capture = new LoginCodeCapture();
    for (let i = 0; i < 205; i += 1) capture.record(`u${String(i)}@example.test`, '000000');
    expect(capture.latest('u0@example.test')).toBeUndefined();
    expect(capture.latest('u204@example.test')).toBe('000000');
  });

  it('registers one GET route', () => {
    const get = jest.fn();
    mountLoginCodeCapture({get} as never, new LoginCodeCapture());
    expect(get).toHaveBeenCalledWith('/v1/__e2e/last-code', expect.any(Function));
  });
});

describe('mounted capture route', () => {
  it('returns the latest code for an address and 404 otherwise', async () => {
    const capture = new LoginCodeCapture();
    capture.record('a@example.test', '123456');
    const server = express();
    mountLoginCodeCapture(server, capture);
    const hit = await request(server).get('/v1/__e2e/last-code').query({email: 'A@example.test'});
    expect(hit.status).toBe(200);
    expect(hit.body).toEqual({code: '123456'});
    expect((await request(server).get('/v1/__e2e/last-code').query({email: 'b@example.test'})).status).toBe(404);
    expect((await request(server).get('/v1/__e2e/last-code')).status).toBe(404);
  });
});

describe('capture route is not mounted by default', () => {
  let app: INestApplication;
  let http: HttpClient;
  beforeAll(async () => {
    ({app, http} = await bootApp());
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/__e2e/last-code is unauthenticated 404/401, never a code', async () => {
    const res = await http.get('/v1/__e2e/last-code?email=a@example.test');
    expect([401, 404]).toContain(res.status);
    expect(JSON.stringify(res.body)).not.toMatch(/"code":"\d{6}"/);
  });
});
