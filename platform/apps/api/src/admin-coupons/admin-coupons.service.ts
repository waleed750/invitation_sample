import {Injectable} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {unwrapRpc} from '../common/rpc-result';
import type {RequestUser} from '../common/decorators';
import {AdminCouponsRepository, type CouponRow, type CouponUseRow} from './admin-coupons.repository';

const codeParam = z.object({code: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,32}$/)});
export class CouponCodeParams extends createZodDto(codeParam) {}

const createSchema = z.object({
  code: z.string().trim().min(3).max(32),
  percentOff: z.number().gt(0).max(100).optional(),
  amountOffMinor: z.number().int().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.iso.datetime({offset: true}).optional()
}).strict();
export class CreateCouponBody extends createZodDto(createSchema) {}

const activeSchema = z.object({active: z.boolean()}).strict();
export class CouponActiveBody extends createZodDto(activeSchema) {}

@Injectable()
export class AdminCouponsService {
  constructor(private readonly repository: AdminCouponsRepository) {}

  list(): Promise<CouponRow[]> {
    return this.repository.list();
  }

  uses(code: string): Promise<CouponUseRow[]> {
    return this.repository.uses(code);
  }

  async create(admin: RequestUser, body: CreateCouponBody): Promise<{code: string}> {
    const result = unwrapRpc(await this.repository.create(admin.id, {
      code: body.code, percent: body.percentOff ?? null, amountMinor: body.amountOffMinor ?? null,
      maxUses: body.maxUses ?? null, expiresAt: body.expiresAt ?? null
    }));
    return {code: String(result.code)};
  }

  async setActive(admin: RequestUser, code: string, active: boolean): Promise<{ok: true}> {
    unwrapRpc(await this.repository.setActive(admin.id, code, active));
    return {ok: true};
  }
}
