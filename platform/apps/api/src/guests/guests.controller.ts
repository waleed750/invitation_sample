import {Controller, Get, Header, Param} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {
  GuestInvitationIdParams, GuestsService, type OwnerMessage, type OwnerRsvp
} from './guests.service';

@Controller('invitations')
export class GuestsController {
  constructor(private readonly guests: GuestsService) {}

  @Get(':id/rsvps')
  rsvps(@CurrentUser() user: RequestUser, @Param() params: GuestInvitationIdParams): Promise<OwnerRsvp[]> {
    return this.guests.listRsvps(user, params.id);
  }

  @Get(':id/messages')
  messages(@CurrentUser() user: RequestUser, @Param() params: GuestInvitationIdParams): Promise<OwnerMessage[]> {
    return this.guests.listMessages(user, params.id);
  }

  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Get(':id/rsvps.csv')
  csv(@CurrentUser() user: RequestUser, @Param() params: GuestInvitationIdParams): Promise<string> {
    return this.guests.exportRsvpsCsv(user, params.id);
  }
}
