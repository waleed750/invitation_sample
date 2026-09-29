import {Controller, Get, type INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../app.module';
import {Roles} from '../common/decorators';
import {setupApp} from '../setup-app';
import {SupabaseService} from '../supabase/supabase.service';
import {mockSupabaseClient, setTestEnv, signTestToken, type HttpClient} from '../test-helpers';

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
      .overrideProvider(SupabaseService)
      .useValue({forUser: () => mockSupabaseClient({data: {role: currentRole}, error: null})})
      .compile();
    app = moduleRef.createNestApplication({logger: false});
    setupApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated callers with 401', async () => {
    const res = await http.get('/v1/probe/open');
    expect(res.status).toBe(401);
  });

  it('lets an authenticated customer hit a non-admin route', async () => {
    const token = await signTestToken({subject: 'user-1'});
    const res = await http.get('/v1/probe/open').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true});
  });

  it('rejects a customer on an admin-only route with the 403 envelope', async () => {
    currentRole = 'customer';
    const token = await signTestToken({subject: 'user-1'});
    const res = await http.get('/v1/probe/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: {code: 'forbidden', message: expect.any(String), requestId: expect.any(String)}
    });
  });

  it('lets an admin through the admin-only route', async () => {
    currentRole = 'admin';
    const token = await signTestToken({subject: 'admin-1'});
    const res = await http.get('/v1/probe/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ok: true});
  });
});
