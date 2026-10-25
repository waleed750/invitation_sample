import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {createHash, randomBytes} from 'node:crypto';
import {AppModule} from '../app.module';
import {setupApp} from '../setup-app';
import {AuthRepository} from '../auth/auth.repository';
import {InvitationEditingService} from '../invitations/invitation-editing.service';
import {setTestEnv, type HttpClient} from '../test-helpers';
import {EditLinksRepository} from './edit-links.repository';

const INV = '3b0f5a0e-6f0e-4c0a-8d55-0c7c1d9d1a11';
const OTHER = '9c1b2a3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d';
const OWNER = '11111111-1111-4111-8111-111111111111';

describe('private edit links (e2e on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const resolveEditLink = jest.fn((tokenHash: string) =>
    Promise.resolve(tokenHash === hash ? {linkId: 'l1', invitationId: INV, ownerId: OWNER} : null));
  const editing = {
    get: jest.fn().mockResolvedValue({id: INV}),
    updateData: jest.fn().mockResolvedValue({updatedAt: 'now'}),
    publish: jest.fn().mockResolvedValue({ok: true})
  };
  const links = {resolve: jest.fn(), claim: jest.fn(), issue: jest.fn(), list: jest.fn(), revoke: jest.fn()};

  beforeAll(async () => {
    setTestEnv();
    const moduleRef = await Test.createTestingModule({imports: [AppModule]})
      .overrideProvider(AuthRepository).useValue({findRoleByUserId: () => Promise.resolve({role: 'admin'}), resolveEditLink})
      .overrideProvider(InvitationEditingService).useValue(editing)
      .overrideProvider(EditLinksRepository).useValue(links)
      .compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('opens, saves and publishes the one invitation it was issued for, acting as that invitation\'s owner', async () => {
    expect((await http.get(`/v1/invitations/${INV}`).set('X-Edit-Token', token)).status).toBe(200);
    expect(editing.get).toHaveBeenCalledWith(expect.objectContaining({id: OWNER, editToken: {invitationId: INV, linkId: 'l1'}}), INV);
    expect((await http.patch(`/v1/invitations/${INV}`).set('X-Edit-Token', token).send({document: {}})).status).not.toBe(401);
    expect((await http.post(`/v1/invitations/${INV}/publish`).set('X-Edit-Token', token)).status).toBe(200);
  });

  it('never opens another invitation', async () => {
    editing.get.mockClear();
    expect((await http.get(`/v1/invitations/${OTHER}`).set('X-Edit-Token', token)).status).toBe(401);
    expect(editing.get).not.toHaveBeenCalled();
  });

  it.each([
    ['get', '/v1/me'], ['get', '/v1/orders'], ['get', '/v1/balance'], ['post', '/v1/checkout'], ['get', '/v1/invitations'],
    ['patch', `/v1/invitations/${INV}/slug`], ['post', `/v1/invitations/${INV}/switch-template`], ['get', '/v1/admin/coupons'],
    ['get', '/v1/media'], ['post', '/v1/me/delete'], ['get', '/v1/me/export']
  ] as const)('is useless on %s %s (not an editor route)', async (method, path) => {
    const res = await http[method](path).set('X-Edit-Token', token).send({});
    expect(res.status).toBe(401);
  });

  it('rejects a malformed, unknown or empty token', async () => {
    for (const bad of ['', 'short', 'x'.repeat(43), `${token}extra`]) {
      expect((await http.get(`/v1/invitations/${INV}`).set('X-Edit-Token', bad)).status).toBe(401);
    }
  });

  it('a revoked link (the database no longer resolves it) stops working at once', async () => {
    resolveEditLink.mockResolvedValueOnce(null);
    expect((await http.get(`/v1/invitations/${INV}`).set('X-Edit-Token', token)).status).toBe(401);
  });

  it('resolve answers 404 for a bad link and the invitation id for a good one, with no sign-in', async () => {
    links.resolve.mockResolvedValueOnce({found: false});
    expect((await http.post('/v1/edit-links/resolve').send({token})).status).toBe(404);
    links.resolve.mockResolvedValueOnce({found: true, invitation_id: INV});
    const ok = await http.post('/v1/edit-links/resolve').send({token});
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({invitationId: INV});
    expect((await http.post('/v1/edit-links/resolve').send({token: 'nope'})).status).toBe(400);
  });

  it('claim and the admin routes need a real sign-in, not a link', async () => {
    expect((await http.post(`/v1/invitations/${INV}/claim`).set('X-Edit-Token', token).send({token})).status).toBe(401);
    expect((await http.post(`/v1/admin/invitations/${INV}/edit-links`).set('X-Edit-Token', token).send({})).status).toBe(401);
  });
});
