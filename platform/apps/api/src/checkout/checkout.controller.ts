import {Body, Controller, Headers, Post} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {CheckoutBody, CheckoutService, type CheckoutResponse} from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  start(
    @CurrentUser() user: RequestUser,
    @Body() body: CheckoutBody,
    @Headers('idempotency-key') idempotencyKey?: string
  ): Promise<CheckoutResponse> {
    return this.checkout.start(user, body, idempotencyKey);
  }
}
