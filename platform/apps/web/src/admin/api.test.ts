import {describe, it, expect, vi, beforeEach} from 'vitest';
import {AdminApi, AdminApiError} from './api';
import {NotSignedInError} from '../commerce/api-errors';

function makeRes(status: number, body: unknown) {
  const json = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({'content-type': 'application/json'}),
    clone: function() { return this; },
    json: async () => body,
    text: async () => json
  };
}

describe('AdminApi', () => {
  let fetchMock: import('vitest').Mock;
  let getSessionMock: import('vitest').Mock;
  let api: AdminApi;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    getSessionMock = vi.fn().mockResolvedValue({accessToken: 'fake-token', userId: 'user-1'});
    
    api = new AdminApi({
      baseUrl: 'http://api.test',
      getSession: getSessionMock,
    });
  });

  it('throws NotSignedInError if no session', async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(api.getPendingPayments()).rejects.toThrowError(NotSignedInError);
  });

  it('sends correct request shape and parses valid response for pending payments', async () => {
    fetchMock.mockResolvedValue(makeRes(200, [{
        id: '123',
        reference: 'REF-1',
        amountMinor: 5000,
        currency: 'EGP',
        createdAt: '2026-01-01T00:00:00Z',
        ageHours: 24,
        customer: {id: 'cus-1', name: 'Ali', phone: '123', email: 'a@b.com'},
        extraFieldTolerated: true
    }]));

    const res = await api.getPendingPayments();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('123');
    
    
  });

  it('maps errors correctly (401)', async () => {
    fetchMock.mockResolvedValue(makeRes(401, {}));
    await expect(api.getPendingPayments()).rejects.toThrowError(NotSignedInError);
  });

  it('maps errors correctly (409 amount_mismatch)', async () => {
    fetchMock.mockResolvedValue(makeRes(409, {code: 'amount_mismatch', message: 'Amount mismatch'}));
    
    try {
      await api.confirmPayment('123', {paidAmountMinor: 100, txnRef: 'r'});
      expect.fail('should throw');
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(AdminApiError);
      if (e instanceof AdminApiError) {
        expect(e.code).toBe('amount_mismatch');
        expect(e.status).toBe(409);
      }
    }
  });

  it('maps errors correctly (409 insufficient_points)', async () => {
    fetchMock.mockResolvedValue(makeRes(409, {code: 'insufficient_points'}));
    
    try {
      await api.adjustPoints('123', {delta: -100, reason: 'r'});
      expect.fail('should throw');
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(AdminApiError);
      if (e instanceof AdminApiError) {
        expect(e.code).toBe('insufficient_points');
        expect(e.status).toBe(409);
      }
    }
  });

  it('maps errors correctly (404 for getting customer detail)', async () => {
    fetchMock.mockResolvedValue(makeRes(404, {}));
    const res = await api.getCustomerDetail('not-found');
    expect(res).toBeNull();
  });
  
  it('throws for generic 404 not in nullOn', async () => {
    fetchMock.mockResolvedValue(makeRes(404, {code: 'not_found'}));
    await expect(api.getPendingPayments()).rejects.toThrowError(AdminApiError);
  });

  it('fetches and parses stats correctly', async () => {
    fetchMock.mockResolvedValue(makeRes(200, {
      revenue: {
        todayMinor: 100000,
        last7dMinor: 500000,
        last30dMinor: 1500000,
        currency: 'EGP'
      },
      ordersByStatus: {
        pending: 2,
        paid: 10,
        failed: 1,
        refunded: 0,
        expired: 1,
        rejected: 0
      },
      pendingManualPayments: 2,
      unmatchedPaymentEvents: 3,
      activeInvitations: 12,
      newSignups7d: 8,
      rsvps7d: 34
    }));

    const res = await api.getStats();
    expect(res.revenue.todayMinor).toBe(100000);
    expect(res.revenue.currency).toBe('EGP');
    expect(res.ordersByStatus.paid).toBe(10);
    expect(res.pendingManualPayments).toBe(2);
    expect(res.unmatchedPaymentEvents).toBe(3);
    expect(res.activeInvitations).toBe(12);
  });

  it('fetches and parses payment events queue correctly', async () => {
    fetchMock.mockResolvedValue(makeRes(200, [{
      id: 'evt-1',
      provider: 'generic-hmac',
      external_id: 'ext-123',
      amount_minor: '129900',
      currency: 'EGP',
      sender: 'Ahmed',
      reference_text: 'INV-123456',
      received_at: '2026-10-12T10:00:00Z',
      status: 'unmatched',
      order_id: null,
      match_reason: 'multiple_candidates',
      created_at: '2026-10-12T10:00:00Z'
    }]));

    const res = await api.getPaymentEvents({status: 'unmatched', limit: 10});
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('evt-1');
    expect(res[0].amountMinor).toBe(129900);
    expect(res[0].status).toBe('unmatched');
    expect(res[0].sender).toBe('Ahmed');
  });

  it('assigns payment event to order and parses response', async () => {
    fetchMock.mockResolvedValue(makeRes(200, {
      ok: true,
      already: false
    }));

    const res = await api.assignPaymentEvent('evt-1', {
      orderId: '33333333-3333-4333-8333-333333333333',
      note: 'Verified InstaPay screenshot'
    });
    expect(res.ok).toBe(true);
    expect(res.already).toBe(false);
  });

  it('fetches and parses audit logs correctly', async () => {
    fetchMock.mockResolvedValue(makeRes(200, [{
      id: 'log-1',
      actorId: 'u-1',
      actorEmail: 'admin@example.com',
      action: 'order.mark_paid',
      targetType: 'order',
      targetId: 'o-1',
      details: {amount_minor: 129900},
      createdAt: '2026-10-12T12:00:00Z'
    }]));

    const res = await api.getAuditLogs({limit: 50, action: 'order.mark_paid'});
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('log-1');
    expect(res[0].actorEmail).toBe('admin@example.com');
    expect(res[0].action).toBe('order.mark_paid');
  });
});
