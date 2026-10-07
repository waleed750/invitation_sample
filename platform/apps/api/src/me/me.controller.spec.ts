import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {SupabaseService} from '../supabase/supabase.service';
import {MeRepository} from './me.repository';
import {mockSupabaseClient, setTestEnv} from '../test-helpers';
import {MeController} from './me.controller';
import {MeService} from './me.service';

setTestEnv();

const ROW = {
  id: 'user-123',
  name: 'Nour',
  preferred_locale: 'ar',
  role: 'customer',
  level: 'member',
  purchases_count: 1,
  points_balance: 50
};

async function bootController(row: unknown, error: {code: string} | null): Promise<MeController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [MeController],
    providers: [
      MeService,
      AppLogger,
      MeRepository, {provide: SupabaseService, useValue: {forUser: jest.fn().mockReturnValue(mockSupabaseClient({data: row, error}))}}
    ]
  }).compile();
  return moduleRef.get(MeController);
}

describe('MeController (mocked SupabaseService)', () => {
  it('returns the caller profile row field-for-field', async () => {
    const controller = await bootController(ROW, null);
    await expect(controller.getMe({id: 'user-123', jwt: 'test-jwt'})).resolves.toEqual(ROW);
  });

  it('surfaces 404 with a generic message when RLS hides the row', async () => {
    const controller = await bootController(null, {code: 'PGRST116'});
    await expect(controller.getMe({id: 'user-123', jwt: 'test-jwt'})).rejects.toThrow('Profile not found');
  });

  it('surfaces 503 with a generic message on upstream failure', async () => {
    const controller = await bootController(null, {code: 'XX000'});
    await expect(controller.getMe({id: 'user-123', jwt: 'test-jwt'})).rejects.toThrow('Profile service unavailable');
  });
});
