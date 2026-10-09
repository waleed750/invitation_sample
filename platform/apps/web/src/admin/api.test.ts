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
});
