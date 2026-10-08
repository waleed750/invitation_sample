import {TIERS} from '@platform/shared';
import {z} from 'zod';
import {normalizeEgyptPhone} from '../commerce/phone';
import {ApiStoreError} from './api-store';
import type {InvitationPublicStore} from './store';

const slug = z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
const optionalTrimmed = (limit: number) => z.string().max(limit).transform((value) => value.trim()).optional();
const rsvpSchema = z.object({
  slug,
  name: z.string().transform((value) => value.trim()).pipe(z.string().min(1).max(80)),
  phone: optionalTrimmed(40),
  attending: z.boolean(),
  guests: z.coerce.number().int().min(1).max(20),
  note: optionalTrimmed(300),
  website: z.string().max(200).optional(),
}).strict();
const messageSchema = z.object({
  slug,
  name: z.string().transform((value) => value.trim()).pipe(z.string().min(1).max(80)),
  text: z.string().transform((value) => value.trim()).pipe(z.string().min(1).max(500)),
  website: z.string().max(200).optional(),
}).strict();

export type GuestActionCode = 'submitted' | 'accepted' | 'invalid' | 'unknown_invitation' | 'expired' | 'rate_limited' | 'not_allowed' | 'limit_reached' | 'storage_error';
export type GuestActionResult = {ok: true; code: 'submitted' | 'accepted'} | {ok: false; code: Exclude<GuestActionCode, 'submitted' | 'accepted'>};
type InvitationGate = {result: GuestActionResult} | {snapshot: NonNullable<Awaited<ReturnType<InvitationPublicStore['getBySlug']>>>; instant: Date};

export class SubmissionRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly max = 5, private readonly windowMs = 60_000) {}

  allow(key: string, now: number): boolean {
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => now - timestamp < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

function honeypotFilled(input: unknown): boolean {
  return !!input && typeof input === 'object' && typeof (input as {website?: unknown}).website === 'string'
    && (input as {website: string}).website.trim().length > 0;
}

/** Translates coded store failures (thrown by the API store) into results. */
async function persist(operation: () => Promise<void>): Promise<GuestActionResult> {
  try {
    await operation();
    return {ok: true, code: 'submitted'};
  } catch (error) {
    if (error instanceof ApiStoreError) return {ok: false, code: error.actionCode};
    throw error;
  }
}

export function createGuestSubmissionService({
  store,
  limiter = new SubmissionRateLimiter(),
  now = () => new Date(),
  makeId = () => crypto.randomUUID(),
}: {
  store: InvitationPublicStore;
  limiter?: SubmissionRateLimiter;
  now?: () => Date;
  makeId?: () => string;
}) {
  let queue = Promise.resolve();
  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };

  async function invitationGate(shareSlug: string, identity: string): Promise<InvitationGate> {
    const instant = now();
    if (!limiter.allow(`${identity}:${shareSlug}`, instant.getTime())) return {result: {ok: false, code: 'rate_limited'} as GuestActionResult};
    const snapshot = await store.getBySlug(shareSlug);
    if (!snapshot) return {result: {ok: false, code: 'unknown_invitation'} as GuestActionResult};
    if (instant.getTime() > new Date(snapshot.onlineUntil).getTime()) return {result: {ok: false, code: 'expired'} as GuestActionResult};
    return {snapshot, instant};
  }

  return {
    async submitRsvp(input: unknown, identity: string): Promise<GuestActionResult> {
      if (honeypotFilled(input)) return {ok: true, code: 'accepted'};
      const parsed = rsvpSchema.safeParse(input);
      if (!parsed.success) return {ok: false, code: 'invalid'};
      let phone: string | undefined;
      if (parsed.data.phone) {
        const normalized = normalizeEgyptPhone(parsed.data.phone);
        if (!normalized) return {ok: false, code: 'invalid'};
        phone = normalized;
      }
      return serial(async () => {
        const gate = await invitationGate(parsed.data.slug, identity);
        if ('result' in gate) return gate.result;
        const limit = TIERS[gate.snapshot.tier].rsvpLimit;
        if (limit === 0) return {ok: false, code: 'not_allowed'};
        if (parsed.data.attending && limit !== null) {
          const acceptedGuests = (await store.listRsvps(parsed.data.slug))
            .filter((rsvp) => rsvp.attending)
            .reduce((sum, rsvp) => sum + rsvp.guests, 0);
          if (acceptedGuests + parsed.data.guests > limit) return {ok: false, code: 'limit_reached'};
        }
        return persist(() => store.addRsvp(parsed.data.slug, {
          id: makeId(), name: parsed.data.name, phone, attending: parsed.data.attending,
          guests: parsed.data.guests, note: parsed.data.note || undefined, createdAt: gate.instant.toISOString(),
        }));
      });
    },

    async submitMessage(input: unknown, identity: string): Promise<GuestActionResult> {
      if (honeypotFilled(input)) return {ok: true, code: 'accepted'};
      const parsed = messageSchema.safeParse(input);
      if (!parsed.success) return {ok: false, code: 'invalid'};
      return serial(async () => {
        const gate = await invitationGate(parsed.data.slug, identity);
        if ('result' in gate) return gate.result;
        if (!TIERS[gate.snapshot.tier].guestMessages) return {ok: false, code: 'not_allowed'};
        return persist(() => store.addMessage(parsed.data.slug, {
          id: makeId(), name: parsed.data.name, text: parsed.data.text, createdAt: gate.instant.toISOString(),
        }));
      });
    },
  };
}
