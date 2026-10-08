import type {z} from 'zod';
import {createApiClient} from '@platform/api-client';
import {getServerSession, type AuthSession} from '../auth/session';
import {NotSignedInError} from '../commerce/api-errors';
import {
  adminPendingPaymentsSchema,
  adminCustomerSummarySchema,
  adminCustomerDetailSchema,
  adminConfirmResponseSchema,
  adminRejectResponseSchema,
  adminEntitlementAdjustmentResponseSchema,
  adminAdjustPointsResponseSchema,
} from './api-schemas';

export class AdminApiError extends Error {
  constructor(readonly code: string, readonly status: number, message?: string) {
    super(message ?? code);
    this.name = 'AdminApiError';
  }
}

interface LooseResult {data?: unknown; error?: unknown; response: Response}
interface LooseInit {params?: {path?: Record<string, string>; query?: Record<string, string | number>}; body?: unknown; headers?: Record<string, string>}
interface LooseClient {
  GET(path: string, init?: LooseInit): Promise<LooseResult>;
  POST(path: string, init?: LooseInit): Promise<LooseResult>;
}

function requireBaseUrl(explicit?: string): string {
  const baseUrl = explicit ?? process.env.API_BASE_URL;
  if (!baseUrl) throw new Error('API_BASE_URL is required when COMMERCE_MODE=api');
  return baseUrl.replace(/\/+$/, '');
}

function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw new AdminApiError('bad_response', 502, 'Unexpected response from the admin API');
  return result.data;
}

export interface AdminApiOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  getSession?: () => Promise<AuthSession | null>;
}

export class AdminApi {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch | undefined;
  private readonly readSession: () => Promise<AuthSession | null>;

  constructor(options: AdminApiOptions = {}) {
    this.baseUrl = requireBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetch;
    this.readSession = options.getSession ?? getServerSession;
  }

  private async call(
    method: 'GET' | 'POST',
    path: string,
    init: LooseInit = {},
    opts: {nullOn?: number[]} = {},
  ): Promise<unknown> {
    const session = await this.readSession();
    if (!session) throw new NotSignedInError();
    const client = createApiClient({
      baseUrl: this.baseUrl,
      getAccessToken: () => session.accessToken,
      ...(this.fetchImpl ? {fetch: this.fetchImpl} : {}),
    }) as unknown as LooseClient;
    
    let result: LooseResult;
    try {
      result = await client[method](path, init);
    } catch {
      throw new AdminApiError('unavailable', 503, 'The admin API is unreachable');
    }
    const {response} = result;
    if (response.ok) return result.data ?? null;
    if (response.status === 401) throw new NotSignedInError();
    if (opts.nullOn?.includes(response.status)) return null;
    if (response.status >= 500) throw new AdminApiError('unavailable', response.status);
    
    const body = result.error as {code?: unknown; message?: unknown};
    const code = typeof body?.code === 'string' ? body.code : typeof body?.message === 'string' ? body.message : 'request_failed';
    const message = typeof body?.message === 'string' ? body.message : undefined;
    throw new AdminApiError(code, response.status, message);
  }

  async getPendingPayments() {
    const data = await this.call('GET', '/v1/admin/payments/pending');
    return parse(adminPendingPaymentsSchema, data);
  }

  async confirmPayment(orderId: string, body: {paidAmountMinor: number; txnRef: string; note?: string; acceptMismatch?: boolean}) {
    const data = await this.call('POST', `/v1/admin/payments/{orderId}/confirm`, {
      params: {path: {orderId}},
      body
    });
    return parse(adminConfirmResponseSchema, data);
  }

  async rejectPayment(orderId: string, body: {reason: string}) {
    const data = await this.call('POST', `/v1/admin/payments/{orderId}/reject`, {
      params: {path: {orderId}},
      body
    });
    return parse(adminRejectResponseSchema, data);
  }

  async getCustomers(query: {q?: string; limit?: number} = {}) {
    const searchParams: Record<string, string | number> = {};
    if (query.q) searchParams.q = query.q;
    if (query.limit) searchParams.limit = query.limit;
    
    const data = await this.call('GET', '/v1/admin/customers', {params: {query: searchParams}});
    return parse(adminCustomerSummarySchema.array(), data);
  }

  async getCustomerDetail(id: string) {
    const data = await this.call('GET', `/v1/admin/customers/{id}`, {params: {path: {id}}}, {nullOn: [404]});
    if (!data) return null;
    return parse(adminCustomerDetailSchema, data);
  }

  async adjustEntitlement(id: string, body: {addEdits?: number; extendDays?: number; reason: string}) {
    const data = await this.call('POST', `/v1/admin/invitations/{id}/entitlement-adjustments`, {
      params: {path: {id}},
      body
    });
    return parse(adminEntitlementAdjustmentResponseSchema, data);
  }

  async adjustPoints(id: string, body: {delta: number; reason: string}) {
    const data = await this.call('POST', `/v1/admin/customers/{id}/points-adjustments`, {
      params: {path: {id}},
      body
    });
    return parse(adminAdjustPointsResponseSchema, data);
  }
}
