import {describe, expect, it} from 'vitest';
import {createGuestSubmissionService, SubmissionRateLimiter} from './submissions';
import type {GuestMessage, InvitationPublicStore, PublishedSnapshot, Rsvp} from './store';

class MemoryStore implements InvitationPublicStore {
  snapshot: PublishedSnapshot | null;
  rsvps: Rsvp[] = [];
  messages: GuestMessage[] = [];
  constructor(tier: PublishedSnapshot['tier'] = 'classic', onlineUntil = '2027-01-01T00:00:00.000Z') {
    this.snapshot = {shareSlug: 'a-b', templateSlug: 'mashrabiya', tier, couple: {first: 'A', second: 'B'}, eventDate: '2026-12-01', publishedAt: '2026-01-01T00:00:00.000Z', onlineUntil, locale: 'en'};
  }
  async publish(snapshot: PublishedSnapshot) { this.snapshot = snapshot; }
  async getBySlug(slug: string) { return slug === this.snapshot?.shareSlug ? this.snapshot : null; }
  async addRsvp(_slug: string, rsvp: Rsvp) { this.rsvps.push(rsvp); }
  async listRsvps() { return [...this.rsvps]; }
  async addMessage(_slug: string, message: GuestMessage) { this.messages.push(message); }
  async listMessages() { return [...this.messages]; }
}

const now = () => new Date('2026-10-07T12:00:00.000Z');
const validRsvp = {slug: 'a-b', name: '  Guest Name ', phone: '01012345678', attending: true, guests: 2, note: '  Vegetarian  '};

describe('guest submission service', () => {
  it('validates, trims, and normalizes RSVP input', async () => {
    const store = new MemoryStore();
    const service = createGuestSubmissionService({store, now, makeId: () => 'rsvp-1'});
    await expect(service.submitRsvp(validRsvp, 'ip')).resolves.toEqual({ok: true, code: 'submitted'});
    expect(store.rsvps[0]).toMatchObject({id: 'rsvp-1', name: 'Guest Name', phone: '+201012345678', guests: 2, note: 'Vegetarian'});
    await expect(service.submitRsvp({...validRsvp, phone: 'not-a-phone'}, 'other-ip')).resolves.toEqual({ok: false, code: 'invalid'});
    await expect(service.submitMessage({slug: 'a-b', name: '', text: 'Hello'}, 'third-ip')).resolves.toEqual({ok: false, code: 'invalid'});
  });

  it('silently accepts honeypots without writing', async () => {
    const store = new MemoryStore('premium');
    const service = createGuestSubmissionService({store, now});
    await expect(service.submitMessage({website: 'spam.example'}, 'ip')).resolves.toEqual({ok: true, code: 'accepted'});
    expect(store.messages).toHaveLength(0);
  });

  it('enforces RSVP capacity and tier feature gates', async () => {
    const store = new MemoryStore('classic');
    store.rsvps.push({id: 'existing', name: 'Party', attending: true, guests: 299, createdAt: now().toISOString()});
    const service = createGuestSubmissionService({store, now});
    await expect(service.submitRsvp({...validRsvp, guests: 2}, 'ip')).resolves.toEqual({ok: false, code: 'limit_reached'});
    await expect(service.submitMessage({slug: 'a-b', name: 'Guest', text: 'Congratulations'}, 'other-ip')).resolves.toEqual({ok: false, code: 'not_allowed'});
    const noRsvpStore = new MemoryStore('save-the-date');
    await expect(createGuestSubmissionService({store: noRsvpStore, now}).submitRsvp(validRsvp, 'ip')).resolves.toEqual({ok: false, code: 'not_allowed'});
  });

  it('rejects unknown and expired invitations', async () => {
    const store = new MemoryStore('premium', '2026-10-07T11:59:59.000Z');
    const service = createGuestSubmissionService({store, now});
    await expect(service.submitRsvp(validRsvp, 'ip')).resolves.toEqual({ok: false, code: 'expired'});
    await expect(service.submitRsvp({...validRsvp, slug: 'missing'}, 'other-ip')).resolves.toEqual({ok: false, code: 'unknown_invitation'});
  });

  it('allows five submissions per minute for an IP and slug', async () => {
    const store = new MemoryStore('premium');
    const limiter = new SubmissionRateLimiter(5, 60_000);
    const service = createGuestSubmissionService({store, limiter, now});
    for (let index = 0; index < 5; index += 1) {
      await expect(service.submitMessage({slug: 'a-b', name: `Guest ${index}`, text: 'Hello'}, 'ip')).resolves.toEqual({ok: true, code: 'submitted'});
    }
    await expect(service.submitMessage({slug: 'a-b', name: 'Sixth', text: 'Hello'}, 'ip')).resolves.toEqual({ok: false, code: 'rate_limited'});
  });
});
