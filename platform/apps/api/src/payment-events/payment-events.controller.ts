import {Body, Controller, Get, HttpCode, Param, Post, Query, Req} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import type {Request} from 'express';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {CurrentUser, Public, Roles, type RequestUser} from '../common/decorators';
import {PaymentEventsService} from './payment-events.service';

export class EventProviderParams extends createZodDto(z.object({provider: z.enum(['generic-hmac', 'easyconfirm'])})) {}
export class EventIdParams extends createZodDto(z.object({id: z.uuid()})) {}
export class EventQueueQuery extends createZodDto(z.object({
  status: z.enum(['unmatched', 'ambiguous', 'matched']).default('unmatched'),
  limit: z.coerce.number().int().min(1).max(100).default(50)
}).strict()) {}
export class AssignEventBody extends createZodDto(z.object({orderId: z.uuid(), note: z.string().trim().min(1).max(500)}).strict()) {}

@Public()
@Controller('payment-events')
export class PaymentEventsController {
  constructor(private readonly events: PaymentEventsService) {}
  @Post(':provider')
  @HttpCode(200)
  @Throttle({default: {limit: 60, ttl: 60_000}})
  webhook(@Param() params: EventProviderParams, @Req() request: Request & {rawBody?: Buffer}): Promise<{ok: true; duplicate?: true}> {
    return this.events.receive(params.provider, request.rawBody ?? Buffer.alloc(0), request.headers);
  }
}

@Roles('admin')
@Controller('admin/payment-events')
export class AdminPaymentEventsController {
  constructor(private readonly events: PaymentEventsService) {}
  @Get()
  list(@Query() query: EventQueueQuery): Promise<Record<string, unknown>[]> {
    return this.events.list(query.status, query.limit);
  }
  @Post(':id/assign')
  @HttpCode(200)
  assign(@CurrentUser() user: RequestUser, @Param() params: EventIdParams, @Body() body: AssignEventBody): Promise<{ok: true; already: boolean}> {
    return this.events.assign(user.id, params.id, body.orderId, body.note);
  }
}
