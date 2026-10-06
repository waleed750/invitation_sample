'use client';

import {createContext, useContext} from 'react';

export interface RsvpPayload {
  name: string;
  phone?: string;
  attending: boolean;
  guests: number;
  note?: string;
  website?: string;
}

export interface MessagePayload {
  name: string;
  text: string;
  website?: string;
}

export interface InvitationActionResult {ok: boolean; code?: string}
export interface InvitationActions {
  submitRsvp(payload: RsvpPayload): Promise<InvitationActionResult>;
  submitMessage(payload: MessagePayload): Promise<InvitationActionResult>;
}

export const InvitationActionsContext = createContext<InvitationActions | null>(null);
export function useInvitationActions() {
  return useContext(InvitationActionsContext);
}
