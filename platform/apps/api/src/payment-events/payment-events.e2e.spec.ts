import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {ConfigService} from '@nestjs/config';
import {createHmac} from 'node:crypto';
import request from 'supertest';
import {AppModule} from '../app.module';
import {AuthRepository} from '../auth/auth.repository';
import {AppConfigService} from '../config/app-config.service';
import {validateEnv} from '../config/env.schema';
import {setupApp} from '../setup-app';
import {setTestEnv, signTestToken, type HttpClient} from '../test-helpers';
import {PaymentEventsRepository} from './payment-events.repository';

const ID = '16000000-0000-4000-8000-000000000001';
const SECRET = 'payment-events-e2e-secret-long-enough';
describe('payment events (e2e full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let role = 'customer';
  const repository = {ingestAsServiceRole: jest.fn(), listAsServiceRole: jest.fn(), assignAsServiceRole: jest.fn()};
  beforeAll(async () => {
    setTestEnv({PAYMENT_EVENTS_SECRET: SECRET});
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(AppConfigService).useValue(new AppConfigService(new ConfigService(validateEnv(process.env))))
      .overrideProvider(AuthRepository).useValue({findRoleByUserId: () => Promise.resolve({data: {role}, error: null})})
      .overrideProvider(PaymentEventsRepository).useValue(repository).compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app); await app.init(); http = request(app.getHttpServer());
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => {
    role = 'customer';
    repository.ingestAsServiceRole.mockReset().mockResolvedValue({ok: true});
    repository.listAsServiceRole.mockReset().mockResolvedValue([]);
    repository.assignAsServiceRole.mockReset().mockResolvedValue({ok: true});
  });
  it('captures raw bytes and responds 200 for valid and duplicate notifications', async () => {
    const body = JSON.stringify({id: 'external', amount: '1299.37', currency: 'EGP', received_at: new Date().toISOString()}, null, 2);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex');
    const send = () => http.post('/v1/payment-events/generic-hmac').set({'content-type': 'application/json', 'x-signature': signature, 'x-timestamp': timestamp}).send(body);
    expect((await send()).status).toBe(200);
    expect(repository.ingestAsServiceRole).toHaveBeenCalledWith('generic-hmac', expect.objectContaining({amountMinor: 129937}), body);
    repository.ingestAsServiceRole.mockResolvedValue({ok: true, duplicate: true});
    const duplicate = await send(); expect(duplicate.status).toBe(200); expect(duplicate.body).toEqual({ok: true, duplicate: true});
  });
  it('answers generic 401 without signature details', async () => {
    const result = await http.post('/v1/payment-events/generic-hmac').send({});
    expect(result.status).toBe(401); expect(result.body.error.message).toBe('Invalid payment notification');
    expect(repository.ingestAsServiceRole).not.toHaveBeenCalled();
  });
  it('answers 401 without authentication on admin routes', async () => {
    expect((await http.get('/v1/admin/payment-events')).status).toBe(401);
  });
  it('answers 403 for non-admin on both queue routes', async () => {
    const auth = {Authorization: `Bearer ${await signTestToken({subject: ID})}`};
    expect((await http.get('/v1/admin/payment-events').set(auth)).status).toBe(403);
    expect((await http.post(`/v1/admin/payment-events/${ID}/assign`).set(auth).send({orderId: ID, note: 'review'})).status).toBe(403);
    expect(repository.assignAsServiceRole).not.toHaveBeenCalled(); expect(repository.listAsServiceRole).not.toHaveBeenCalled();
  });
  it('lets admins list and assign with their identity', async () => {
    role = 'admin'; const auth = {Authorization: `Bearer ${await signTestToken({subject: ID})}`};
    expect((await http.get('/v1/admin/payment-events?status=ambiguous&limit=25').set(auth)).status).toBe(200);
    expect(repository.listAsServiceRole).toHaveBeenCalledWith('ambiguous', 25);
    expect((await http.post(`/v1/admin/payment-events/${ID}/assign`).set(auth).send({orderId: ID, note: 'review'})).status).toBe(200);
    expect(repository.assignAsServiceRole).toHaveBeenCalledWith(ID, ID, ID, 'review');
  });
  it('validates DTOs and maps SQL refusal reasons', async () => {
    role = 'admin'; const auth = {Authorization: `Bearer ${await signTestToken({subject: ID})}`};
    expect((await http.get('/v1/admin/payment-events?limit=101').set(auth)).status).toBe(400);
    expect((await http.post(`/v1/admin/payment-events/${ID}/assign`).set(auth).send({orderId: ID, note: ''})).status).toBe(400);
    for (const [reason, status] of [['amount_mismatch', 409], ['not_pending', 409], ['not_found', 404]] as const) {
      repository.assignAsServiceRole.mockResolvedValue({ok: false, reason});
      expect((await http.post(`/v1/admin/payment-events/${ID}/assign`).set(auth).send({orderId: ID, note: 'review'})).status).toBe(status);
    }
  });
});
