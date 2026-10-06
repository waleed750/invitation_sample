import {canPublish, computeOnlineUntil} from '@platform/shared';
import type {Invitation, PublishInvitationResult} from './types';

export function publishInvitationRecord(invitation: Invitation | undefined, now: Date): PublishInvitationResult {
  if (!invitation) return {ok: false, reason: 'not_found'};
  const firstPublishedAt = invitation.firstPublishedAt ?? now.toISOString();
  const onlineUntil = invitation.onlineUntil ?? computeOnlineUntil({
    tier: invitation.tier,
    firstPublishedAt: now,
    eventDate: new Date(invitation.eventDate),
  }).toISOString();
  const gate = canPublish({...invitation, onlineUntil: new Date(onlineUntil), now});
  if (!gate.ok) return gate;
  return {
    ok: true,
    invitation: {...invitation, status: 'published', firstPublishedAt, onlineUntil, editsUsed: invitation.editsUsed + 1},
  };
}
