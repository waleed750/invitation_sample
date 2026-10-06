import {Controller, Get} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {InvitationsService, type InvitationSummary} from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<InvitationSummary[]> {
    return this.invitations.list(user);
  }
}
