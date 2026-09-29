import {Controller, Get, Param} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {EntitlementsService, InvitationIdParams, type EntitlementResponse} from './entitlements.service';

@Controller('invitations')
export class EntitlementsController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get(':id/entitlement')
  getEntitlement(
    @Param() params: InvitationIdParams,
    @CurrentUser() user: RequestUser
  ): Promise<EntitlementResponse> {
    return this.entitlements.getEntitlement(user, params.id);
  }
}
