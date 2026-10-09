import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {DbService} from '../database/db.service';
import type {ParsedEvent} from './payment-event-provider';
import {matchPaymentEvent} from './payment-event.matcher';

const resultSchema = z.object({
  ok: z.boolean().optional(), already: z.boolean().optional(), reason: z.string().optional(),
  amount_minor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  extra_minor: z.number().int().min(1).max(99).optional()
});
export type PaymentSqlResult = z.output<typeof resultSchema>;
export type QueueStatus = 'unmatched' | 'ambiguous' | 'matched';
const candidateSchema = z.array(z.object({
  id: z.string(), reference: z.string().nullable(),
  amountMinor: z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  extraMinor: z.number().int().min(1).max(99).nullable(), currency: z.string(),
  createdAt: z.string(), provider: z.string(), status: z.string()
}));

@Injectable()
export class PaymentEventsRepository {
  constructor(private readonly db: DbService) {}

  /** Insert + match + fulfillment commit together: failures remain retryable. */
  ingestAsServiceRole(provider: string, event: ParsedEvent, raw: string): Promise<{ok: true; duplicate?: true}> {
    return this.db.asService(async (tx) => {
      // Same lock as allocator: allocations cannot change while matching.
      await tx`select pg_advisory_xact_lock(160016::bigint)`;
      const inserted = await tx<{id: string}[]>`
        insert into public.payment_events(provider, external_id, amount_minor, currency, sender, reference_text, received_at, raw)
        values (${provider}, ${event.externalId}, ${event.amountMinor}, ${event.currency}, ${event.sender ?? null},
          ${event.referenceText ?? null}, ${event.receivedAt}::timestamptz, ${raw}::jsonb)
        on conflict (provider, external_id) do nothing returning id`;
      const row = inserted.at(0);
      if (row === undefined) return {ok: true, duplicate: true};
      const candidates = candidateSchema.parse(await tx`
        select o.id, o.provider_ref as reference, o.amount_minor::text as "amountMinor",
          a.extra_minor as "extraMinor", o.currency, o.created_at::text as "createdAt", o.provider, o.status
        from public.orders o left join public.payment_amount_allocations a on a.order_id = o.id
        where o.provider = 'manual' and o.status = 'pending' and o.created_at > now() - interval '72 hours'`);
      const match = matchPaymentEvent(event, candidates, Date.now());
      if (match.status !== 'matched') {
        await tx`update public.payment_events set status = ${match.status}, match_reason = ${match.reason} where id = ${row.id}::uuid`;
      } else {
        const confirmed = await tx<{result: unknown}[]>`
          select public.system_confirm_payment(${row.id}::uuid, ${match.orderId}::uuid, ${provider}::text) as result`;
        const result = resultSchema.parse(confirmed.at(0)?.result);
        // A competing admin confirmation may have paid the order after the snapshot.
        // Leave this independent event in the queue; never label it matched twice.
        const status = result.ok === true && result.already !== true ? 'matched' : 'unmatched';
        const reason = result.ok === true ? (result.already === true ? 'already_paid' : match.reason) : (result.reason ?? 'confirmation_refused');
        await tx`update public.payment_events set status = ${status}, match_reason = ${reason} where id = ${row.id}::uuid`;
      }
      return {ok: true};
    });
  }

  listAsServiceRole(status: QueueStatus, limit: number): Promise<Record<string, unknown>[]> {
    return this.db.asService(async (tx) => {
      // Deliberately exclude raw payloads; no signatures or API keys are stored.
      return await tx`select id, provider, external_id, amount_minor::text as amount_minor, currency,
        sender, reference_text, received_at, status, order_id, match_reason, created_at
        from public.payment_events where status = ${status} order by created_at desc, id desc limit ${limit}`;
    });
  }

  assignAsServiceRole(adminId: string, eventId: string, orderId: string, note: string): Promise<PaymentSqlResult> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{result: unknown}[]>`select public.admin_assign_payment_event(
        ${adminId}::uuid, ${eventId}::uuid, ${orderId}::uuid, ${note}::text) as result`;
      return resultSchema.parse(rows.at(0)?.result);
    });
  }

  allocateAsServiceRole(orderId: string): Promise<PaymentSqlResult> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{result: unknown}[]>`select public.allocate_unique_amount(${orderId}::uuid) as result`;
      return resultSchema.parse(rows.at(0)?.result);
    });
  }
}
