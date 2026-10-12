import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {setupApp} from '../setup-app';
import {AuthRepository} from '../auth/auth.repository';
import {AdminAuditRepository, type AdminAuditLogDbRow} from './admin-audit.repository';
import {setTestEnv, signTestToken, type HttpClient} from '../test-helpers';

describe('admin audit-log (e2e on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let role = 'customer';
  let repository: {
    listAuditLogsAsServiceRole: jest.Mock;
  };

  const sampleDbRows: AdminAuditLogDbRow[] = [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      actor_id: 'u1111111-1111-4111-8111-111111111111',
      actor_email: 'admin@example.com',
      action: 'order.mark_paid',
      target_type: 'order',
      target_id: 'o1111111-1111-4111-8111-111111111111',
      details: {amount_minor: 129900},
      created_at: '2026-10-12T12:00:00.000Z'
    },
    {
      id: 'a2222222-2222-4222-8222-222222222222',
      actor_id: null,
      actor_email: null,
      action: 'order.auto_confirm',
      target_type: 'order',
      target_id: 'o2222222-2222-4222-8222-222222222222',
      details: {provider: 'generic-hmac'},
      created_at: '2026-10-12T11:00:00.000Z'
    }
  ];

  beforeAll(async () => {
    setTestEnv();
    repository = {
      listAuditLogsAsServiceRole: jest.fn().mockResolvedValue(sampleDbRows)
    };
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(AuthRepository)
      .useValue({findRoleByUserId: () => Promise.resolve({role})})
      .overrideProvider(AdminAuditRepository)
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
    repository.listAuditLogsAsServiceRole.mockClear();
  });

  it('returns 401 without a token', async () => {
    expect((await http.get('/v1/admin/audit-log')).status).toBe(401);
  });

  it('forbids a customer on /v1/admin/audit-log and never reaches the repository', async () => {
    role = 'customer';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'user-1'})}`};
    const res = await http.get('/v1/admin/audit-log').set(auth);
    expect(res.status).toBe(403);
    expect(repository.listAuditLogsAsServiceRole).not.toHaveBeenCalled();
  });

  it('lets an admin list audit logs with camelCase mapped fields', async () => {
    role = 'admin';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-1'})}`};
    const res = await http.get('/v1/admin/audit-log').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 'a1111111-1111-4111-8111-111111111111',
        actorId: 'u1111111-1111-4111-8111-111111111111',
        actorEmail: 'admin@example.com',
        action: 'order.mark_paid',
        targetType: 'order',
        targetId: 'o1111111-1111-4111-8111-111111111111',
        details: {amount_minor: 129900},
        createdAt: '2026-10-12T12:00:00.000Z'
      },
      {
        id: 'a2222222-2222-4222-8222-222222222222',
        actorId: null,
        action: 'order.auto_confirm',
        targetType: 'order',
        targetId: 'o2222222-2222-4222-8222-222222222222',
        details: {provider: 'generic-hmac'},
        createdAt: '2026-10-12T11:00:00.000Z'
      }
    ]);
    expect(repository.listAuditLogsAsServiceRole).toHaveBeenCalledWith({
      limit: 50,
      before: undefined,
      action: undefined
    });
  });

  it('passes query filters to repository', async () => {
    role = 'admin';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-1'})}`};
    const res = await http
      .get('/v1/admin/audit-log?limit=20&action=order.mark_paid&before=2026-10-12T12:00:00.000Z')
      .set(auth);
    expect(res.status).toBe(200);
    expect(repository.listAuditLogsAsServiceRole).toHaveBeenCalledWith({
      limit: 20,
      before: '2026-10-12T12:00:00.000Z',
      action: 'order.mark_paid'
    });
  });

  it('rejects an invalid limit (> 100 or < 1)', async () => {
    role = 'admin';
    const auth = {Authorization: `Bearer ${await signTestToken({subject: 'admin-1'})}`};
    expect((await http.get('/v1/admin/audit-log?limit=101').set(auth)).status).toBe(400);
    expect((await http.get('/v1/admin/audit-log?limit=0').set(auth)).status).toBe(400);
  });
});
