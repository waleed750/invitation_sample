import 'server-only';
import {ApiInvitationPublicStore} from './api-store';
import {DemoFileStore} from './demo-store';
import type {InvitationPublicStore} from './store';

let store: InvitationPublicStore | undefined;
let storeMode: string | undefined;

export function getPublicStore(): InvitationPublicStore {
  const mode = process.env.GUEST_MODE ?? 'demo';
  if (mode !== storeMode) {
    store = undefined;
    storeMode = mode;
  }
  if (mode === 'api') {
    store ??= new ApiInvitationPublicStore();
    return store;
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_COMMERCE !== '1') {
    throw new Error('Demo public invitation storage is disabled in production. Configure the future API store or explicitly set ALLOW_DEMO_COMMERCE=1.');
  }
  store ??= new DemoFileStore();
  return store;
}

export type {GuestMessage, InvitationPublicStore, PublishedSnapshot, Rsvp} from './store';
