import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {setupApp} from '../setup-app';
import {AuthRepository} from '../auth/auth.repository';
import {setTestEnv, signTestToken, type HttpClient} from '../test-helpers';
import {AdminAffiliatesRepository} from '../admin-affiliates/admin-affiliates.repository';
import {AdminCouponsRepository} from '../admin-coupons/admin-coupons.repository';
import {AdminRefundsRepository} from '../admin-refunds/admin-refunds.repository';
import {AdminSettingsRepository} from '../admin-settings/admin-settings.repository';
import {AdminTemplatesRepository} from './admin-templates.repository';

const ID = '3b0f5a0e-6f0e-4c0a-8d55-0c7c1d9d1a11';
const ROUTES: {method: 'get' | 'post' | 'put' | 'patch' | 'delete'; path: string; body?: object}[] = [
  {method: 'get', path: '/v1/admin/settings'},
  {method: 'put', path: '/v1/admin/settings/support_whatsapp', body: {value: '+201000000000'}},
  {method: 'get', path: '/v1/admin/coupons'},
  {method: 'post', path: '/v1/admin/coupons', body: {code: 'abc', percentOff: 10}},
  {method: 'get', path: '/v1/admin/coupons/abc/uses'},
  {method: 'post', path: '/v1/admin/coupons/abc/active', body: {active: false}},
  {method: 'get', path: '/v1/admin/templates'},
  {method: 'post', path: '/v1/admin/templates', body: {slug: 'x-y', nameAr: 'ا', nameEn: 'a', tier: 'classic'}},
  {method: 'get', path: `/v1/admin/templates/${ID}`},
  {method: 'put', path: `/v1/admin/templates/${ID}`, body: {nameAr: 'ا', nameEn: 'a', tier: 'classic'}},
  {method: 'post', path: `/v1/admin/templates/${ID}/status`, body: {status: 'live'}},
  {method: 'post', path: `/v1/admin/templates/${ID}/assets`, body: {r2Key: 'a/b.webp'}},
  {method: 'patch', path: `/v1/admin/templates/${ID}/assets/${ID}`, body: {source: 's'}},
  {method: 'delete', path: `/v1/admin/templates/${ID}/assets/${ID}`},
  {method: 'get', path: '/v1/admin/affiliates'},
  {method: 'post', path: '/v1/admin/affiliates', body: {refCode: 'abc', name: 'n'}},
  {method: 'put', path: `/v1/admin/affiliates/${ID}`, body: {name: 'n'}},
  {method: 'get', path: `/v1/admin/affiliates/${ID}/stats`},
  {method: 'get', path: `/v1/admin/affiliates/${ID}/orders`},
  {method: 'get', path: `/v1/admin/affiliates/${ID}/export`},
  {method: 'get', path: `/v1/admin/affiliates/${ID}/payouts`},
  {method: 'post', path: `/v1/admin/affiliates/${ID}/payouts`, body: {amountEgp: 5}},
  {method: 'get', path: '/v1/admin/refunds'},
  {method: 'post', path: `/v1/admin/refunds/${ID}/manual`, body: {note: 'returned'}}
];

describe('T22 admin routes (e2e on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let role = 'customer';
  const repos = {
    settings: {list: jest.fn().mockResolvedValue([]), set: jest.fn().mockResolvedValue({ok: true})},
    coupons: {list: jest.fn().mockResolvedValue([]), uses: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ok: true, code: 'abc'}), setActive: jest.fn().mockResolvedValue({ok: true})},
    templates: {
      list: jest.fn().mockResolvedValue([]), find: jest.fn().mockResolvedValue(null), save: jest.fn().mockResolvedValue({ok: true, id: ID}),
      setStatus: jest.fn().mockResolvedValue({ok: false, reason: 'license_incomplete', assets: [ID]}), saveAsset: jest.fn().mockResolvedValue({ok: true, id: ID}),
      deleteAsset: jest.fn().mockResolvedValue({ok: true})
    },
    affiliates: {
      list: jest.fn().mockResolvedValue([]), save: jest.fn().mockResolvedValue({ok: true, id: ID}), stats: jest.fn().mockResolvedValue({ok: true, orders: 1}),
      payouts: jest.fn().mockResolvedValue([]), recordPayout: jest.fn().mockResolvedValue({ok: true, id: ID}), orders: jest.fn().mockResolvedValue([]), countClick: jest.fn().mockResolvedValue(undefined)
    },
    refunds: {search: jest.fn().mockResolvedValue([]), markRefunded: jest.fn().mockResolvedValue({ok: true, already: false})}
  };

  beforeAll(async () => {
    setTestEnv();
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(AuthRepository).useValue({findRoleByUserId: () => Promise.resolve({role})})
      .overrideProvider(AdminSettingsRepository).useValue(repos.settings)
      .overrideProvider(AdminCouponsRepository).useValue(repos.coupons)
      .overrideProvider(AdminTemplatesRepository).useValue(repos.templates)
      .overrideProvider(AdminAffiliatesRepository).useValue(repos.affiliates)
      .overrideProvider(AdminRefundsRepository).useValue(repos.refunds)
      .compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  const call = async (route: (typeof ROUTES)[number], token?: string) => {
    let req = http[route.method](route.path);
    if (token !== undefined) req = req.set('Authorization', `Bearer ${token}`);
    return route.body === undefined ? req : req.send(route.body);
  };

  it.each(ROUTES)('$method $path: 401 without a token, 403 for a customer, never reaching the repository', async (route) => {
    role = 'customer';
    expect((await call(route)).status).toBe(401);
    const token = await signTestToken({subject: 'u-customer'});
    expect((await call(route, token)).status).toBe(403);
    for (const repo of Object.values(repos)) for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
  });

  it('an admin reaches the repository', async () => {
    role = 'admin';
    const token = await signTestToken({subject: 'u-admin'});
    expect((await http.get('/v1/admin/coupons').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect(repos.coupons.list).toHaveBeenCalled();
  });

  it('refuses to put a template live while an asset lacks its licence (422 with the offending assets)', async () => {
    role = 'admin';
    const token = await signTestToken({subject: 'u-admin'});
    const res = await http.post(`/v1/admin/templates/${ID}/status`).set('Authorization', `Bearer ${token}`).send({status: 'live'});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('license_incomplete');
  });

  it('validates settings per key', async () => {
    role = 'admin';
    const token = await signTestToken({subject: 'u-admin'});
    const bad = await http.put('/v1/admin/settings/support_whatsapp').set('Authorization', `Bearer ${token}`).send({value: 'call me'});
    expect(bad.status).toBe(400);
    const good = await http.put('/v1/admin/settings/payment_instructions').set('Authorization', `Bearer ${token}`).send({value: {ar: 'حوّلوا', en: 'Transfer'}});
    expect(good.status).toBe(200);
  });

  it('the public settings and click routes need no sign-in', async () => {
    repos.settings.list.mockResolvedValueOnce([{key: 'support_whatsapp', value: '+201000000000', updated_at: 'x'}]);
    const settings = await http.get('/v1/settings/public');
    expect(settings.status).toBe(200);
    expect(settings.body).toEqual({supportWhatsapp: '+201000000000', paymentInstructions: {ar: '', en: ''}});
    expect((await http.post('/v1/affiliates/click').send({ref: 'mona10'})).status).toBe(200);
    expect(repos.affiliates.countClick).toHaveBeenCalledWith('mona10', '/');
  });
});
