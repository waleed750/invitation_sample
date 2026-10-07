import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {setupApp} from '../setup-app';
import {SupabaseService} from '../supabase/supabase.service';
import {setTestEnv, signTestToken, type HttpClient} from '../test-helpers';

const ORDER = '33333333-3333-4333-8333-333333333333';

describe('admin payments (e2e on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let role = 'customer';
  let rpc: jest.Mock;

  beforeAll(async () => {
    setTestEnv();
    rpc = jest.fn();
    const admin = {
      rpc,
      from: () => ({select: () => ({eq: () => ({eq: () => ({order: () => Promise.resolve({data: [], error: null})})})})})
    };
    const forUser = () => ({from: () => ({select: () => ({eq: () => ({single: () => Promise.resolve({data: {role}, error: null})})})})});
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(SupabaseService).useValue({forUser, admin: () => admin})
      .compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => rpc.mockReset());

  it('returns 401 without a token', async () => {
    expect((await http.get('/v1/admin/payments/pending')).status).toBe(401);
  });

  it('forbids a customer on every admin payment route and never reaches the RPC', async () => {
    role = 'customer';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'user-1'})}`};
    expect((await http.get('/v1/admin/payments/pending').set(auth)).status).toBe(403);
    const confirm = await http.post(`/v1/admin/payments/${ORDER}/confirm`).set(auth).send({paidAmountMinor: 1, txnRef: 'x'});
    expect(confirm.status).toBe(403);
    expect((await http.post(`/v1/admin/payments/${ORDER}/reject`).set(auth).send({reason: 'nope'})).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('lets an admin confirm, using the token subject as admin id', async () => {
    role = 'admin';
    rpc.mockResolvedValue({data: {ok: true}, error: null});
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-9'})}`};
    const res = await http.post(`/v1/admin/payments/${ORDER}/confirm`).set(auth).send({paidAmountMinor: 129900, txnRef: 'T1'});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true, already: false});
    expect(rpc).toHaveBeenCalledWith('admin_confirm_manual_payment', expect.objectContaining({p_admin_id: 'admin-9', p_order_id: ORDER}));
  });

  it('answers 409 amount_mismatch and validates the body', async () => {
    role = 'admin';
    rpc.mockResolvedValue({data: {ok: false, reason: 'amount_mismatch'}, error: null});
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-9'})}`};
    const mismatch = await http.post(`/v1/admin/payments/${ORDER}/confirm`).set(auth).send({paidAmountMinor: 5, txnRef: 'T1'});
    expect(mismatch.status).toBe(409);
    expect(mismatch.body.error.code).toBe('amount_mismatch');
    const bad = await http.post(`/v1/admin/payments/${ORDER}/confirm`).set(auth).send({paidAmountMinor: -1, txnRef: ''});
    expect(bad.status).toBe(400);
    const shortReason = await http.post(`/v1/admin/payments/${ORDER}/reject`).set(auth).send({reason: 'x'});
    expect(shortReason.status).toBe(400);
  });
});
