import {Controller, Get, Param} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {OrderIdParams, OrdersService, type OrderResponse} from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<OrderResponse[]> {
    return this.orders.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param() params: OrderIdParams): Promise<OrderResponse> {
    return this.orders.get(user, params.id);
  }
}
