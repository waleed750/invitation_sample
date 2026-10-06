import {Controller, Param, Post, Req} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {createZodDto} from 'nestjs-zod';
import type {Request} from 'express';
import {z} from 'zod';
import {Public} from '../common/decorators';
import {PaymentsService} from './payments.service';

const providerParams = z.object({provider: z.enum(['mock'])});
export class ProviderParams extends createZodDto(providerParams) {}

@Public()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Throttle({default: {limit: 20, ttl: 60_000}})
  @Post(':provider/webhook')
  webhook(
    @Param() params: ProviderParams,
    @Req() request: Request & {rawBody?: Buffer}
  ): Promise<{ok: true}> {
    if (request.rawBody === undefined) return this.payments.handleWebhook(params.provider, Buffer.alloc(0), request.headers);
    return this.payments.handleWebhook(params.provider, request.rawBody, request.headers);
  }
}
