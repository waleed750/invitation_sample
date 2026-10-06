'use client';

import type {ReactNode} from 'react';
import {InvitationActionsContext, type MessagePayload, type RsvpPayload} from '@/engine/InvitationActionsContext';
import {submitMessageAction, submitRsvpAction} from './actions';

export function PublicInvitationProvider({slug, children}: {slug: string; children: ReactNode}) {
  return <InvitationActionsContext.Provider value={{
    submitRsvp: (payload: RsvpPayload) => submitRsvpAction({slug, ...payload}),
    submitMessage: (payload: MessagePayload) => submitMessageAction({slug, ...payload}),
  }}>{children}</InvitationActionsContext.Provider>;
}
