import {daysOnlineLeft, remainingEdits} from '@platform/shared';
import type {Invitation} from './types';

export function meters(invitation: Invitation, now: Date) {
  const editsLeft = remainingEdits(invitation);
  return {
    editsLeft,
    editsAllowed: invitation.editsAllowed,
    editsPct: invitation.editsAllowed === 0 ? 0 : Math.round(editsLeft / invitation.editsAllowed * 100),
    daysLeft: invitation.onlineUntil ? daysOnlineLeft({onlineUntil: new Date(invitation.onlineUntil), now}) : null,
    published: invitation.status === 'published',
  };
}
