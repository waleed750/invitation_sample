import {Body, Controller, Get, HttpCode, Param, Post, Query} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {CurrentUser, Roles, type RequestUser} from '../common/decorators';
import {
  AdjustCreditBody, BalanceService, ConfirmTopupBody, CreateTopupBody, IdParams, LedgerQuery, RefundToBalanceBody, RejectTopupBody,
  type BalanceResponse, type OrderStatusResponse, type PayOrderResponse, type TopupResponse
} from './balance.service';

/** The signed-in customer's store credit. */
@Controller('balance')
export class BalanceController {
  constructor(private readonly balance: BalanceService) {}

  @Get()
  get(@CurrentUser() user: RequestUser): Promise<BalanceResponse> {
    return this.balance.get(user);
  }

  @Get('ledger')
  ledger(@CurrentUser() user: RequestUser, @Query() query: LedgerQuery) {
    return this.balance.ledger(user, query);
  }

  @Get('topups')
  topups(@CurrentUser() user: RequestUser): Promise<TopupResponse[]> {
    return this.balance.topups(user);
  }

  /** Asks to add credit by transfer; returns the reference and the exact amount to send. */
  @Post('topups')
  @Throttle({default: {limit: 10, ttl: 60_000}})
  createTopup(@CurrentUser() user: RequestUser, @Body() body: CreateTopupBody) {
    return this.balance.createTopup(user, body);
  }
}

/** Paying and cancelling orders from the balance. */
@Controller('orders')
export class OrderBalanceController {
  constructor(private readonly balance: BalanceService) {}

  /** Polled every few seconds by the waiting screen. */
  @Get(':id/status')
  @Throttle({default: {limit: 40, ttl: 60_000}})
  status(@CurrentUser() user: RequestUser, @Param() params: IdParams): Promise<OrderStatusResponse> {
    return this.balance.orderStatus(user, params.id);
  }

  @Post(':id/pay-with-balance')
  @HttpCode(200)
  @Throttle({default: {limit: 20, ttl: 60_000}})
  pay(@CurrentUser() user: RequestUser, @Param() params: IdParams): Promise<PayOrderResponse> {
    return this.balance.payOrder(user, params.id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Throttle({default: {limit: 20, ttl: 60_000}})
  cancel(@CurrentUser() user: RequestUser, @Param() params: IdParams): Promise<{ok: true}> {
    return this.balance.cancelOrder(user, params.id);
  }
}

/** Admin: top-up queue, credit adjustments and refunds to balance. */
@Roles('admin')
@Controller('admin')
export class AdminBalanceController {
  constructor(private readonly balance: BalanceService) {}

  @Get('topups/pending')
  pending() {
    return this.balance.pendingTopups();
  }

  @Post('topups/:id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() user: RequestUser, @Param() params: IdParams, @Body() body: ConfirmTopupBody) {
    return this.balance.confirmTopup(user.id, params.id, body);
  }

  @Post('topups/:id/reject')
  @HttpCode(200)
  reject(@CurrentUser() user: RequestUser, @Param() params: IdParams, @Body() body: RejectTopupBody) {
    return this.balance.rejectTopup(user.id, params.id, body);
  }

  @Post('credit/adjust')
  @HttpCode(200)
  adjust(@CurrentUser() user: RequestUser, @Body() body: AdjustCreditBody) {
    return this.balance.adjustCredit(user.id, body);
  }

  @Post('orders/:id/refund-to-balance')
  @HttpCode(200)
  refund(@CurrentUser() user: RequestUser, @Param() params: IdParams, @Body() body: RefundToBalanceBody) {
    return this.balance.refundToBalance(user.id, params.id, body);
  }
}
