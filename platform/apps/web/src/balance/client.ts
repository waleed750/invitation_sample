/** Browser-side calls (the sign-in cookie travels with them). */
import type {Balance, PayResult, TopupWithInstructions} from './types';

export class BalanceClientError extends Error {
  constructor(readonly code: string, readonly status: number, readonly details: Record<string, unknown> = {}) {
    super(code);
    this.name = 'BalanceClientError';
  }
}

function base(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base()}${path}`, {
      method,
      credentials: 'include',
      cache: 'no-store',
      ...(body === undefined ? {} : {headers: {'content-type': 'application/json'}, body: JSON.stringify(body)}),
    });
  } catch {
    throw new BalanceClientError('network', 0);
  }
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // empty body
  }
  if (!response.ok) {
    const error = (data as {error?: Record<string, unknown>} | null)?.error ?? {};
    throw new BalanceClientError(typeof error.code === 'string' ? error.code : 'generic', response.status, error);
  }
  return data as T;
}

export const fetchBalance = () => call<Balance>('GET', '/v1/balance');
export const createTopup = (amountMinor: number) => call<TopupWithInstructions>('POST', '/v1/balance/topups', {amountMinor});
export const payWithBalance = (orderId: string) => call<PayResult>('POST', `/v1/orders/${encodeURIComponent(orderId)}/pay-with-balance`, {});
export const cancelAwaitingOrder = (orderId: string) => call<{ok: true}>('POST', `/v1/orders/${encodeURIComponent(orderId)}/cancel`, {});
