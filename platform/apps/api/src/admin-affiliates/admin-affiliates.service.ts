import {Injectable} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {unwrapRpc} from '../common/rpc-result';
import type {RequestUser} from '../common/decorators';
import {AdminAffiliatesRepository, type AffiliateOrderRow, type AffiliateRow, type PayoutRow} from './admin-affiliates.repository';

const idParam = z.object({id: z.uuid()});
export class AffiliateIdParams extends createZodDto(idParam) {}

const dateRange = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional()
}).strict();
export class AffiliateRangeQuery extends createZodDto(dateRange) {}

const fields = {
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(20).optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  customerDiscountPct: z.number().min(0).max(30).optional(),
  payoutMethod: z.string().trim().max(40).optional(),
  payoutDetails: z.record(z.string().max(60), z.string().max(300)).optional()
};
const createSchema = z.object({refCode: z.string().trim().min(3).max(32), ...fields}).strict();
export class CreateAffiliateBody extends createZodDto(createSchema) {}
const updateSchema = z.object({...fields, active: z.boolean().optional()}).strict();
export class UpdateAffiliateBody extends createZodDto(updateSchema) {}

const payoutSchema = z.object({
  amountEgp: z.number().positive().max(1_000_000),
  method: z.string().trim().max(40).optional(),
  reference: z.string().trim().max(120).optional(),
  periodStart: z.iso.date().optional(),
  periodEnd: z.iso.date().optional()
}).strict();
export class PayoutBody extends createZodDto(payoutSchema) {}

const clickSchema = z.object({ref: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,32}$/), path: z.string().trim().max(120).optional()}).strict();
export class ClickBody extends createZodDto(clickSchema) {}

function toSql(body: z.infer<typeof updateSchema> & {refCode?: string}): Record<string, unknown> {
  return {
    ref_code: body.refCode, name: body.name, phone: body.phone, commission_pct: body.commissionPct,
    customer_discount_pct: body.customerDiscountPct, payout_method: body.payoutMethod, payout_details: body.payoutDetails, active: body.active
  };
}

/** A cell that starts with = + - @ would run as a formula when the CSV is opened in a spreadsheet. */
export function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

@Injectable()
export class AdminAffiliatesService {
  constructor(private readonly repository: AdminAffiliatesRepository) {}

  list(): Promise<AffiliateRow[]> {
    return this.repository.list();
  }

  async create(admin: RequestUser, body: CreateAffiliateBody): Promise<{id: string}> {
    return {id: String(unwrapRpc(await this.repository.save(admin.id, null, toSql(body))).id)};
  }

  async update(admin: RequestUser, id: string, body: UpdateAffiliateBody): Promise<{id: string}> {
    return {id: String(unwrapRpc(await this.repository.save(admin.id, id, toSql(body))).id)};
  }

  async stats(id: string, query: AffiliateRangeQuery): Promise<Record<string, unknown>> {
    const result = unwrapRpc(await this.repository.stats(id, query.from ?? null, query.to ?? null));
    return Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'ok'));
  }

  payouts(id: string): Promise<PayoutRow[]> {
    return this.repository.payouts(id);
  }

  async recordPayout(admin: RequestUser, id: string, body: PayoutBody): Promise<{id: string}> {
    return {id: String(unwrapRpc(await this.repository.recordPayout(admin.id, id, {
      amountEgp: body.amountEgp, method: body.method ?? null, reference: body.reference ?? null, from: body.periodStart ?? null, to: body.periodEnd ?? null
    })).id)};
  }

  orders(id: string, query: AffiliateRangeQuery): Promise<AffiliateOrderRow[]> {
    return this.repository.orders(id, query.from ?? null, query.to ?? null);
  }

  /** CSV of an affiliate's paid orders (UTF-8 with BOM so Excel reads Arabic). */
  async exportCsv(id: string, query: AffiliateRangeQuery): Promise<string> {
    const rows = await this.repository.orders(id, query.from ?? null, query.to ?? null);
    const header = ['order', 'paid_at', 'amount_egp', 'attribution', 'commission_egp', 'payable', 'self_referral'];
    const lines = rows.map((row) => [
      row.order_id.slice(0, 8).toUpperCase(), row.paid_at, (row.amount_minor / 100).toFixed(2), row.attribution, (row.commission_minor / 100).toFixed(2),
      row.payable, row.self_referral
    ].map(csvCell).join(','));
    return `﻿${[header.join(','), ...lines].join('\r\n')}\r\n`;
  }

  async click(body: ClickBody): Promise<{ok: true}> {
    await this.repository.countClick(body.ref, body.path ?? '/');
    return {ok: true};
  }
}
