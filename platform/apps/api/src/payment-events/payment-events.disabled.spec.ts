import {bootApp, type HttpClient} from '../test-helpers';
import type {INestApplication} from '@nestjs/common';

describe('payment-events webhook switch (PAYMENT_EVENTS_ENABLED)', () => {
  let app: INestApplication;
  let http: HttpClient;

  afterEach(async () => {
    await app.close();
  });

  it('answers 404 while disabled, whatever is sent', async () => {
    ({app, http} = await bootApp({PAYMENT_EVENTS_ENABLED: 'false', PAYMENT_EVENTS_SECRET: 'x'.repeat(40)}));
    for (const provider of ['generic-hmac', 'easyconfirm']) {
      const res = await http.post(`/v1/payment-events/${provider}`).set('content-type', 'application/json').send('{"any":"thing"}');
      expect(res.status).toBe(404);
    }
  });

  it('defaults to disabled', async () => {
    ({app, http} = await bootApp({PAYMENT_EVENTS_ENABLED: ''}));
    const res = await http.post('/v1/payment-events/generic-hmac').send({});
    expect(res.status).toBe(404);
  });

  it('is reachable (and rejects an unsigned call) when enabled', async () => {
    ({app, http} = await bootApp({PAYMENT_EVENTS_ENABLED: 'true', PAYMENT_EVENTS_SECRET: 'x'.repeat(40)}));
    const res = await http.post('/v1/payment-events/generic-hmac').set('content-type', 'application/json').send('{}');
    expect(res.status).toBe(401);
  });
});
