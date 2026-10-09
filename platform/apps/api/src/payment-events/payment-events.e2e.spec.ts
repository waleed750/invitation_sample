import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {ConfigService} from '@nestjs/config';
import {createHmac} from 'node:crypto';
import {IncomingMessage, ServerResponse, type IncomingHttpHeaders} from 'node:http';
import {Socket} from 'node:net';
import {Duplex} from 'node:stream';
import type {Express} from 'express';
import {AppModule} from '../app.module';
import {AuthRepository} from '../auth/auth.repository';
import {AppConfigService} from '../config/app-config.service';
import {validateEnv} from '../config/env.schema';
import {setupApp} from '../setup-app';
import {setTestEnv, signTestToken} from '../test-helpers';
import {PaymentEventsRepository} from './payment-events.repository';

interface HttpResult {status: number; body: unknown}

/** Real HTTP request/response streams through Express, without binding a port.
 * Runs the same body parser, Nest routes, global guards, pipes and filter as
 * production. Only the socket transport is replaced; no route/guard is mocked.
 */
function inject(app: INestApplication, method: string, url: string, body = '', headers: IncomingHttpHeaders = {}): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const input = new Socket();
    const request = new IncomingMessage(input);
    request.method = method;
    request.url = url;
    request.headers = {host: 'localhost', 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)), ...headers};
    const chunks: Buffer[] = [];
    const output = new Duplex({
      read() { /* Incoming payload is pushed below; no network to read. */ },
      write(chunk: Buffer, _encoding, done) { chunks.push(Buffer.from(chunk)); done(); }
    });
    const response = new ServerResponse(request);
    response.assignSocket(output as unknown as Socket);
    response.on('error', reject);
    response.on('finish', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const text = raw.slice(raw.indexOf('\r\n\r\n') + 4);
        const parsed: unknown = text === '' ? null : JSON.parse(text);
        resolve({status: response.statusCode, body: parsed});
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        response.detachSocket(output as unknown as Socket);
        output.destroy();
        input.destroy();
      }
    });
    const handler: Express = app.getHttpAdapter().getInstance();
    handler(request, response);
    if (body !== '') request.push(Buffer.from(body));
    request.push(null);
  });
}

const ID = '16000000-0000-4000-8000-000000000001';
const SECRET = 'payment-events-e2e-secret-long-enough';
describe('payment events (full app HTTP integration, in-memory transport)', () => {
  let app: INestApplication;
  let role = 'customer';
  const repository = {ingestAsServiceRole: jest.fn(), listAsServiceRole: jest.fn(), assignAsServiceRole: jest.fn()};
  const get = (url: string, headers: IncomingHttpHeaders = {}) => inject(app, 'GET', url, '', headers);
  const post = (url: string, body: unknown, headers: IncomingHttpHeaders = {}) => inject(app, 'POST', url, JSON.stringify(body), headers);
  beforeAll(async () => {
    setTestEnv({PAYMENT_EVENTS_SECRET: SECRET});
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(AppConfigService).useValue(new AppConfigService(new ConfigService(validateEnv(process.env))))
      .overrideProvider(AuthRepository).useValue({findRoleByUserId: () => Promise.resolve({data: {role}, error: null})})
      .overrideProvider(PaymentEventsRepository).useValue(repository).compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app); await app.init();
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
    const send = () => inject(app, 'POST', '/v1/payment-events/generic-hmac', body, {'x-signature': signature, 'x-timestamp': timestamp});
    expect((await send()).status).toBe(200);
    expect(repository.ingestAsServiceRole).toHaveBeenCalledWith('generic-hmac', expect.objectContaining({amountMinor: 129937}), body);
    repository.ingestAsServiceRole.mockResolvedValue({ok: true, duplicate: true});
    const duplicate = await send(); expect(duplicate.status).toBe(200); expect(duplicate.body).toEqual({ok: true, duplicate: true});
  });
  it('answers generic 401 without signature details', async () => {
    const result = await post('/v1/payment-events/generic-hmac', {});
    expect(result.status).toBe(401); expect(result.body).toMatchObject({error: {message: 'Invalid payment notification'}});
    expect(repository.ingestAsServiceRole).not.toHaveBeenCalled();
  });
  it('answers 401 without authentication on admin routes', async () => {
    expect((await get('/v1/admin/payment-events')).status).toBe(401);
  });
  it('answers 403 for non-admin on both queue routes', async () => {
    const auth = {authorization: `Bearer ${await signTestToken({subject: ID})}`};
    expect((await get('/v1/admin/payment-events', auth)).status).toBe(403);
    expect((await post(`/v1/admin/payment-events/${ID}/assign`, {orderId: ID, note: 'review'}, auth)).status).toBe(403);
    expect(repository.assignAsServiceRole).not.toHaveBeenCalled(); expect(repository.listAsServiceRole).not.toHaveBeenCalled();
  });
  it('lets admins list and assign with their identity', async () => {
    role = 'admin'; const auth = {authorization: `Bearer ${await signTestToken({subject: ID})}`};
    expect((await get('/v1/admin/payment-events?status=ambiguous&limit=25', auth)).status).toBe(200);
    expect(repository.listAsServiceRole).toHaveBeenCalledWith('ambiguous', 25);
    expect((await post(`/v1/admin/payment-events/${ID}/assign`, {orderId: ID, note: 'review'}, auth)).status).toBe(200);
    expect(repository.assignAsServiceRole).toHaveBeenCalledWith(ID, ID, ID, 'review');
  });
  it('validates DTOs and maps SQL refusal reasons', async () => {
    role = 'admin'; const auth = {authorization: `Bearer ${await signTestToken({subject: ID})}`};
    expect((await get('/v1/admin/payment-events?limit=101', auth)).status).toBe(400);
    expect((await post(`/v1/admin/payment-events/${ID}/assign`, {orderId: ID, note: ''}, auth)).status).toBe(400);
    for (const [reason, status] of [['amount_mismatch', 409], ['not_pending', 409], ['not_found', 404]] as const) {
      repository.assignAsServiceRole.mockResolvedValue({ok: false, reason});
      expect((await post(`/v1/admin/payment-events/${ID}/assign`, {orderId: ID, note: 'review'}, auth)).status).toBe(status);
    }
  });
});
