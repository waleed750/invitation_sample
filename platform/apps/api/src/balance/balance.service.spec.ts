/* eslint-disable */
import {BadRequestException, ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {BalanceService} from './balance.service';

const user = {id: 'u1', jwt: 'u1'} as any;
const logger = {error: jest.fn()} as any;

function build(over: Record<string, jest.Mock> = {}, notifications?: any) {
  const repo: Record<string, jest.Mock> = {
    balance: jest.fn().mockResolvedValue(50000),
    settings: jest.fn().mockResolvedValue({min_topup_minor: 10000, max_topup_minor: 5000000, bonus_percent: 0, bonus_min_topup_minor: 0}),
    awaitingOrders: jest.fn().mockResolvedValue([]),
    ledger: jest.fn().mockResolvedValue([]),
    topups: jest.fn().mockResolvedValue([]),
    createTopup: jest.fn(), payOrder: jest.fn(), cancelOrder: jest.fn(), pendingTopups: jest.fn(), confirmTopup: jest.fn(),
    rejectTopup: jest.fn(), adjustCredit: jest.fn(), refundToBalance: jest.fn(),
    ...over
  };
  const config = {manualPaymentInstructions: {methods: [{id: 'instapay'}]}} as any;
  return {service: new BalanceService(repo as any, config, logger, notifications), repo};
}

describe('BalanceService', () => {
  it('reports the balance, settings and what the awaiting orders still need', async () => {
    const {service} = build({
      awaitingOrders: jest.fn().mockResolvedValue([
        {id: 'o1', tier: 'classic', amount_minor: 129900, currency: 'EGP', created_at: 't1', template: {slug: 'diwan'}},
        {id: 'o2', tier: 'premium', amount_minor: 249900, currency: 'EGP', created_at: 't2', template: null}
      ])
    });
    const result = await service.get(user);
    expect(result).toMatchObject({balanceMinor: 50000, currency: 'EGP', minTopupMinor: 10000, shortfallMinor: 129900 + 249900 - 50000});
    expect(result.awaitingOrders[0]).toMatchObject({id: 'o1', templateSlug: 'diwan', amountMinor: 129900});
    expect(result.awaitingOrders[1]?.templateSlug).toBeNull();
  });

  it('shortfall is zero when the balance covers everything', async () => {
    const {service} = build({balance: jest.fn().mockResolvedValue(10_000_000)});
    expect((await service.get(user)).shortfallMinor).toBe(0);
  });

  it('creates a top-up and returns the exact amount plus the payment instructions', async () => {
    const {service, repo} = build();
    repo.createTopup.mockResolvedValue({ok: true, id: 't1', reference: 'TOP-ABC234', amount_minor: 20000, expected_minor: 20007, expires_at: 'x'});
    const result = await service.createTopup(user, {amountMinor: 20000});
    expect(result).toMatchObject({reference: 'TOP-ABC234', expectedMinor: 20007, status: 'pending', instructions: {methods: [{id: 'instapay'}]}});
    expect(repo.createTopup).toHaveBeenCalledWith('u1', 20000);
  });

  it('refuses a top-up below the minimum with the minimum in the body', async () => {
    const {service, repo} = build();
    repo.createTopup.mockResolvedValue({ok: false, reason: 'below_minimum', min_minor: 10000});
    const error = await service.createTopup(user, {amountMinor: 5000}).catch((e) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getResponse()).toMatchObject({code: 'below_minimum', minMinor: 10000});
  });

  it('pays an order from the balance', async () => {
    const {service, repo} = build();
    repo.payOrder.mockResolvedValue({ok: true, balance_minor: 1000});
    expect(await service.payOrder(user, 'o1')).toEqual({paid: true, orderId: 'o1', status: 'paid', balanceMinor: 1000, shortfallMinor: 0});
  });

  it('parks the order as awaiting balance (200, not an error) when the balance is too low', async () => {
    const {service, repo} = build();
    repo.payOrder.mockResolvedValue({ok: false, reason: 'insufficient_balance', balance_minor: 100, shortfall_minor: 5000});
    expect(await service.payOrder(user, 'o1')).toEqual({paid: false, orderId: 'o1', status: 'awaiting_balance', balanceMinor: 100, shortfallMinor: 5000});
  });

  it('404s for an order that is not the caller\'s and 409s for one that cannot be paid', async () => {
    const {service, repo} = build();
    repo.payOrder.mockResolvedValueOnce({ok: false, reason: 'not_found'});
    await expect(service.payOrder(user, 'o1')).rejects.toBeInstanceOf(NotFoundException);
    repo.payOrder.mockResolvedValueOnce({ok: false, reason: 'not_payable', status: 'refunded'});
    await expect(service.payOrder(user, 'o1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancels an awaiting order', async () => {
    const {service, repo} = build();
    repo.cancelOrder.mockResolvedValue({ok: true});
    expect(await service.cancelOrder(user, 'o1')).toEqual({ok: true});
    repo.cancelOrder.mockResolvedValue({ok: false, reason: 'not_cancellable', status: 'paid'});
    await expect(service.cancelOrder(user, 'o1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('reports a light order status for the waiting screen, and 404s for orders that are not the caller\'s', async () => {
    const {service, repo} = build();
    repo.orderStatus = jest.fn().mockResolvedValueOnce({id: 'o1', status: 'paid', amount_minor: 129900, currency: 'EGP', invitation_id: 'i1', invitation_slug: 'sara-ali'});
    expect(await service.orderStatus(user, 'o1')).toEqual({orderId: 'o1', status: 'paid', paid: true, amountMinor: 129900, currency: 'EGP', invitationId: 'i1', invitationSlug: 'sara-ali'});
    repo.orderStatus.mockResolvedValueOnce({id: 'o2', status: 'awaiting_balance', amount_minor: 100, currency: 'EGP', invitation_id: null, invitation_slug: null});
    expect((await service.orderStatus(user, 'o2')).paid).toBe(false);
    repo.orderStatus.mockResolvedValueOnce(null);
    await expect(service.orderStatus(user, 'o3')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('never leaks database errors: anything unexpected is a 503', async () => {
    const {service, repo} = build();
    repo.balance.mockRejectedValue(new Error('relation "profiles" does not exist'));
    const error = await service.get(user).catch((e) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(JSON.stringify(error.getResponse())).not.toContain('relation');
    repo.payOrder.mockResolvedValue({ok: false, reason: 'weird'});
    await expect(service.payOrder(user, 'o1')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  describe('admin', () => {
    it('confirms a top-up, reports the orders it paid and emails them (best effort)', async () => {
      const notifications = {paymentConfirmed: jest.fn().mockRejectedValueOnce(new Error('smtp down')).mockResolvedValue(undefined)};
      const {service, repo} = build({}, notifications);
      repo.confirmTopup.mockResolvedValue({ok: true, already: false, paid_order_ids: ['o1', 'o2'], bonus_minor: 500});
      const result = await service.confirmTopup('admin', 't1', {paidAmountMinor: 20007, txnRef: 'X'} as any);
      expect(result).toEqual({ok: true, already: false, paidOrderIds: ['o1', 'o2'], bonusMinor: 500});
      expect(notifications.paymentConfirmed).toHaveBeenCalledTimes(2);
      expect(repo.confirmTopup).toHaveBeenCalledWith({adminId: 'admin', topupId: 't1', paidMinor: 20007, txnRef: 'X', note: null, acceptMismatch: false});
    });

    it('maps refusals: mismatch 409 with amounts, not admin 403, unknown 404', async () => {
      const {service, repo} = build();
      repo.confirmTopup.mockResolvedValueOnce({ok: false, reason: 'amount_mismatch', expected_minor: 100, received_minor: 90});
      const mismatch = await service.confirmTopup('admin', 't1', {paidAmountMinor: 90, txnRef: 'X'} as any).catch((e) => e);
      expect(mismatch).toBeInstanceOf(ConflictException);
      expect(mismatch.getResponse()).toMatchObject({code: 'amount_mismatch', expectedMinor: 100, receivedMinor: 90});
      repo.confirmTopup.mockResolvedValueOnce({ok: false, reason: 'not_admin'});
      await expect(service.confirmTopup('x', 't1', {paidAmountMinor: 1, txnRef: 'X'} as any)).rejects.toBeInstanceOf(ForbiddenException);
      repo.confirmTopup.mockResolvedValueOnce({ok: false, reason: 'not_found'});
      await expect(service.confirmTopup('admin', 't1', {paidAmountMinor: 1, txnRef: 'X'} as any)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects, adjusts and refunds to balance', async () => {
      const {service, repo} = build();
      repo.rejectTopup.mockResolvedValue({ok: true});
      expect(await service.rejectTopup('admin', 't1', {reason: 'no transfer'} as any)).toEqual({ok: true});
      repo.adjustCredit.mockResolvedValue({ok: true, balance_minor: 700});
      expect(await service.adjustCredit('admin', {userId: 'u', deltaMinor: 700, note: 'goodwill'} as any)).toEqual({ok: true, balanceMinor: 700});
      repo.refundToBalance.mockResolvedValue({ok: true, already: false, refunded_minor: 129900});
      expect(await service.refundToBalance('admin', 'o1', {note: 'asked'} as any)).toEqual({ok: true, already: false, refundedMinor: 129900});
    });
  });
});
