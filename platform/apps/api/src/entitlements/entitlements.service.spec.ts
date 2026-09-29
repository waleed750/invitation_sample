import {NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {CLOCK, type Clock} from '../common/clock';
import type {RequestUser} from '../common/decorators';
import {SupabaseService} from '../supabase/supabase.service';
import {mockSupabaseClient, setTestEnv} from '../test-helpers';
import {EntitlementsService} from './entitlements.service';

setTestEnv();

const USER: RequestUser = {id: 'user-123', jwt: 'test-jwt'};
const FIXED_NOW = new Date('2026-06-01T12:00:00.000Z');
const fixedClock: Clock = {now: () => new Date(FIXED_NOW)};
const INVITATION_ID = '11111111-1111-4111-8111-111111111111';

async function buildService(
  row: unknown,
  error: {code: string} | null
): Promise<{service: EntitlementsService; forUser: jest.Mock}> {
  const forUser = jest.fn().mockReturnValue(mockSupabaseClient({data: row, error}));
  const moduleRef = await Test.createTestingModule({
    providers: [EntitlementsService, AppLogger, {provide: CLOCK, useValue: fixedClock}, {provide: SupabaseService, useValue: {forUser}}]
  }).compile();
  return {service: moduleRef.get(EntitlementsService), forUser};
}

describe('EntitlementsService', () => {
  it('returns the full entitlement when edits and time remain', async () => {
    const {service} = await buildService({edits_allowed: 15, edits_used: 7, online_until: '2026-12-01T00:00:00.000Z'}, null);
    await expect(service.getEntitlement(USER, INVITATION_ID)).resolves.toEqual({
      editsAllowed: 15,
      editsUsed: 7,
      editsRemaining: 8,
      onlineUntil: '2026-12-01T00:00:00.000Z',
      daysOnlineLeft: expect.any(Number),
      canPublish: {ok: true}
    });
  });

  it('reports no_edits_left when edits used equals allowed (boundary)', async () => {
    const {service} = await buildService({edits_allowed: 5, edits_used: 5, online_until: '2026-12-01T00:00:00.000Z'}, null);
    const result = service.toResponse(
      {edits_allowed: 5, edits_used: 5, online_until: '2026-12-01T00:00:00.000Z'},
      FIXED_NOW
    );
    expect(result.editsRemaining).toBe(0);
    expect(result.canPublish).toEqual({ok: false, reason: 'no_edits_left'});
  });

  it('reports expired when now equals onlineUntil (boundary)', async () => {
    const {service} = await buildService({edits_allowed: 5, edits_used: 1, online_until: FIXED_NOW.toISOString()}, null);
    const result = service.toResponse(
      {edits_allowed: 5, edits_used: 1, online_until: FIXED_NOW.toISOString()},
      FIXED_NOW
    );
    expect(result.daysOnlineLeft).toBe(0);
    expect(result.canPublish).toEqual({ok: false, reason: 'expired'});
  });

  it('prefers no_edits_left over expired when both apply (matches @platform/shared)', async () => {
    const {service} = await buildService({edits_allowed: 5, edits_used: 9, online_until: FIXED_NOW.toISOString()}, null);
    const result = service.toResponse(
      {edits_allowed: 5, edits_used: 9, online_until: FIXED_NOW.toISOString()},
      FIXED_NOW
    );
    expect(result.canPublish).toEqual({ok: false, reason: 'no_edits_left'});
  });

  it('treats a null online_until as expired with zero days left', async () => {
    const {service} = await buildService({edits_allowed: 5, edits_used: 0, online_until: null}, null);
    const result = await service.getEntitlement(USER, INVITATION_ID);
    expect(result.onlineUntil).toBeNull();
    expect(result.daysOnlineLeft).toBe(0);
    expect(result.canPublish).toEqual({ok: false, reason: 'expired'});
  });

  it('throws 404 when RLS hides the row', async () => {
    const {service} = await buildService(null, {code: 'PGRST116'});
    await expect(service.getEntitlement(USER, INVITATION_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 503 (no internals) on upstream failure', async () => {
    const {service} = await buildService(null, {code: 'XX000'});
    const error: unknown = await service.getEntitlement(USER, INVITATION_ID).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).message).toBe('Entitlement service unavailable');
  });

  it('throws 503 on a malformed row instead of crashing', async () => {
    const {service} = await buildService({edits_allowed: 'many', edits_used: 0, online_until: null}, null);
    await expect(service.getEntitlement(USER, INVITATION_ID)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('queries through forUser (RLS) with the caller JWT', async () => {
    const {service, forUser} = await buildService({edits_allowed: 5, edits_used: 0, online_until: null}, null);
    await service.getEntitlement(USER, INVITATION_ID);
    expect(forUser).toHaveBeenCalledWith('test-jwt');
    expect(forUser).toHaveBeenCalledTimes(1);
  });
});
