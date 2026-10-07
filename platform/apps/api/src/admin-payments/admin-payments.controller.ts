import {Body, Controller, Get, HttpCode, Param, Post} from '@nestjs/common';
import {CurrentUser, Roles, type RequestUser} from '../common/decorators';
import {
  AdminOrderParams,
  AdminPaymentsService,
  ConfirmPaymentBody,
  RejectPaymentBody,
  type ConfirmPaymentResponse,
  type PendingPaymentResponse,
  type RejectPaymentResponse
} from './admin-payments.service';

/** Admin "Pending payments": confirm or reject manual payments. Admin role only. */
@Roles('admin')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: AdminPaymentsService) {}

  @Get('pending')
  pending(): Promise<PendingPaymentResponse[]> {
    return this.payments.listPending();
  }

  @Post(':orderId/confirm')
  @HttpCode(200)
  confirm(
    @CurrentUser() user: RequestUser,
    @Param() params: AdminOrderParams,
    @Body() body: ConfirmPaymentBody
  ): Promise<ConfirmPaymentResponse> {
    return this.payments.confirm(user.id, params.orderId, body);
  }

  @Post(':orderId/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: RequestUser,
    @Param() params: AdminOrderParams,
    @Body() body: RejectPaymentBody
  ): Promise<RejectPaymentResponse> {
    return this.payments.reject(user.id, params.orderId, body);
  }
}
