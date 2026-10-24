import {Body, Controller, Get, Header, HttpCode, Param, Post, Put, Query} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {CurrentUser, Public, Roles, type RequestUser} from '../common/decorators';
import {
  AdminAffiliatesService, AffiliateIdParams, AffiliateRangeQuery, ClickBody, CreateAffiliateBody, PayoutBody, UpdateAffiliateBody
} from './admin-affiliates.service';
import type {AffiliateOrderRow, AffiliateRow, PayoutRow} from './admin-affiliates.repository';

@Roles('admin')
@Controller('admin/affiliates')
export class AdminAffiliatesController {
  constructor(private readonly affiliates: AdminAffiliatesService) {}

  @Get()
  list(): Promise<AffiliateRow[]> {
    return this.affiliates.list();
  }

  @Post()
  create(@CurrentUser() admin: RequestUser, @Body() body: CreateAffiliateBody): Promise<{id: string}> {
    return this.affiliates.create(admin, body);
  }

  @Put(':id')
  update(@CurrentUser() admin: RequestUser, @Param() params: AffiliateIdParams, @Body() body: UpdateAffiliateBody): Promise<{id: string}> {
    return this.affiliates.update(admin, params.id, body);
  }

  @Get(':id/stats')
  stats(@Param() params: AffiliateIdParams, @Query() query: AffiliateRangeQuery): Promise<Record<string, unknown>> {
    return this.affiliates.stats(params.id, query);
  }

  @Get(':id/orders')
  orders(@Param() params: AffiliateIdParams, @Query() query: AffiliateRangeQuery): Promise<AffiliateOrderRow[]> {
    return this.affiliates.orders(params.id, query);
  }

  @Get(':id/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="affiliate-orders.csv"')
  @Header('Cache-Control', 'no-store')
  exportCsv(@Param() params: AffiliateIdParams, @Query() query: AffiliateRangeQuery): Promise<string> {
    return this.affiliates.exportCsv(params.id, query);
  }

  @Get(':id/payouts')
  payouts(@Param() params: AffiliateIdParams): Promise<PayoutRow[]> {
    return this.affiliates.payouts(params.id);
  }

  /** "Mark payout paid": only up to what the 7-day refund window has released. */
  @Post(':id/payouts')
  recordPayout(@CurrentUser() admin: RequestUser, @Param() params: AffiliateIdParams, @Body() body: PayoutBody): Promise<{id: string}> {
    return this.affiliates.recordPayout(admin, params.id, body);
  }
}

/** Counts a visit that came through an affiliate link (no personal data is stored). */
@Controller('affiliates')
export class AffiliateClicksController {
  constructor(private readonly affiliates: AdminAffiliatesService) {}

  @Public()
  @Post('click')
  @HttpCode(200)
  @Throttle({default: {limit: 30, ttl: 60_000}})
  click(@Body() body: ClickBody): Promise<{ok: true}> {
    return this.affiliates.click(body);
  }
}
