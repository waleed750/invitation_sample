import {describe, expect, it} from 'vitest';
import {meters} from './meters';
import type {Invitation} from './types';

const invitation: Invitation = {
  id: 'inv_1', orderId: 'ord_1', templateSlug: 'mashrabiya', tier: 'classic', shareSlug: 'a-b',
  couple: {first: 'A', second: 'B'}, eventDate: '2026-12-01', status: 'published',
  editsAllowed: 15, editsUsed: 8, onlineUntil: '2026-10-16T00:00:00.000Z',
};

describe('meters', () => {
  it('returns edit and online entitlement values', () => {
    expect(meters(invitation, new Date('2026-10-06T00:00:00.000Z'))).toEqual({
      editsLeft: 7, editsAllowed: 15, editsPct: 47, daysLeft: 10, published: true,
    });
  });

  it('marks an unpublished invitation without an online countdown', () => {
    expect(meters({...invitation, status: 'draft', onlineUntil: undefined}, new Date()).daysLeft).toBeNull();
  });
});
