import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import {normalizeEgyptPhone} from '@platform/shared';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {AdminCustomersRepository} from './admin-customers.repository';

const DEFAULT_LIMIT = 20;
const LEDGER_LIMIT = 50;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_LIMIT)
});
export class SearchCustomersQuery extends createZodDto(searchQuerySchema) {}

const customerParams = z.object({id: z.uuid('customer id must be a UUID')});
export class CustomerParams extends createZodDto(customerParams) {}

const invitationParams = z.object({id: z.uuid('invitation id must be a UUID')});
export class InvitationParams extends createZodDto(invitationParams) {}

const reason = z.string().trim().min(3).max(500);

const adjustEntitlementSchema = z.object({
  addEdits: z.number().int().min(0).max(100).optional(),
  extendDays: z.number().int().min(0).max(365).optional(),
  reason
}).strict();
export class AdjustEntitlementBody extends createZodDto(adjustEntitlementSchema) {}

const adjustPointsSchema = z.object({
  delta: z.number().int().min(-100000).max(100000),
  reason
}).strict();
export class AdjustPointsBody extends createZodDto(adjustPointsSchema) {}

export interface CustomerSummaryResponse {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  level: string;
  purchasesCount: number;
  pointsBalance: number;
  createdAt: string;
}

export interface CustomerDetailResponse {
  profile: CustomerSummaryResponse;
  orders: {
    id: string; kind: string; tier: string; status: string; amountMinor: number;
    currency: string; provider: string; createdAt: string;
  }[];
  invitations: {
    id: string; slug: string; status: string; templateSlug: string | null;
    entitlement: {editsAllowed: number; editsUsed: number; onlineUntil: string | null} | null;
  }[];
  pointsLedger: {
    id: string; delta: number; reason: string; orderId: string | null;
    expiresAt: string | null; createdAt: string;
  }[];
}

export interface EntitlementAdjustmentResponse {
  ok: true;
  editsAllowed: number;
  onlineUntil: string | null;
  status: string;
}

export interface AdjustPointsResponse {
  balance: number;
}

/**
 * Escapes user text for an ilike pattern: backslash, `%` and `_` become
 * literals, and the characters that would break PostgREST `or(...)` syntax
 * (comma, parentheses, double quote, asterisk) are dropped.
 */
