import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {CLOCK, type Clock} from '../common/clock';
import {EntitlementsRepository} from './entitlements.repository';
import {setTestEnv} from '../test-helpers';
import {EntitlementsController} from './entitlements.controller';
import {EntitlementsService, InvitationIdParams} from './entitlements.service';

setTestEnv();

const fixedClock: Clock = {now: () => new Date('2026-06-01T12:00:00.000Z')};

async function bootController(row: unknown): Promise<EntitlementsController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [EntitlementsController],
    providers: [
      EntitlementsService,
      AppLogger,
      {provide: CLOCK, useValue: fixedClock},
      {provide: EntitlementsRepository, useValue: {findByInvitationId: jest.fn().mockResolvedValue(row)}}
    ]
  }).compile();
  return moduleRef.get(EntitlementsController);
}

describe('EntitlementsController (mocked EntitlementsRepository)', () => {
  it('returns the computed entitlement for a visible row', async () => {
    const controller = await bootController({edits_allowed: 15, edits_used: 3, online_until: '2026-12-01T00:00:00.000Z'});
    const result = await controller.getEntitlement(InvitationIdParams.create({id: '11111111-1111-4111-8111-111111111111'}), {
      id: 'user-123',
      jwt: 'test-jwt'
    });
    expect(result).toEqual({
      editsAllowed: 15,
      editsUsed: 3,
      editsRemaining: 12,
      onlineUntil: '2026-12-01T00:00:00.000Z',
      daysOnlineLeft: expect.any(Number),
      canPublish: {ok: true}
    });
  });

  it('surfaces 404 when RLS hides the invitation', async () => {
    const controller = await bootController(null);
    await expect(
      controller.getEntitlement(InvitationIdParams.create({id: '11111111-1111-4111-8111-111111111111'}), {
        id: 'user-123',
        jwt: 'test-jwt'
      })
    ).rejects.toThrow('Entitlement not found');
  });
});
