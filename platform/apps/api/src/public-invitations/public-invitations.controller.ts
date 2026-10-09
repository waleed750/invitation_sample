import {Body, Controller, Get, Header, Ip, Param, Post} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {Public} from '../common/decorators';
import {
  GuestMessageBody, PublicInvitationsService, PublicSlugParams, RsvpBody,
  type GuestAck, type PublicInvitation
} from './public-invitations.service';

@Public()
@Controller('public/invitations')
export class PublicInvitationsController {
  constructor(private readonly invitations: PublicInvitationsService) {}

  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  @Throttle({default: {limit: 60, ttl: 60_000}})
  @Get(':slug')
  get(@Param() params: PublicSlugParams): Promise<PublicInvitation> {
    return this.invitations.getBySlug(params.slug);
  }

  @Throttle({default: {limit: 5, ttl: 60_000}})
  @Post(':slug/rsvp')
  rsvp(@Param() params: PublicSlugParams, @Body() body: RsvpBody, @Ip() ip: string): Promise<GuestAck> {
    return this.invitations.submitRsvp(params.slug, body, ip);
  }

  @Throttle({default: {limit: 3, ttl: 600_000}})
  @Post(':slug/messages')
  message(@Param() params: PublicSlugParams, @Body() body: GuestMessageBody): Promise<GuestAck> {
    return this.invitations.submitMessage(params.slug, body);
  }
}
