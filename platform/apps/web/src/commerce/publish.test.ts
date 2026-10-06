import {describe, expect, it} from 'vitest';
import {computeOnlineUntil} from '@platform/shared';
import {publishInvitationRecord} from './publish';
import type {Invitation} from './types';

const now = new Date('2026-10-06T10:00:00.000Z');
const base: Invitation = {
  id: 'inv_1', orderId: 'ord_1', templateSlug: 'mashrabiya', tier: 'classic', shareSlug: 'a-b',
  couple: {first: 'A', second: 'B'}, eventDate: '2027-01-01T00:00:00.000Z', status: 'draft',
  editsAllowed: 15, editsUsed: 0,
};

describe('publishInvitationRecord', () => {
  it('reports missing, exhausted, and expired invitations', () => {
    expect(publishInvitationRecord(undefined, now)).toEqual({ok: false, reason: 'not_found'});
    expect(publishInvitationRecord({...base, editsUsed: 15}, now)).toEqual({ok: false, reason: 'no_edits_left'});
    expect(publishInvitationRecord({...base, onlineUntil: '2026-10-05T00:00:00.000Z'}, now)).toEqual({ok: false, reason: 'expired'});
  });

  it('publishes, computes the first deadline, and consumes one edit', () => {
    const result = publishInvitationRecord(base, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invitation).toMatchObject({status: 'published', editsUsed: 1, firstPublishedAt: now.toISOString()});
    expect(result.invitation.onlineUntil).toBe(computeOnlineUntil({tier: 'classic', firstPublishedAt: now, eventDate: new Date(base.eventDate)}).toISOString());
    expect(base).toMatchObject({status: 'draft', editsUsed: 0});
  });
});
