'use server';

import {headers} from 'next/headers';
import {getPublicStore} from './index';
import {createGuestSubmissionService, type GuestActionResult} from './submissions';

let service: ReturnType<typeof createGuestSubmissionService> | undefined;
function getService() {
  service ??= createGuestSubmissionService({store: getPublicStore()});
  return service;
}

async function clientIdentity(): Promise<string> {
  const requestHeaders = await headers();
  return requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    || requestHeaders.get('x-real-ip')?.trim()
    || 'unknown';
}

export async function submitRsvpAction(input: unknown): Promise<GuestActionResult> {
  try {
    return await getService().submitRsvp(input, await clientIdentity());
  } catch {
    return {ok: false, code: 'storage_error'};
  }
}

export async function submitMessageAction(input: unknown): Promise<GuestActionResult> {
  try {
    return await getService().submitMessage(input, await clientIdentity());
  } catch {
    return {ok: false, code: 'storage_error'};
  }
}
