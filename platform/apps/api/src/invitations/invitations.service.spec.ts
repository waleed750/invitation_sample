/* eslint-disable */
import {ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {CLOCK} from '../common/clock';
import {InvitationsRepository} from './invitations.repository';
import {InvitationsService} from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let repository: {listByOwner: jest.Mock};

  beforeEach(async () => {
    repository = {listByOwner: jest.fn()};

    const module = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {provide: InvitationsRepository, useValue: repository},
        {provide: AppLogger, useValue: {error: jest.fn()}},
        {provide: CLOCK, useValue: {now: () => new Date('2026-10-07T00:00:00Z')}}
      ]
    }).compile();

    service = module.get(InvitationsService);
  });

  it('should list invitations', async () => {
    repository.listByOwner.mockResolvedValueOnce([{
        id: '1', order_id: 'o1', slug: 'slug', data: {}, locale: 'en', status: 'live',
        created_at: '2026-01-01T00:00:00Z',
        template: {slug: 'test'},
        entitlement: {tier: 'classic', edits_allowed: 10, edits_used: 5, online_until: '2027-01-01T00:00:00Z'}
      }]);
    const result = await service.list({id: 'u1'} as any);
    expect(result).toHaveLength(1);
    expect(result[0].entitlement.editsAllowed).toBe(10);
  });

  it('should throw ServiceUnavailableException on DB error', async () => {
    repository.listByOwner.mockRejectedValueOnce(new Error('DB error'));
    await expect(service.list({id: 'u1'} as any)).rejects.toThrow(ServiceUnavailableException);
  });
});
