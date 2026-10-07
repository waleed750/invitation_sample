/* eslint-disable */
import {BadRequestException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {AdminCustomersService, escapeLike} from './admin-customers.service';

const OWNER = '44444444-4444-4444-8444-444444444444';

describe('escapeLike', () => {
  it('escapes %, _ and backslash and drops or-syntax characters', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
    expect(escapeLike('a,b(c)"d*')).toBe('a b c  d');
  });
});

describe('AdminCustomersService', () => {
  let repository: any;
  let service: AdminCustomersService;
  const profile = {
    id: 'u1', name: 'Mona', phone: '+201000000001', email: 'm@x.com', level: 'silver',
    purchases_count: 2, points_balance: 80, created_at: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    repository = {
      findSlugOwnersAsServiceRole: jest.fn().mockResolvedValue({data: [], error: null}),
      searchProfilesAsServiceRole: jest.fn().mockResolvedValue({data: [profile], error: null}),
      listRecentProfilesAsServiceRole: jest.fn().mockResolvedValue({data: [profile], error: null}),
      findProfileAsServiceRole: jest.fn().mockResolvedValue({data: profile, error: null}),
      listOrdersAsServiceRole: jest.fn().mockResolvedValue({data: [], error: null}),
      listInvitationsAsServiceRole: jest.fn().mockResolvedValue({data: [], error: null}),
      listPointsLedgerAsServiceRole: jest.fn().mockResolvedValue({data: [], error: null}),
      adjustEntitlementAsServiceRole: jest.fn(),
      adjustPointsAsServiceRole: jest.fn()
    };
    service = new AdminCustomersService(repository, {error: jest.fn()} as any);
  });

  describe('search', () => {
    it('maps profiles to the summary shape', async () => {
      await expect(service.search('mona', 5)).resolves.toEqual([{
        id: 'u1', name: 'Mona', phone: '+201000000001', email: 'm@x.com', level: 'silver',
        purchasesCount: 2, pointsBalance: 80, createdAt: '2026-01-01T00:00:00Z'
      }]);
    });

    it('normalises an Egyptian 01 number to +201', async () => {
      await service.search('01012345678', 20);
      expect(repository.searchProfilesAsServiceRole).toHaveBeenCalledWith(
        expect.objectContaining({phone: '+201012345678', limit: 20})
      );
    });

    it('passes no phone for non-phone text', async () => {
      await service.search('mona', 20);
      expect(repository.searchProfilesAsServiceRole).toHaveBeenCalledWith(
        expect.objectContaining({phone: null, likeText: 'mona'})
      );
    });

    it('escapes ilike wildcards before they reach the repository', async () => {
      await service.search('100%_x', 20);
      expect(repository.findSlugOwnersAsServiceRole).toHaveBeenCalledWith('100\\%\\_x', 20);
      expect(repository.searchProfilesAsServiceRole).toHaveBeenCalledWith(
        expect.objectContaining({likeText: '100\\%\\_x'})
      );
    });

    it('includes owners of invitations whose slug matched (deduped, uuid-checked)', async () => {
      repository.findSlugOwnersAsServiceRole.mockResolvedValue({
        data: [{owner_id: OWNER}, {owner_id: OWNER}, {owner_id: 'not-a-uuid,evil'}, {owner_id: null}], error: null
      });
      await service.search('ahmed-nour', 20);
      expect(repository.searchProfilesAsServiceRole).toHaveBeenCalledWith(
        expect.objectContaining({ownerIds: [OWNER]})
      );
    });

    it('lists recent profiles for an empty query', async () => {
      await service.search('   ', 7);
      expect(repository.listRecentProfilesAsServiceRole).toHaveBeenCalledWith(7);
      expect(repository.searchProfilesAsServiceRole).not.toHaveBeenCalled();
    });

    it('maps a query error to 503', async () => {
      repository.searchProfilesAsServiceRole.mockResolvedValue({data: null, error: {message: 'x'}});
      await expect(service.search('mona', 20)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('detail', () => {
    it('assembles profile, orders, invitations and ledger', async () => {
      repository.listOrdersAsServiceRole.mockResolvedValue({data: [{
        id: 'o1', kind: 'new', tier: 'classic', status: 'paid', amount_minor: 129900, currency: 'EGP',
        provider: 'manual', created_at: '2026-02-01T00:00:00Z'
      }], error: null});
      repository.listInvitationsAsServiceRole.mockResolvedValue({data: [{
        id: 'i1', slug: 'a-b', status: 'published', templates: {slug: 'riwaq'},
        invitation_entitlements: [{edits_allowed: 15, edits_used: 2, online_until: '2027-01-01T00:00:00Z'}]
      }], error: null});
      repository.listPointsLedgerAsServiceRole.mockResolvedValue({data: [{
        id: 'l1', delta: 50, reason: 'admin', order_id: null, expires_at: null, created_at: '2026-02-02T00:00:00Z'
      }], error: null});
      const detail = await service.detail('u1');
      expect(detail.profile.id).toBe('u1');
      expect(detail.orders[0]).toMatchObject({id: 'o1', amountMinor: 129900, provider: 'manual'});
      expect(detail.invitations[0]).toEqual({
        id: 'i1', slug: 'a-b', status: 'published', templateSlug: 'riwaq',
        entitlement: {editsAllowed: 15, editsUsed: 2, onlineUntil: '2027-01-01T00:00:00Z'}
      });
      expect(detail.pointsLedger[0]).toMatchObject({id: 'l1', delta: 50, reason: 'admin'});
      expect(repository.listPointsLedgerAsServiceRole).toHaveBeenCalledWith('u1', 50);
    });

    it('404s when the profile is missing', async () => {
      repository.findProfileAsServiceRole.mockResolvedValue({data: null, error: null});
      await expect(service.detail('u1')).rejects.toThrow(NotFoundException);
    });

    it('503s when a sub-query fails', async () => {
      repository.listOrdersAsServiceRole.mockResolvedValue({data: null, error: {message: 'x'}});
      await expect(service.detail('u1')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('adjustEntitlement', () => {
    const body = (extra: object = {}) => ({addEdits: 5, reason: 'goodwill', ...extra}) as any;

    it('calls the RPC with the admin id and defaults', async () => {
      repository.adjustEntitlementAsServiceRole.mockResolvedValue({
        data: {ok: true, edits_allowed: 20, online_until: '2027-01-01T00:00:00Z', status: 'published'}, error: null
      });
      await expect(service.adjustEntitlement('admin-1', 'i1', body())).resolves.toEqual({
        ok: true, editsAllowed: 20, onlineUntil: '2027-01-01T00:00:00Z', status: 'published'
      });
      expect(repository.adjustEntitlementAsServiceRole).toHaveBeenCalledWith('admin-1', 'i1', 5, 0, 'goodwill');
    });

    it('maps reason_required and invalid_adjustment to 400 with that code', async () => {
      for (const reason of ['reason_required', 'invalid_adjustment']) {
        repository.adjustEntitlementAsServiceRole.mockResolvedValueOnce({data: {ok: false, reason}, error: null});
        const error: any = await service.adjustEntitlement('a', 'i1', body()).catch((e) => e);
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toMatchObject({code: reason});
      }
    });

    it('maps not_found to 404, unknown reasons and RPC errors to 503', async () => {
      repository.adjustEntitlementAsServiceRole.mockResolvedValueOnce({data: {ok: false, reason: 'not_found'}, error: null});
      await expect(service.adjustEntitlement('a', 'i1', body())).rejects.toThrow(NotFoundException);
      repository.adjustEntitlementAsServiceRole.mockResolvedValueOnce({data: {ok: false, reason: 'weird'}, error: null});
      await expect(service.adjustEntitlement('a', 'i1', body())).rejects.toThrow(ServiceUnavailableException);
      repository.adjustEntitlementAsServiceRole.mockResolvedValueOnce({data: null, error: {message: 'boom'}});
      await expect(service.adjustEntitlement('a', 'i1', body())).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('adjustPoints', () => {
    it('returns the new balance', async () => {
      repository.adjustPointsAsServiceRole.mockResolvedValue({data: {ok: true, balance: 580}, error: null});
      await expect(service.adjustPoints('admin-1', 'u1', {delta: 500, reason: 'goodwill'} as any))
        .resolves.toEqual({balance: 580});
      expect(repository.adjustPointsAsServiceRole).toHaveBeenCalledWith('admin-1', 'u1', 500, 'goodwill');
    });

    it('maps error reasons', async () => {
      repository.adjustPointsAsServiceRole.mockResolvedValueOnce({data: {ok: false, reason: 'invalid_adjustment'}, error: null});
      await expect(service.adjustPoints('a', 'u1', {delta: 0, reason: 'xxx'} as any)).rejects.toThrow(BadRequestException);
      repository.adjustPointsAsServiceRole.mockResolvedValueOnce({data: {ok: false, reason: 'not_found'}, error: null});
      await expect(service.adjustPoints('a', 'u1', {delta: 1, reason: 'xxx'} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