export function escapeLike(input: string): string {
  return input
    .replace(/[,()"*\u0000]/g, ' ')
    .trim()
    .replace(/[\\%_]/g, (character) => `\\${character}`);
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException('Admin service unavailable');
}

@Injectable()
export class AdminCustomersService {
  constructor(
    private readonly repository: AdminCustomersRepository,
    private readonly logger: AppLogger
  ) {}

  async search(rawQuery: string, limit: number = DEFAULT_LIMIT): Promise<CustomerSummaryResponse[]> {
    const query = rawQuery.trim();
    const likeText = escapeLike(query);
    const phone = normalizeEgyptPhone(query);
    if (query === '' || (likeText === '' && phone === null)) {
      return this.rows(await this.repository.listRecentProfilesAsServiceRole(limit), 'list');
    }

    let ownerIds: string[] = [];
    if (likeText !== '') {
      const owners = this.data(await this.repository.findSlugOwnersAsServiceRole(likeText, limit), 'slug search');
      ownerIds = [...new Set(owners.flatMap((row: unknown) => {
        const id = isRecord(row) ? row.owner_id : null;
        return typeof id === 'string' && UUID_PATTERN.test(id) ? [id] : [];
      }))];
    }

    const result = await this.repository.searchProfilesAsServiceRole({phone, likeText, ownerIds, limit});
    return this.rows(result, 'search');
  }

  async detail(userId: string): Promise<CustomerDetailResponse> {
    const profileResult: unknown = await this.repository.findProfileAsServiceRole(userId);
    if (!isRecord(profileResult) || profileResult.error !== null) {
      this.logger.error('admin customer detail failed');
      throw unavailable();
    }
    if (profileResult.data === null || profileResult.data === undefined) throw new NotFoundException('Customer not found');

    const [orders, invitations, ledger] = await Promise.all([
      this.repository.listOrdersAsServiceRole(userId),
      this.repository.listInvitationsAsServiceRole(userId),
      this.repository.listPointsLedgerAsServiceRole(userId, LEDGER_LIMIT)
    ]);

    return {
      profile: this.toSummary(profileResult.data),
      orders: this.data(orders, 'orders').map((row) => this.toOrder(row)),
      invitations: this.data(invitations, 'invitations').map((row) => this.toInvitation(row)),
      pointsLedger: this.data(ledger, 'ledger').map((row) => this.toLedger(row))
    };
  }

  async adjustEntitlement(
    adminId: string, invitationId: string, body: AdjustEntitlementBody
  ): Promise<EntitlementAdjustmentResponse> {
    const data = await this.rpc(() => this.repository.adjustEntitlementAsServiceRole(
      adminId, invitationId, body.addEdits ?? 0, body.extendDays ?? 0, body.reason
    ), 'entitlement adjust');
    if (data.ok !== true) throw this.failure(data, 'Invitation entitlement not found');
    const edits = Number(data.edits_allowed);
    if (!Number.isSafeInteger(edits)) throw unavailable();
    return {ok: true, editsAllowed: edits, onlineUntil: text(data.online_until), status: text(data.status) ?? ''};
  }

  async adjustPoints(adminId: string, userId: string, body: AdjustPointsBody): Promise<AdjustPointsResponse> {
    const data = await this.rpc(() => this.repository.adjustPointsAsServiceRole(
      adminId, userId, body.delta, body.reason
    ), 'points adjust');
    if (data.ok !== true) throw this.failure(data, 'Customer not found');
    const balance = Number(data.balance);
    if (!Number.isSafeInteger(balance)) throw unavailable();
    return {balance};
  }

  private async rpc(call: () => Promise<unknown>, label: string): Promise<Record<string, unknown>> {
    let result: unknown;
    try {
      result = await call();
    } catch {
      this.logger.error(`admin ${label} failed`);
      throw unavailable();
    }
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) {
      this.logger.error(`admin ${label} rpc failed`);
      throw unavailable();
    }
    return result.data;
  }

  private failure(data: Record<string, unknown>, notFound: string): Error {
    switch (data.reason) {
      case 'reason_required':
        return new BadRequestException({code: 'reason_required', message: 'A reason is required'});
      case 'invalid_adjustment':
        return new BadRequestException({code: 'invalid_adjustment', message: 'The adjustment is out of range or empty'});
      case 'not_found':
        return new NotFoundException(notFound);
      case 'insufficient_points':
        return new ConflictException({code: 'insufficient_points', message: 'Insufficient points for deduction'});
      default:
        this.logger.error('admin adjustment returned an unknown reason');
        return unavailable();
    }
  }

  /** Unwraps a postgrest list envelope; any error becomes 503. */
  private data(result: unknown, label: string): unknown[] {
    if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) {
      this.logger.error(`admin customers ${label} query failed`);
      throw unavailable();
    }
    return result.data as unknown[];
  }

  private rows(result: unknown, label: string): CustomerSummaryResponse[] {
    return this.data(result, label).map((row) => this.toSummary(row));
  }

  private toSummary(row: unknown): CustomerSummaryResponse {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.created_at !== 'string') throw unavailable();
    return {
      id: row.id,
      name: text(row.name),
      phone: text(row.phone),
      email: text(row.email),
      level: text(row.level) ?? 'member',
      purchasesCount: Number(row.purchases_count ?? 0),
      pointsBalance: Number(row.points_balance ?? 0),
      createdAt: row.created_at
    };
  }

  private toOrder(row: unknown): CustomerDetailResponse['orders'][number] {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.created_at !== 'string') throw unavailable();
    const amount = Number(row.amount_minor);
    if (!Number.isSafeInteger(amount)) throw unavailable();
    return {
      id: row.id,
      kind: text(row.kind) ?? '',
      tier: text(row.tier) ?? '',
      status: text(row.status) ?? '',
      amountMinor: amount,
      currency: text(row.currency) ?? '',
      provider: text(row.provider) ?? '',
      createdAt: row.created_at
    };
  }

  private toInvitation(row: unknown): CustomerDetailResponse['invitations'][number] {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.slug !== 'string') throw unavailable();
    const one = (value: unknown): Record<string, unknown> | null => {
      const item: unknown = Array.isArray(value) ? (value[0] as unknown) : value;
      return isRecord(item) ? item : null;
    };
    const template = one(row.templates);
    const entitlement = one(row.invitation_entitlements);
    return {
      id: row.id,
      slug: row.slug,
      status: text(row.status) ?? '',
      templateSlug: template === null ? null : text(template.slug),
      entitlement: entitlement === null ? null : {
        editsAllowed: Number(entitlement.edits_allowed),
        editsUsed: Number(entitlement.edits_used),
        onlineUntil: text(entitlement.online_until)
      }
    };
  }

  private toLedger(row: unknown): CustomerDetailResponse['pointsLedger'][number] {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.created_at !== 'string') throw unavailable();
    return {
      id: row.id,
      delta: Number(row.delta),
      reason: text(row.reason) ?? '',
      orderId: text(row.order_id),
      expiresAt: text(row.expires_at),
      createdAt: row.created_at
    };
  }
}
