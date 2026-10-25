import {Injectable} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {unwrapRpc} from '../common/rpc-result';
import type {RequestUser} from '../common/decorators';
import {AdminRefundsRepository, type RefundableOrderRow} from './admin-refunds.repository';

const searchSchema = z.object({q: z.string().trim().min(2).max(80).optional()}).strict();
export class RefundSearchQuery extends createZodDto(searchSchema) {}
const orderParam = z.object({orderId: z.uuid()});
export class RefundOrderParams extends createZodDto(orderParam) {}
const manualSchema = z.object({note: z.string().trim().min(3).max(500)}).strict();
export class ManualRefundBody extends createZodDto(manualSchema) {}

@Injectable()
export class AdminRefundsService {
  constructor(private readonly repository: AdminRefundsRepository) {}

  search(query: RefundSearchQuery): Promise<RefundableOrderRow[]> {
    return this.repository.search(query.q ?? null);
  }

  /** Money returned outside the system (bank, wallet): the order becomes refunded, points and commission are reversed. */
  async markRefunded(admin: RequestUser, orderId: string, note: string): Promise<{ok: true; already: boolean}> {
    const result = unwrapRpc(await this.repository.markRefunded(admin.id, orderId, note));
    return {ok: true, already: result.already === true};
  }
}
