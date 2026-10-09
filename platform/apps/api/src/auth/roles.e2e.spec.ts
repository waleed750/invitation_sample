/* eslint-disable @typescript-eslint/no-explicit-any */
import {Controller, Get, type INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {Roles} from '../common/decorators';
import {setupApp} from '../setup-app';
import {AuthRepository} from './auth.repository';
import {setTestEnv, type HttpClient} from '../test-helpers';
import * as betterAuthMod from './better-auth';

@Controller('probe')
class ProbeController {
  @Get('open')
  open(): {ok: boolean} {
    return {ok: true};
  }

  @Roles('admin')
  @Get('admin')
  admin(): {ok: boolean} {
    return {ok: true};
  }
}

describe('roles guard (e2e, probe routes on the full app)', () => {
  let app: INestApplication;
  let http: HttpClient;
  let currentRole = 'customer';

  beforeAll(async () => {
    setTestEnv();
    const moduleRef = await Test.createTestingModule({imports: [AppModule], controllers: [ProbeController]})
      .overrideProvider(AuthRepository)
      .useValue({findRoleByUserId: () => Promise.resolve({role: currentRole})})
      .compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app);
    await app.init();
    http = request(app.getHttpServer());

    // mock better auth for all these requests
    jest.spyOn(betterAuthMod, 'getBetterAuth').mockReturnValue({
      api: {
        getSession: jest.fn().mockResolvedValue({
          session: { token: 'token' },
          user: { id: 'user-1' }
        })
      }
    } as any);
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('rejects unauthenticated callers with 401', async () => {
    jest.spyOn(betterAuthMod, 'getBetterAuth').mockReturnValueOnce({
      api: {
        getSession: jest.fn().mockResolvedValue(null)
      }
    } as any);
    const res = await http.get('/v1/probe/open');
    expect(res.status).toBe(401);
  });

  it('lets an authenticated customer hit a non-admin route', async () => {
    const res = await http.get('/v1/probe/open').set('Authorization', `Bearer some-token`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true});
  });

  it('rejects a customer on an admin-only route with the 403 envelope', async () => {
    currentRole = 'customer';
    const res = await http.get('/v1/probe/admin').set('Authorization', `Bearer some-token`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: {code: 'forbidden', message: expect.any(String), requestId: expect.any(String)}
    });
  });

  it('lets an admin through the admin-only route', async () => {
    currentRole = 'admin';
    const res = await http.get('/v1/probe/admin').set('Authorization', `Bearer some-token`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true});
  });
});
