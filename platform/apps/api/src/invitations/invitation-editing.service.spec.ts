/* eslint-disable */
import {BadRequestException, ConflictException, HttpException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {CLOCK} from '../common/clock';
import {InvitationEditingService} from './invitation-editing.service';
import {RevalidationService} from '../revalidation/revalidation.service';
import {InvitationsRepository} from './invitations.repository';

const user = {id: 'owner-1', jwt: 'owner-1'} as any;
const ID = '11111111-1111-4111-8111-111111111111';
const U1 = '2026-10-07T10:00:00.123456+00:00';
const U2 = '2026-10-07T10:05:00.654321+00:00';

function row(over: Record<string, unknown> = {}) {
  return {
    id: ID, slug: 'ahmed-mona', status: 'draft', template_id: 'tpl-1', order_id: 'ord-1', template: {slug: 'elegante'}, data: {a: 1}, updated_at: U1, published_at: null,
    entitlement: {tier: 'classic', edits_allowed: 15, edits_used: 0, online_until: '2027-01-01T00:00:00Z'},
    ...over
  };
}
const ok = (data: unknown) => data;
const fail = (code: string, message = 'x') => Object.assign(new Error(message), {code});

describe('InvitationEditingService', () => {
  let service: InvitationEditingService;
  let repo: Record<string, jest.Mock>;
  let revalidation: {revalidateInvitation: jest.Mock};

  beforeEach(async () => {
    repo = {
      findById: jest.fn(), updateDataIfMatch: jest.fn(), updateSlug: jest.fn(), publish: jest.fn(),
      slugsTakenAsServiceRole: jest.fn(), undoPublish: jest.fn(), switchTemplate: jest.fn()
    };
    revalidation = {revalidateInvitation: jest.fn()};
    const module = await Test.createTestingModule({
      providers: [
        InvitationEditingService,
        {provide: InvitationsRepository, useValue: repo},
        {provide: AppLogger, useValue: {error: jest.fn()}},
        {provide: RevalidationService, useValue: revalidation},
        {provide: CLOCK, useValue: {now: () => new Date('2026-10-07T00:00:00Z')}}
      ]
    }).compile();
    service = module.get(InvitationEditingService);
  });

  describe('get', () => {
    it('returns detail with entitlement', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      const result = await service.get(user, ID);
      expect(result).toMatchObject({id: ID, slug: 'ahmed-mona', status: 'draft', templateId: 'tpl-1', updatedAt: U1, publishedAt: null});
      expect(result.entitlement).toMatchObject({editsAllowed: 15, editsUsed: 0, remaining: 15, tier: 'classic'});
      expect(repo.findById).toHaveBeenCalledWith('owner-1', ID);
    });

    it('exposes templateSlug and orderId (also when the relation is an array)', async () => {
      repo.findById.mockResolvedValue(ok(row({template: [{slug: 'citystars'}]})));
      expect(await service.get(user, ID)).toMatchObject({templateSlug: 'citystars', orderId: 'ord-1'});
    });

    it('returns null templateSlug and orderId when there is no template or order', async () => {
      repo.findById.mockResolvedValue(ok(row({template: null, order_id: null, template_id: null})));
      expect(await service.get(user, ID)).toMatchObject({templateSlug: null, orderId: null});
    });

    it("404s on someone else's invitation (RLS returns no row)", async () => {
      repo.findById.mockResolvedValue(ok(null));
      await expect(service.get(user, ID)).rejects.toThrow(NotFoundException);
    });

    it('503s on upstream error', async () => {
      repo.findById.mockRejectedValue(fail('XX000'));
      await expect(service.get(user, ID)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('updateData', () => {
    const body = {data: {x: 1}} as any;

    it('428s without If-Match', async () => {
      const err = await service.updateData(user, ID, body, undefined).catch((e) => e);
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(428);
      expect(err.getResponse()).toMatchObject({code: 'precondition_required'});
      expect(repo.updateDataIfMatch).not.toHaveBeenCalled();
    });

    it('400s on a non-timestamp If-Match', async () => {
      await expect(service.updateData(user, ID, body, 'abc')).rejects.toThrow(BadRequestException);
    });

    it('updates and returns the new updatedAt; strips ETag quotes', async () => {
      repo.updateDataIfMatch.mockResolvedValue(U2);
      await expect(service.updateData(user, ID, body, `"${U1}"`)).resolves.toEqual({updatedAt: U2});
      expect(repo.updateDataIfMatch).toHaveBeenCalledWith('owner-1', ID, body.data, U1);
    });

    it('409 edit_conflict on a stale If-Match', async () => {
      repo.updateDataIfMatch.mockResolvedValue(null);
      repo.findById.mockResolvedValue(ok(row({updated_at: U2})));
      const err = await service.updateData(user, ID, body, U1).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toMatchObject({code: 'edit_conflict'});
    });

    it("404 for someone else's invitation", async () => {
      repo.updateDataIfMatch.mockResolvedValue(null);
      repo.findById.mockResolvedValue(ok(null));
      await expect(service.updateData(user, ID, body, U1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSlug', () => {
    it('rejects invalid slugs without touching the DB', async () => {
      const err = await service.updateSlug(user, ID, 'Bad_Slug').catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.getResponse()).toMatchObject({code: 'slug_invalid'});
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('rejects reserved slugs', async () => {
      const err = await service.updateSlug(user, ID, 'admin').catch((e) => e);
      expect(err.getResponse()).toMatchObject({code: 'slug_reserved'});
    });

    it('changes the slug of a draft', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.updateSlug.mockResolvedValue(true);
      await expect(service.updateSlug(user, ID, 'new-slug')).resolves.toEqual({slug: 'new-slug'});
      expect(repo.updateSlug).toHaveBeenCalledWith('owner-1', ID, 'new-slug');
    });

    it('409 slug_locked after first publish (service check)', async () => {
      repo.findById.mockResolvedValue(ok(row({status: 'published', published_at: U1})));
      const err = await service.updateSlug(user, ID, 'new-slug').catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toMatchObject({code: 'slug_locked'});
      expect(repo.updateSlug).not.toHaveBeenCalled();
    });

    it('409 slug_locked when only the DB guard refuses', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.updateSlug.mockRejectedValue(fail('P0001', 'invitations: slug cannot change after publishing'));
      const err = await service.updateSlug(user, ID, 'new-slug').catch((e) => e);
      expect(err.getResponse()).toMatchObject({code: 'slug_locked'});
    });

    it('409 slug_taken on unique violation', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.updateSlug.mockRejectedValue(fail('23505'));
      const err = await service.updateSlug(user, ID, 'taken-slug').catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toMatchObject({code: 'slug_taken'});
    });

    it("404 for someone else's invitation", async () => {
      repo.findById.mockResolvedValue(ok(null));
      await expect(service.updateSlug(user, ID, 'new-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('availability', () => {
    it('invalid: no DB call, no suggestions', async () => {
      await expect(service.availability('A')).resolves.toEqual({available: false, reason: 'invalid', suggestions: []});
      expect(repo.slugsTakenAsServiceRole).not.toHaveBeenCalled();
    });

    it('free slug is available', async () => {
      repo.slugsTakenAsServiceRole.mockResolvedValue([]);
      await expect(service.availability('ahmed-mona')).resolves.toEqual({available: true, suggestions: []});
    });

    it('taken slug returns valid, free suggestions from one query', async () => {
      repo.slugsTakenAsServiceRole.mockImplementation(async (slugs: string[]) => {
        expect(slugs[0]).toBe('ahmed-mona');
        return ['ahmed-mona', 'ahmed-mona-2026'];
      });
      const result = await service.availability('ahmed-mona');
      expect(repo.slugsTakenAsServiceRole).toHaveBeenCalledTimes(1);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('taken');
      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions).not.toContain('ahmed-mona-2026');
      expect(result.suggestions[0]).toBe('ahmed-mona-2');
      for (const s of result.suggestions) expect(s).toMatch(/^ahmed-mona-[a-z0-9]+$/);
    });

    it('reserved slug: unavailable with suggestions', async () => {
      repo.slugsTakenAsServiceRole.mockResolvedValue([]);
      const result = await service.availability('admin');
      expect(result).toMatchObject({available: false, reason: 'reserved'});
      expect(result.suggestions[0]).toBe('admin-2026');
    });

    it('only exposes booleans/slugs, never invitation data', async () => {
      repo.slugsTakenAsServiceRole.mockResolvedValue(['ahmed-mona']);
      const result = await service.availability('ahmed-mona');
      expect(JSON.stringify(result)).not.toContain('secret');
    });
  });

  describe('publish', () => {
    it('success returns the refreshed invitation', async () => {
      repo.findById
        .mockResolvedValueOnce(ok(row()))
        .mockResolvedValueOnce(ok(row({status: 'published', published_at: U2, updated_at: U2})));
      repo.publish.mockResolvedValue(ok({ok: true, edits_left: 14}));
      const result = await service.publish(user, ID);
      expect(repo.publish).toHaveBeenCalledWith('owner-1', ID, {a: 1});
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.invitation.status).toBe('published');
      expect(revalidation.revalidateInvitation).toHaveBeenCalledTimes(1);
      expect(revalidation.revalidateInvitation).toHaveBeenCalledWith('ahmed-mona');
    });

    it('no edits left', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.publish.mockResolvedValue(ok({ok: false, reason: 'no_edits_left'}));
      await expect(service.publish(user, ID)).resolves.toEqual({ok: false, reason: 'no_edits_left'});
      expect(revalidation.revalidateInvitation).not.toHaveBeenCalled();
    });

    it('expired', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.publish.mockResolvedValue(ok({ok: false, reason: 'expired'}));
      await expect(service.publish(user, ID)).resolves.toEqual({ok: false, reason: 'expired'});
    });

    it('not_owner from SQL maps to not_found', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.publish.mockResolvedValue(ok({ok: false, reason: 'not_owner'}));
      await expect(service.publish(user, ID)).resolves.toEqual({ok: false, reason: 'not_found'});
    });

    it("someone else's invitation is not_found and never reaches the RPC", async () => {
      repo.findById.mockResolvedValue(ok(null));
      await expect(service.publish(user, ID)).resolves.toEqual({ok: false, reason: 'not_found'});
      expect(repo.publish).not.toHaveBeenCalled();
    });

    it('RPC error is a 503', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.publish.mockRejectedValue(fail('P0001'));
      await expect(service.publish(user, ID)).rejects.toThrow(ServiceUnavailableException);
      expect(revalidation.revalidateInvitation).not.toHaveBeenCalled();
    });
  });

  describe('undoPublish', () => {
    it('success returns the refreshed invitation and revalidates once', async () => {
      repo.findById.mockResolvedValue(ok(row({status: 'published'})));
      repo.undoPublish.mockResolvedValue(ok({ok: true, published_at: U1}));
      const result = await service.undoPublish(user, ID);
      expect(repo.undoPublish).toHaveBeenCalledWith('owner-1', ID);
      expect(result.ok).toBe(true);
      expect(revalidation.revalidateInvitation).toHaveBeenCalledTimes(1);
      expect(revalidation.revalidateInvitation).toHaveBeenCalledWith('ahmed-mona');
    });

    it.each(['nothing_to_undo', 'expired'])('maps %s through and never revalidates', async (reason) => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.undoPublish.mockResolvedValue(ok({ok: false, reason}));
      await expect(service.undoPublish(user, ID)).resolves.toEqual({ok: false, reason});
      expect(revalidation.revalidateInvitation).not.toHaveBeenCalled();
    });

    it('not_owner from SQL maps to not_found', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.undoPublish.mockResolvedValue(ok({ok: false, reason: 'not_owner'}));
      await expect(service.undoPublish(user, ID)).resolves.toEqual({ok: false, reason: 'not_found'});
    });

    it("someone else's invitation is not_found and never reaches the RPC", async () => {
      repo.findById.mockResolvedValue(ok(null));
      await expect(service.undoPublish(user, ID)).resolves.toEqual({ok: false, reason: 'not_found'});
      expect(repo.undoPublish).not.toHaveBeenCalled();
    });

    it('RPC error and unknown reason are 503s', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.undoPublish.mockRejectedValueOnce(fail('P0001'));
      await expect(service.undoPublish(user, ID)).rejects.toThrow(ServiceUnavailableException);
      repo.undoPublish.mockResolvedValueOnce(ok({ok: false, reason: 'weird'}));
      await expect(service.undoPublish(user, ID)).rejects.toThrow(ServiceUnavailableException);
      expect(revalidation.revalidateInvitation).not.toHaveBeenCalled();
    });
  });

  describe('switchTemplate', () => {
    it('success returns the refreshed invitation and revalidates once', async () => {
      repo.findById.mockResolvedValue(ok(row({status: 'published'})));
      repo.switchTemplate.mockResolvedValue(ok({ok: true}));
      const result = await service.switchTemplate(user, ID, 'garden');
      expect(repo.switchTemplate).toHaveBeenCalledWith('owner-1', ID, 'garden');
      expect(result.ok).toBe(true);
      expect(revalidation.revalidateInvitation).toHaveBeenCalledTimes(1);
    });

    it.each(['no_switches_left', 'tier_mismatch', 'template_not_found'])('maps %s through and never revalidates', async (reason) => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.switchTemplate.mockResolvedValue(ok({ok: false, reason}));
      await expect(service.switchTemplate(user, ID, 'garden')).resolves.toEqual({ok: false, reason});
      expect(revalidation.revalidateInvitation).not.toHaveBeenCalled();
    });

    it('not_owner from SQL maps to not_found', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.switchTemplate.mockResolvedValue(ok({ok: false, reason: 'not_owner'}));
      await expect(service.switchTemplate(user, ID, 'garden')).resolves.toEqual({ok: false, reason: 'not_found'});
    });

    it("someone else's invitation is not_found and never reaches the RPC", async () => {
      repo.findById.mockResolvedValue(ok(null));
      await expect(service.switchTemplate(user, ID, 'garden')).resolves.toEqual({ok: false, reason: 'not_found'});
      expect(repo.switchTemplate).not.toHaveBeenCalled();
    });

    it('RPC error is a 503', async () => {
      repo.findById.mockResolvedValue(ok(row()));
      repo.switchTemplate.mockRejectedValue(fail('P0001'));
      await expect(service.switchTemplate(user, ID, 'garden')).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
