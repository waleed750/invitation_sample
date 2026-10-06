import type {Tier} from '@platform/shared';

export interface PublishedSnapshot {
  shareSlug: string;
  templateSlug: string;
  tier: Tier;
  couple: {first: string; second: string};
  eventDate: string;
  publishedAt: string;
  onlineUntil: string;
  locale: 'ar' | 'en';
}

export interface Rsvp {
  id: string;
  name: string;
  phone?: string;
  attending: boolean;
  guests: number;
  note?: string;
  createdAt: string;
}

export interface GuestMessage {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface InvitationPublicStore {
  publish(snapshot: PublishedSnapshot): Promise<void>;
  getBySlug(shareSlug: string): Promise<PublishedSnapshot | null>;
  addRsvp(shareSlug: string, rsvp: Rsvp): Promise<void>;
  listRsvps(shareSlug: string): Promise<Rsvp[]>;
  addMessage(shareSlug: string, message: GuestMessage): Promise<void>;
  listMessages(shareSlug: string): Promise<GuestMessage[]>;
}
