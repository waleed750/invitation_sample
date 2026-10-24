import type {DbService, Tx} from '../database/db.service';
import type {ParsedEvent} from './payment-event-provider';
import {PaymentEventsRepository} from './payment-events.repository';

const ID = '16000000-0000-4000-8000-000000000001';
const event: ParsedEvent = {externalId: "txn'); drop table orders; --", amountMinor: 129937, currency: 'EGP', receivedAt: new Date().toISOString()};
const candidate = {id: ID, reference: 'INV-L30001', amountMinor: '129900', extraMinor: 37, currency: 'EGP', createdAt: new Date(Date.now() - 3600_000).toISOString(), provider: 'manual', status: 'pending'};
function setup(responses: unknown[], topups: {id: string}[] = [], orderClash: {id: string}[] = []) {
  const calls: {sql: string; params: unknown[]}[] = [];
  const tx = jest.fn((strings: TemplateStringsArray, ...params: unknown[]) => {
    const sql = strings.join('?');
    // The top-up lookups added in T13 are answered here so the order-flow expectations below stay positional.
    if (sql.includes('from public.credit_topups')) return Promise.resolve(topups);
    if (sql.includes('payment_amount_allocations a on a.order_id = o.id') && sql.includes('o.amount_minor + coalesce')) return Promise.resolve(orderClash);
    calls.push({sql, params});
    return Promise.resolve(responses.shift());
  });
  const asService = jest.fn(async (fn: (tx: Tx) => Promise<unknown>) => fn(tx as unknown as Tx));
  const repository = new PaymentEventsRepository({asService} as unknown as DbService);
  return {repository, calls, asService, tx};
}

describe('PaymentEventsRepository top-up matching (T13)', () => {
  it('confirms the single pending top-up whose total matches exactly', async () => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], [{result: {ok: true, paid_order_ids: []}}]], [{id: 'topup-1'}]);
    await expect(repository.ingestAsServiceRole('generic-hmac', event, '{}')).resolves.toEqual({ok: true});
    const confirm = calls.find((call) => call.sql.includes('system_confirm_topup'));
    expect(confirm?.params).toEqual(['event-id', 'topup-1', 'generic-hmac']);
    expect(calls.some((call) => call.sql.includes('system_confirm_payment'))).toBe(false);
  });
  it('queues the event as ambiguous when a top-up and an order share the amount, confirming nothing', async () => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], []], [{id: 'topup-1'}], [{id: 'order-1'}]);
    await repository.ingestAsServiceRole('generic-hmac', event, '{}');
    expect(calls.some((call) => call.sql.includes('system_confirm'))).toBe(false);
    expect(calls.some((call) => call.sql.includes("'ambiguous'") && call.sql.includes('topup_amount_clash'))).toBe(true);
  });
  it('queues the event when two top-ups share the amount', async () => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], []], [{id: 'a'}, {id: 'b'}]);
    await repository.ingestAsServiceRole('generic-hmac', event, '{}');
    expect(calls.some((call) => call.sql.includes('system_confirm'))).toBe(false);
  });
  it('leaves the event unmatched when the top-up confirmation is refused', async () => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], [{result: {ok: false, reason: 'outside_window'}}], []], [{id: 'topup-1'}]);
    await repository.ingestAsServiceRole('generic-hmac', event, '{}');
    const update = calls.find((call) => call.sql.includes("status = 'unmatched'") && call.sql.includes('match_reason'));
    expect(update?.params).toEqual(['outside_window', 'event-id']);
  });
});

describe('PaymentEventsRepository service-role transactions', () => {
  it('short circuits duplicate IDs before matching or confirming', async () => {
    const {repository, calls, asService} = setup([[], []]);
    await expect(repository.ingestAsServiceRole('generic-hmac', event, '{}')).resolves.toEqual({ok: true, duplicate: true});
    expect(asService).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
    expect(calls[1].sql).toContain('on conflict (provider, external_id) do nothing');
    expect(calls[1].sql).not.toContain(event.externalId);
    expect(calls[1].params).toContain(event.externalId);
  });
  it('inserts, matches, fulfills and marks reason inside ONE transaction', async () => {
    const {repository, calls, asService} = setup([[], [{id: 'event-id'}], [candidate], [{result: {ok: true, already: false}}], []]);
    await expect(repository.ingestAsServiceRole('generic-hmac', event, '{}')).resolves.toEqual({ok: true});
    expect(asService).toHaveBeenCalledTimes(1);
    expect(calls[3].sql).toContain('system_confirm_payment');
    expect(calls[3].params).toEqual(['event-id', ID, 'generic-hmac']);
    expect(calls[4].params).toEqual(['matched', 'unique_amount', 'event-id']);
  });
  it('keeps unmatched events in queue without a fulfillment call', async () => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], [], []]);
    await repository.ingestAsServiceRole('generic-hmac', event, '{}');
    expect(calls).toHaveLength(4);
    expect(calls[3].params).toEqual(['unmatched', 'no_match', 'event-id']);
  });
  it('keeps ambiguous events in queue', async () => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], [candidate, {...candidate, id: 'two'}], []]);
    await repository.ingestAsServiceRole('generic-hmac', event, '{}');
    expect(calls[3].params).toEqual(['ambiguous', 'multiple_amount_matches', 'event-id']);
  });
  it.each([
    [{ok: false, reason: 'not_pending'}, 'not_pending'],
    [{ok: true, already: true}, 'already_paid']
  ])('leaves concurrent confirmation outcomes in queue: %s', async (result, reason) => {
    const {repository, calls} = setup([[], [{id: 'event-id'}], [candidate], [{result}], []]);
    await repository.ingestAsServiceRole('generic-hmac', event, '{}');
    expect(calls[4].params).toEqual(['unmatched', reason, 'event-id']);
  });
  it('propagates SQL failure out of the transaction for rollback and provider retry', async () => {
    const {repository, tx} = setup([[], [{id: 'event-id'}], [candidate]]);
    tx.mockImplementationOnce(() => Promise.resolve([]))
      .mockImplementationOnce(() => Promise.resolve([{id: 'event-id'}]))
      .mockImplementationOnce(() => Promise.resolve([candidate]))
      .mockImplementationOnce(() => Promise.reject(new Error('fulfillment failed')));
    await expect(repository.ingestAsServiceRole('generic-hmac', event, '{}')).rejects.toThrow('fulfillment failed');
  });
  it('binds queue filtering and limit and excludes raw', async () => {
    const {repository, calls} = setup([[]]);
    await repository.listAsServiceRole('unmatched', 50);
    expect(calls[0].params).toEqual(['unmatched', 50]); expect(calls[0].sql).not.toContain(' raw');
  });
  it('binds admin RPC parameters', async () => {
    const {repository, calls} = setup([[{result: {ok: true}}]]);
    await repository.assignAsServiceRole('admin', 'event', ID, "Don't interpolate this");
    expect(calls[0].params).toEqual(['admin', 'event', ID, "Don't interpolate this"]);
    expect(calls[0].sql).toContain('admin_assign_payment_event');
  });
  it('decodes allocation JSON', async () => {
    const {repository, calls} = setup([[{result: {amount_minor: 129937, extra_minor: 37}}]]);
    await expect(repository.allocateAsServiceRole(ID)).resolves.toEqual({amount_minor: 129937, extra_minor: 37});
    expect(calls[0].params).toEqual([ID]);
  });
});
