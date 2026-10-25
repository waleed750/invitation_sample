import {Body, Controller, Get, HttpCode, Param, Post} from '@nestjs/common';
import {CurrentUser, Roles, type RequestUser} from '../common/decorators';
import {AdminCouponsService, CouponActiveBody, CouponCodeParams, CreateCouponBody} from './admin-coupons.service';
import type {CouponRow, CouponUseRow} from './admin-coupons.repository';

@Roles('admin')
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly coupons: AdminCouponsService) {}

  @Get()
  list(): Promise<CouponRow[]> {
    return this.coupons.list();
  }

  @Post()
  create(@CurrentUser() admin: RequestUser, @Body() body: CreateCouponBody): Promise<{code: string}> {
    return this.coupons.create(admin, body);
  }

  @Get(':code/uses')
  uses(@Param() params: CouponCodeParams): Promise<CouponUseRow[]> {
    return this.coupons.uses(params.code);
  }

  @Post(':code/active')
  @HttpCode(200)
  setActive(@CurrentUser() admin: RequestUser, @Param() params: CouponCodeParams, @Body() body: CouponActiveBody): Promise<{ok: true}> {
    return this.coupons.setActive(admin, params.code, body.active);
  }
}
