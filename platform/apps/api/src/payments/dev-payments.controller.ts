import {Controller, Param, Post} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {PaymentsService} from './payments.service';

const orderParams = z.object({orderId: z.uuid('order id must be a UUID')});
export class DevOrderParams extends createZodDto(orderParams) {}

@Controller('dev/payments/mock')
export class DevPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':orderId/succeed')
  succeed(@CurrentUser() user: RequestUser, @Param() params: DevOrderParams): Promise<{ok: true}> {
    return this.payments.simulate(params.orderId, 'paid', user.id);
  }

  @Post(':orderId/fail')
  fail(@CurrentUser() user: RequestUser, @Param() params: DevOrderParams): Promise<{ok: true}> {
    return this.payments.simulate(params.orderId, 'failed', user.id);
  }
}
