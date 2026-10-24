import {Body, Controller, Get, HttpCode, Param, Post, Query} from '@nestjs/common';
import {CurrentUser, Roles, type RequestUser} from '../common/decorators';
import {AdminRefundsService, ManualRefundBody, RefundOrderParams, RefundSearchQuery} from './admin-refunds.service';
import type {RefundableOrderRow} from './admin-refunds.repository';

/**
 * Paid orders an admin may refund. A refund to the customer's balance is `POST /admin/orders/:id/refund-to-balance` (T13);
 * this controller adds the search and the "returned outside the system" refund.
 */
@Roles('admin')
@Controller('admin/refunds')
export class AdminRefundsController {
  constructor(private readonly refunds: AdminRefundsService) {}

  @Get()
  search(@Query() query: RefundSearchQuery): Promise<RefundableOrderRow[]> {
    return this.refunds.search(query);
  }

  @Post(':orderId/manual')
  @HttpCode(200)
  markRefunded(@CurrentUser() admin: RequestUser, @Param() params: RefundOrderParams, @Body() body: ManualRefundBody): Promise<{ok: true; already: boolean}> {
    return this.refunds.markRefunded(admin, params.orderId, body.note);
  }
}
