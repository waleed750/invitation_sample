import 'server-only';
import {getServerSession} from '@/auth/session';
import {NotSignedInError} from '@/commerce/api-errors';
import type {Balance, LedgerItem, PendingTopup, Topup} from './types';

export class BalanceApiError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = 'BalanceApiError';
  }
}

function base(): string {
  const url = process.env.API_BASE_URL;
  if (!url) throw new Error('API_BASE_URL is required when COMMERCE_MODE=api');
  return url.replace(/\/+$/, '');
}

/** Calls the API as the signed-in user (bearer token from the session). */
export async function apiCall<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const session = await getServerSession();
  if (!session) throw new NotSignedInError();
  let response: Response;
  try {
    response = await fetch(`${base()}${path}`, {
      method,
      cache: 'no-store',
      headers: {authorization: `Bearer ${session.accessToken}`, ...(body === undefined ? {} : {'content-type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
  } catch {
    throw new BalanceApiError('unavailable', 503);
  }
  if (response.status === 401) throw new NotSignedInError();
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // empty body
  }
  if (!response.ok) {
    const code = (data as {error?: {code?: unknown}} | null)?.error?.code;
    throw new BalanceApiError(typeof code === 'string' ? code : 'request_failed', response.status);
  }
  return data as T;
}

export const getBalance = () => apiCall<Balance>('GET', '/v1/balance');
export const getLedger = () => apiCall<{items: LedgerItem[]; nextBefore: string | null}>('GET', '/v1/balance/ledger?limit=30');
export const getTopups = () => apiCall<Topup[]>('GET', '/v1/balance/topups');
export const getPendingTopups = () => apiCall<PendingTopup[]>('GET', '/v1/admin/topups/pending');

/** GET that returns the body as text (CSV exports), as the signed-in user. */
export async function apiText(path: string): Promise<string> {
  const session = await getServerSession();
  if (!session) throw new NotSignedInError();
  let response: Response;
  try {
    response = await fetch(`${base()}${path}`, {cache: 'no-store', headers: {authorization: `Bearer ${session.accessToken}`}});
  } catch {
    throw new BalanceApiError('unavailable', 503);
  }
  if (response.status === 401) throw new NotSignedInError();
  if (!response.ok) throw new BalanceApiError('request_failed', response.status);
  return response.text();
}
