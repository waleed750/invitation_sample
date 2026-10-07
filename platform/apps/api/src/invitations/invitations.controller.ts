import {Body, Controller, Get, Headers, HttpCode, Param, Patch, Post} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {
  InvitationEditingService, InvitationIdParams, SlugParams, UpdateInvitationBody, UpdateSlugBody,
  type InvitationDetail, type PublishInvitationResult, type SlugAvailability
} from './invitation-editing.service';
import {InvitationsService, type InvitationSummary} from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly editing: InvitationEditingService
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<InvitationSummary[]> {
    return this.invitations.list(user);
  }

  @Get(':id')
  get(@Param() params: InvitationIdParams, @CurrentUser() user: RequestUser): Promise<InvitationDetail> {
    return this.editing.get(user, params.id);
  }

  @Patch(':id')
  @Throttle({default: {limit: 60, ttl: 60_000}})
  update(
    @Param() params: InvitationIdParams,
    @Body() body: UpdateInvitationBody,
    @CurrentUser() user: RequestUser,
    @Headers('if-match') ifMatch?: string
  ): Promise<{updatedAt: string}> {
    return this.editing.updateData(user, params.id, body, ifMatch);
  }

  @Patch(':id/slug')
  updateSlug(
    @Param() params: InvitationIdParams,
    @Body() body: UpdateSlugBody,
    @CurrentUser() user: RequestUser
  ): Promise<{slug: string}> {
    return this.editing.updateSlug(user, params.id, body.slug);
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@Param() params: InvitationIdParams, @CurrentUser() user: RequestUser): Promise<PublishInvitationResult> {
    return this.editing.publish(user, params.id);
  }
}

@Controller('slugs')
export class SlugsController {
  constructor(private readonly editing: InvitationEditingService) {}

  @Get(':slug/availability')
  @Throttle({default: {limit: 30, ttl: 60_000}})
  availability(@Param() params: SlugParams): Promise<SlugAvailability> {
    return this.editing.availability(params.slug);
  }
}
