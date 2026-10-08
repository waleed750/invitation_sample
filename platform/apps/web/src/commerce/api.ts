import type {z} from 'zod';
import {createApiClient} from '@platform/api-client';
import type {Level} from '@platform/shared';
import {getServerSession, type AuthSession} from '../auth/session';
import {ApiError, NotSignedInError} from './api-errors';
import {
  apiErrorBodySchema,
  checkoutResponseSchema,
  invitationDetailSchema,
  invitationSummariesSchema,
  manualPaymentSchema,
  mapCheckoutOrder,
  mapInvitationDetail,
  mapInvitationSummary,
  mapManualPayment,
  mapOrder,
  mapPoints,
  mapPublishResult,
  meSchema,
  orderSchema,
  ordersSchema,
  pointsSchema,
  publishResultSchema,
  type ApiInvitationSummary,
} from './api-schemas';
import type {
  CommerceClient,
  Invitation,
  ManualPayment,
  Order,
  PointsLedgerEntry,
  PublishInvitationResult,
  Session,
  StartCheckoutInput,
} from './types';

export {ApiError, NotSignedInError} from './api-errors';

/** Remembers the manual-payment block between checkout and the pay page (the orders endpoint does not return it). */
export interface PaymentStash {
  save(orderId: string, payment: ManualPayment): Promise<void>;
  load(orderId: string): Promise<ManualPayment | null>;
}

const PAYMENT_COOKIE_PREFIX = 'inv_pay_';

export const cookiePaymentStash: PaymentStash = {
  async save(orderId, payment) {
    try {
      const {cookies} = await import('next/headers');
      (await cookies()).set(`${PAYMENT_COOKIE_PREFIX}${orderId}`, Buffer.from(JSON.stringify(payment), 'utf8').toString('base64url'), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 3,
      });
    } catch {
      // Not in a context that may set cookies; the pay page falls back to reference + amount only.
    }
  },
  async load(orderId) {
    try {
      const {cookies} = await import('next/headers');
      const value = (await cookies()).get(`${PAYMENT_COOKIE_PREFIX}${orderId}`)?.value;
      if (!value) return null;
      const parsed = manualPaymentSchema.safeParse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
      return parsed.success ? mapManualPayment(parsed.data) : null;
    } catch {
      return null;
    }
  },
};

export interface ApiCommerceClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  getSession?: () => Promise<AuthSession | null>;
  paymentStash?: PaymentStash;
  idempotencyKey?: () => string;
}

interface LooseResult {data?: unknown; error?: unknown; response: Response}
interface LooseInit {params?: {path?: Record<string, string>}; body?: unknown; headers?: Record<string, string>}
interface LooseClient {
  GET(path: string, init?: LooseInit): Promise<LooseResult>;
  POST(path: string, init?: LooseInit): Promise<LooseResult>;
}

function requireBaseUrl(explicit?: string): string {
  const baseUrl = explicit ?? process.env.API_BASE_URL;
  if (!baseUrl) throw new Error('API_BASE_URL is required when COMMERCE_MODE=api (for example https://api.example.com).');
  return baseUrl.replace(/\/+$/, '');
}

function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError('bad_response', 502, 'Unexpected response from the commerce API');
  return result.data;
}

