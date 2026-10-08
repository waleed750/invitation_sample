/* eslint-disable */
import {BadRequestException, ForbiddenException, GoneException, NotFoundException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {createHmac} from 'node:crypto';
import {AppLogger} from '../common/app-logger';
import {CLOCK} from '../common/clock';
import {AppConfigService} from '../config/app-config.service';
import {PublicInvitationsRepository} from './public-invitations.repository';
import {PublicInvitationsService} from './public-invitations.service';

const NOW = new Date('2026-06-01T00:00:00Z');
const FUTURE = '2030-01-01T00:00:00Z';
const PAST = '2020-01-01T00:00:00Z';
const IP_SECRET = 'test-ip-hash-secret-at-least-32-chars';

function invitationRow(tier: string, onlineUntil: string | null) {
  return {id: 'inv-1', slug: 'ahmed-mona', locale: 'ar', status: 'published', data: {}, template: {slug: 'elegante'}, entitlement: {tier, online_until: onlineUntil}};
}
function publishRow(snapshot: unknown = {couple: {first: 'Ahmed', second: 'Mona'}, eventDate: '2026-06-20'}) {
  return {snapshot, published_at: '2026-01-01T00:00:00Z'};
}

describe('PublicInvitationsService', () => {
  let service: PublicInvitationsService;
  let repository: Record<string, jest.Mock>;

  async function boot(invitation: {tier: string; online_until: string | null} = {tier: 'classic', online_until: FUTURE}, snapshot?: unknown) {
    repository = {
      findPublishedBySlugAsServiceRole: jest.fn().mockResolvedValue({data: invitationRow(invitation.tier, invitation.online_until), error: null}),
      findLatestPublishAsServiceRole: jest.fn().mockResolvedValue({data: publishRow(snapshot), error: null}),
      listRsvpCountsAsServiceRole: jest.fn().mockResolvedValue({data: [], error: null}),
      saveRsvpAsServiceRole: jest.fn().mockResolvedValue({data: [{id: 'r1'}], error: null}),
      saveMessageAsServiceRole: jest.fn().mockResolvedValue({data: [{id: 'm1'}], error: null})
    };
    const module = await Test.createTestingModule({
      providers: [
        PublicInvitationsService,
        {provide: PublicInvitationsRepository, useValue: repository},
        {provide: CLOCK, useValue: {now: () => NOW}},
        {provide: AppConfigService, useValue: {ipHashSecret: IP_SECRET}},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();
    service = module.get(PublicInvitationsService);
  }

  it('returns the live snapshot for a published invitation', async () => {
    await boot();
    const result = await service.getBySlug('ahmed-mona');
    expect(result).toMatchObject({state: 'live', slug: 'ahmed-mona', tier: 'classic'});
  });

  it('includes templateSlug in the live response, null when the template is missing', async () => {
    await boot();
    expect(await service.getBySlug('ahmed-mona')).toMatchObject({state: 'live', templateSlug: 'elegante'});
    repository.findPublishedBySlugAsServiceRole.mockResolvedValue({data: {...invitationRow('classic', FUTURE), template: null}, error: null});
    expect(await service.getBySlug('ahmed-mona')).toMatchObject({state: 'live', templateSlug: null});
  });

  it('returns the ended shell once online_until has passed', async () => {
    await boot({tier: 'classic', online_until: PAST});
    const result = await service.getBySlug('ahmed-mona');
    expect(result).toEqual({state: 'ended', couple: {first: 'Ahmed', second: 'Mona'}, eventDate: '2026-06-20'});
    expect(result).not.toHaveProperty('snapshot');
  });

  it('throws NotFound for an unknown slug', async () => {
    await boot();
    repository.findPublishedBySlugAsServiceRole.mockResolvedValueOnce({data: null, error: {code: 'PGRST116'}});
    await expect(service.getBySlug('nope')).rejects.toThrow(NotFoundException);
  });

  it('ignores honeypot RSVPs without saving', async () => {
    await boot();
    const result = await service.submitRsvp('ahmed-mona', {name: 'Bot', attending: true, guests: 1, website: 'http://spam.example'} as any, '1.2.3.4');
    expect(result).toEqual({ok: true});
    expect(repository.saveRsvpAsServiceRole).not.toHaveBeenCalled();
    expect(repository.findPublishedBySlugAsServiceRole).not.toHaveBeenCalled();
  });

  it('ignores honeypot messages without saving', async () => {
    await boot({tier: 'premium', online_until: FUTURE});
    const result = await service.submitMessage('ahmed-mona', {name: 'Bot', text: 'hi', website: 'x'} as any);
    expect(result).toEqual({ok: true});
    expect(repository.saveMessageAsServiceRole).not.toHaveBeenCalled();
  });

  it('rejects RSVPs for save-the-date (rsvp_disabled)', async () => {
    await boot({tier: 'save_the_date', online_until: FUTURE});
    const error = await service.submitRsvp('ahmed-mona', {name: 'A', attending: true, guests: 1} as any, '1.2.3.4').catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toMatchObject({code: 'rsvp_disabled'});
    expect(repository.saveRsvpAsServiceRole).not.toHaveBeenCalled();
  });

  it('rejects RSVPs once the tier limit is reached', async () => {
    await boot();
    repository.listRsvpCountsAsServiceRole.mockResolvedValueOnce({data: [{attending: true, guests_count: 299}], error: null});
    const error = await service.submitRsvp('ahmed-mona', {name: 'A', attending: true, guests: 2} as any, '1.2.3.4').catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toMatchObject({code: 'rsvp_limit_reached'});
  });

  it('normalizes the phone and stores the ip hash', async () => {
    await boot({tier: 'premium', online_until: FUTURE});
    await service.submitRsvp('ahmed-mona', {name: 'A', phone: '01012345678', attending: true, guests: 1} as any, '1.2.3.4');
    expect(repository.saveRsvpAsServiceRole).toHaveBeenCalledWith(expect.objectContaining({
      phone: '+201012345678',
      ip_hash: createHmac('sha256', IP_SECRET).update('1.2.3.4').digest('hex')
    }));
  });

  it('rejects a non-Egyptian phone', async () => {
    await boot({tier: 'premium', online_until: FUTURE});
    await expect(
      service.submitRsvp('ahmed-mona', {name: 'A', phone: '+14155552671', attending: true, guests: 1} as any, '1.2.3.4')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects writes once the invitation has ended', async () => {
    await boot({tier: 'premium', online_until: PAST});
    await expect(
      service.submitRsvp('ahmed-mona', {name: 'A', attending: true, guests: 1} as any, '1.2.3.4')
    ).rejects.toThrow(GoneException);
  });

  it('rejects messages for classic (messages_disabled)', async () => {
    await boot();
    const error = await service.submitMessage('ahmed-mona', {name: 'A', text: 'Congrats'} as any).catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toMatchObject({code: 'messages_disabled'});
  });

  it('accepts messages for premium', async () => {
    await boot({tier: 'premium', online_until: FUTURE});
    await expect(service.submitMessage('ahmed-mona', {name: 'A', text: 'Congrats'} as any)).resolves.toEqual({ok: true});
    expect(repository.saveMessageAsServiceRole).toHaveBeenCalledWith({invitation_id: 'inv-1', name: 'A', body: 'Congrats'});
  });
});
