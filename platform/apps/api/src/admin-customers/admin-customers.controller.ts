import {Body, Controller, Get, HttpCode, Param, Post, Query} from '@nestjs/common';
import {CurrentUser, Roles, type RequestUser} from '../common/decorators';
import {
  AdjustEntitlementBody,
  AdjustPointsBody,
  AdminCustomersService,
  CustomerParams,
  InvitationParams,
  SearchCustomersQuery,
  type AdjustPointsResponse,
  type CustomerDetailResponse,
  type CustomerSummaryResponse,
  type EntitlementAdjustmentResponse
} from './admin-customers.service';

/** Admin customer tools: search, detail, entitlement and points adjustments. Admin role only. */
@Roles('admin')
@Controller('admin')
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

  @Get('customers')
  search(@Query() query: SearchCustomersQuery): Promise<CustomerSummaryResponse[]> {
    return this.customers.search(query.q ?? '', query.limit);
  }

  @Get('customers/:id')
  detail(@Param() params: CustomerParams): Promise<CustomerDetailResponse> {
    return this.customers.detail(params.id);
  }

  @Post('invitations/:id/entitlement-adjustments')
  @HttpCode(200)
  adjustEntitlement(
    @CurrentUser() user: RequestUser,
    @Param() params: InvitationParams,
    @Body() body: AdjustEntitlementBody
  ): Promise<EntitlementAdjustmentResponse> {
    return this.customers.adjustEntitlement(user.id, params.id, body);
  }

  @Post('customers/:id/points-adjustments')
  @HttpCode(200)
  adjustPoints(
    @CurrentUser() user: RequestUser,
    @Param() params: CustomerParams,
    @Body() body: AdjustPointsBody
  ): Promise<AdjustPointsResponse> {
    return this.customers.adjustPoints(user.id, params.id, body);
  }
}