export class ApiCommerceClient implements CommerceClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch | undefined;
  private readonly readSession: () => Promise<AuthSession | null>;
  private readonly stash: PaymentStash;
  private readonly newKey: () => string;

  constructor(options: ApiCommerceClientOptions = {}) {
    this.baseUrl = requireBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetch;
    this.readSession = options.getSession ?? getServerSession;
    this.stash = options.paymentStash ?? cookiePaymentStash;
    this.newKey = options.idempotencyKey ?? (() => crypto.randomUUID());
  }

  /** Performs a request and returns the parsed-JSON body, or throws NotSignedInError / ApiError. 404 returns `notFound`. */
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
      throw new ApiError('unavailable', 503, 'The commerce API is unreachable');
    }
    const {response} = result;
    if (response.ok) return result.data ?? null;
    if (response.status === 401) throw new NotSignedInError();
    if (opts.nullOn?.includes(response.status)) return null;
    if (response.status >= 500) throw new ApiError('unavailable', response.status);
    const body = apiErrorBodySchema.safeParse(result.error);
    throw new ApiError(body.success ? body.data.error.code : 'request_failed', response.status, body.success ? body.data.error.message : undefined);
  }

  async getSession(): Promise<Session | null> {
    const session = await this.readSession();
    if (!session) return null;
    let locale = 'ar';
    try {
      const me = await this.call('GET', '/v1/me');
      locale = parse(meSchema, me).preferred_locale;
    } catch {
      // Locale is a nicety; a profile hiccup must not sign the user out.
    }
    return {phone: session.phone ?? session.email ?? session.userId, locale};
  }

  async signOut(): Promise<void> {
    // Sign-out is handled by the auth layer (Supabase); nothing to do against the commerce API.
  }

  async sendOtp(): Promise<{ok: true}> {
    throw new Error('sendOtp is not used in api mode; sign in via Supabase.');
  }

  async verifyOtp(): Promise<Session> {
    throw new Error('verifyOtp is not used in api mode; sign in via Supabase.');
  }

  async startCheckout(input: StartCheckoutInput): Promise<Order> {
    // The checkout endpoint takes the web tier names ('save-the-date'); the DB spelling only appears in SQL.
    const body = {
      templateSlug: input.templateSlug,
      tier: input.tier,
      kind: input.kind,
      method: input.method,
      ...(input.couponCode ? {couponCode: input.couponCode} : {}),
      ...(input.pointsToRedeem ? {pointsToRedeem: input.pointsToRedeem} : {}),
      couple: input.couple,
      // The API wants an offset datetime; noon in Cairo keeps the calendar date stable in every time zone.
      eventDate: /^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) ? `${input.eventDate}T12:00:00+02:00` : input.eventDate,
    };
    const data = parse(checkoutResponseSchema, await this.call('POST', '/v1/checkout', {
      body,
      headers: {'Idempotency-Key': this.newKey()},
    }));
    const order = mapCheckoutOrder(data, input);
    if (order.payment) await this.stash.save(order.id, order.payment);
    return order;
  }

  async getOrder(id: string): Promise<Order | null> {
    const data = await this.call('GET', '/v1/orders/{id}', {params: {path: {id}}}, {nullOn: [404, 400, 422]});
    if (data === null) return null;
    const raw = parse(orderSchema, data);
    const stashed = raw.provider === 'manual' && raw.status === 'pending' ? await this.stash.load(id) : null;
    return mapOrder(raw, stashed ?? undefined);
  }

  async listOrders(): Promise<Order[]> {
    return parse(ordersSchema, await this.call('GET', '/v1/orders')).map((order) => mapOrder(order));
  }

  async simulatePayment(orderId: string, outcome: 'succeed' | 'fail' | 'fawry_reference' | 'fawry_paid'): Promise<Order> {
    if (outcome !== 'succeed' && outcome !== 'fail') {
      throw new ApiError('unsupported', 400, `Payment outcome "${outcome}" is not supported in api mode`);
    }
    const result = await this.call('POST', `/v1/dev/payments/mock/{orderId}/${outcome}`, {params: {path: {orderId}}}, {nullOn: [403, 404]});
    if (result === null) throw new ApiError('mock_payments_unavailable', 404, 'The API does not expose mock payments');
    const order = await this.getOrder(orderId);
    if (!order) throw new ApiError('not_found', 404);
    return order;
  }

  private async summaries(): Promise<ApiInvitationSummary[]> {
    return parse(invitationSummariesSchema, await this.call('GET', '/v1/invitations'));
  }

  async listInvitations(): Promise<Invitation[]> {
    return (await this.summaries()).map(mapInvitationSummary);
  }

  async getInvitation(id: string): Promise<Invitation | null> {
    const data = await this.call('GET', '/v1/invitations/{id}', {params: {path: {id}}}, {nullOn: [404, 400, 422]});
    if (data === null) return null;
    const detail = parse(invitationDetailSchema, data);
    const summary = (await this.summaries()).find((item) => item.id === id);
    return mapInvitationDetail(detail, summary);
  }

  async publishInvitation(id: string): Promise<PublishInvitationResult> {
    const data = await this.call('POST', '/v1/invitations/{id}/publish', {params: {path: {id}}}, {nullOn: [404]});
    if (data === null) return {ok: false, reason: 'not_found'};
    const result = parse(publishResultSchema, data);
    const summary = result.ok ? (await this.summaries()).find((item) => item.id === id) : undefined;
    return mapPublishResult(result, summary);
  }

  async getPoints(): Promise<{balance: number; purchaseCount: number; level: Level; ledger: PointsLedgerEntry[]}> {
    return mapPoints(parse(pointsSchema, await this.call('GET', '/v1/points')));
  }
}
