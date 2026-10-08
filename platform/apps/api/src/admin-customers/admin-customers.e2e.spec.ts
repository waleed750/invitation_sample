import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {setupApp} from '../setup-app';
import {SupabaseService} from '../supabase/supabase.service';
import {setTestEnv, signTestToken, type HttpClient} from '../test-helpers';

const USER = '55555555-5555-4555-8555-555555555555';
const INVITATION = '66666666-6666-4666-8666-666666666666';

describe('admin customers (e2e on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let role = 'customer';
  let rpc: jest.Mock;
  let from: jest.Mock;

  beforeAll(async () => {
    setTestEnv();
    rpc = jest.fn();
    from = jest.fn();
    const forUser = () => ({from: () => ({select: () => ({eq: () => ({single: () => Promise.resolve({data: {role}, error: null})})})})});
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(SupabaseService).useValue({forUser, admin: () => ({rpc, from})})
      .compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it('returns 401 without a token', async () => {
    expect((await http.get('/v1/admin/customers')).status).toBe(401);
  });

  it('forbids a customer on all four routes and never touches the database', async () => {
    role = 'customer';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'user-1'})}`};
    expect((await http.get('/v1/admin/customers?q=mona').set(auth)).status).toBe(403);
    expect((await http.get(`/v1/admin/customers/${USER}`).set(auth)).status).toBe(403);
    const entitlement = await http.post(`/v1/admin/invitations/${INVITATION}/entitlement-adjustments`)
      .set(auth).send({addEdits: 1, reason: 'sneaky'});
    expect(entitlement.status).toBe(403);
    const points = await http.post(`/v1/admin/customers/${USER}/points-adjustments`)
      .set(auth).send({delta: 1000, reason: 'sneaky'});
    expect(points.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('lets an admin adjust points, using the token subject as admin id', async () => {
    role = 'admin';
    rpc.mockResolvedValue({data: {ok: true, balance: 650}, error: null});
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-9'})}`};
    const res = await http.post(`/v1/admin/customers/${USER}/points-adjustments`).set(auth).send({delta: 500, reason: 'goodwill'});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({balance: 650});
    expect(rpc).toHaveBeenCalledWith('admin_adjust_points', {
      p_admin_id: 'admin-9', p_user_id: USER, p_delta: 500, p_reason: 'goodwill'
    });
  });

  it('maps entitlement errors and validates bodies', async () => {
    role = 'admin';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-9'})}`};
    const url = `/v1/admin/invitations/${INVITATION}/entitlement-adjustments`;
    rpc.mockResolvedValue({data: {ok: false, reason: 'invalid_adjustment'}, error: null});
    const invalid = await http.post(url).set(auth).send({reason: 'nothing to do'});
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('invalid_adjustment');
    rpc.mockResolvedValue({data: {ok: false, reason: 'not_found'}, error: null});
    expect((await http.post(url).set(auth).send({addEdits: 1, reason: 'goodwill'})).status).toBe(404);
    rpc.mockClear();
    expect((await http.post(url).set(auth).send({addEdits: 1, reason: 'x'})).status).toBe(400);
    expect((await http.post(url).set(auth).send({addEdits: 101, reason: 'too many'})).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();

    const pointsUrl = `/v1/admin/customers/${USER}/points-adjustments`;
    rpc.mockResolvedValue({data: {ok: false, reason: 'insufficient_points'}, error: null});
    const insufficient = await http.post(pointsUrl).set(auth).send({delta: -100, reason: 'too much'});
    expect(insufficient.status).toBe(409);
    expect(insufficient.body.error.code).toBe('insufficient_points');
  });

  it('rejects an out-of-range search limit', async () => {
    role = 'admin';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-9'})}`};
    expect((await http.get('/v1/admin/customers?limit=51').set(auth)).status).toBe(400);
    expect((await http.get('/v1/admin/customers?limit=0').set(auth)).status).toBe(400);
  });
});
