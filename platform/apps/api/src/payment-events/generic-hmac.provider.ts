import {createHmac, timingSafeEqual} from 'node:crypto';
import type {IncomingHttpHeaders} from 'node:http';
import {z} from 'zod';
import type {ParsedEvent, PaymentEventProvider} from './payment-event-provider';

export const GENERIC_FIELDS = {
  externalId: 'id', amount: 'amount', currency: 'currency', sender: 'sender',
  referenceText: 'note', receivedAt: 'received_at'
} as const;
export type EventFields = Record<keyof typeof GENERIC_FIELDS, string>;

/** Two-decimal major units; no floating-point multiplication or rounding. */
export function parseAmountMinor(value: string | number): number {
  const text = String(value).trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) throw new Error('Invalid amount');
  const [whole, fraction = ''] = text.replaceAll(',', '').split('.');
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount out of range');
  return Number(minor);
}

const parsedBody = z.object({
  externalId: z.string().trim().min(1).max(200),
  amount: z.union([z.string().max(100), z.number()]),
  currency: z.string().regex(/^[A-Z]{3}$/),
  sender: z.string().max(500).optional(),
  referenceText: z.string().max(2000).optional(),
  receivedAt: z.iso.datetime({offset: true})
});

export class GenericHmacProvider implements PaymentEventProvider {
  constructor(
    private readonly secret: string | undefined,
    private readonly signatureHeader = 'x-signature',
    private readonly timestampHeader = 'x-timestamp',
    private readonly fields: EventFields = GENERIC_FIELDS,
    private readonly now: () => number = Date.now
  ) {}

  verify(rawBody: Buffer, headers: IncomingHttpHeaders): ParsedEvent {
    if (this.secret === undefined || this.secret.trim().length < 32) throw new Error('Provider disabled');
    const timestamp = headers[this.timestampHeader.toLowerCase()];
    const signature = headers[this.signatureHeader.toLowerCase()];
    if (typeof timestamp !== 'string' || !/^\d{1,12}$/.test(timestamp) ||
        Math.abs(this.now() / 1000 - Number(timestamp)) > 300 ||
        typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
      throw new Error('Invalid notification');
    }
    const expected = createHmac('sha256', this.secret).update(`${timestamp}.`).update(rawBody).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new Error('Invalid notification');
    // Node 22+ supplies each primitive's original JSON token to the reviver.
    // Recover numeric amount tokens BEFORE decimal conversion: JSON.parse alone
    // would round 90071992547409.91 to 90071992547409.9 (one piastre lost).
    const json: unknown = JSON.parse(rawBody.toString('utf8'),
      (key: string, value: unknown, context?: {source?: string}): unknown => {
        if (key !== this.fields.amount || typeof value !== 'number') return value;
        if (context?.source === undefined) throw new Error('Numeric amount source unavailable');
        return context.source;
      });
    const record = z.record(z.string(), z.unknown()).parse(json);
    const data = parsedBody.parse(Object.fromEntries(
      Object.entries(this.fields).map(([key, field]) => [key, record[field]])
    ));
    const {amount, ...event} = data;
    return {...event, amountMinor: parseAmountMinor(amount)};
  }
}
