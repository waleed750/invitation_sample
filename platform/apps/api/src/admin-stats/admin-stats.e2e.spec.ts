import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {setupApp} from '../setup-app';
import {AuthRepository} from '../auth/auth.repository';
import {AdminStatsRepository, type AdminStatsData} from './admin-stats.repository';
import {setTestEnv, signTestToken, type HttpClient} from '../test-helpers';

describe('admin stats (e2e on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let role = 'customer';
  let repository: {
    getStatsAsServiceRole: jest.Mock;
  };

  const sampleStats: AdminStatsData = {
    revenue: {
      todayMinor: 50000,
      last7dMinor: 150000,
      last30dMinor: 450000,
      currency: 'EGP'
    },
    ordersByStatus: {
      pending: 3,
      paid: 12,
      failed: 1,
      refunded: 0,
      expired: 2,
      rejected: 1
    },
    pendingManualPayments: 2,
    unmatchedPaymentEvents: 1,
    activeInvitations: 8,
    newSignups7d: 15,
    rsvps7d: 42
  };

  beforeAll(async () => {
    setTestEnv();
    repository = {
      getStatsAsServiceRole: jest.fn().mockResolvedValue(sampleStats)
    };
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(AuthRepository)
      .useValue({findRoleByUserId: () => Promise.resolve({role})})
      .overrideProvider(AdminStatsRepository)
      .useValue(repository)
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
    repository.getStatsAsServiceRole.mockClear();
  });

  it('returns 401 without a token', async () => {
    expect((await http.get('/v1/admin/stats')).status).toBe(401);
  });

  it('forbids a customer on /v1/admin/stats and never reaches the repository', async () => {
    role = 'customer';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'user-1'})}`};
    const res = await http.get('/v1/admin/stats').set(auth);
    expect(res.status).toBe(403);
    expect(repository.getStatsAsServiceRole).not.toHaveBeenCalled();
  });

  it('lets an admin get stats and returns valid shape', async () => {
    role = 'admin';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-1'})}`};
    const res = await http.get('/v1/admin/stats').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleStats);
    expect(repository.getStatsAsServiceRole).toHaveBeenCalled();
  });
});
