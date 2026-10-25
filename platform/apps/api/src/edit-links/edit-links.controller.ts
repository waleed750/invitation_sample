import {Body, Controller, Get, HttpCode, Param, Post} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {CurrentUser, Public, Roles, type RequestUser} from '../common/decorators';
import {ClaimBody, EditLinksService, InvitationParams, IssueBody, LinkParams, ResolveBody} from './edit-links.service';
import type {EditLinkRow} from './edit-links.repository';

@Roles('admin')
@Controller('admin')
export class AdminEditLinksController {
  constructor(private readonly links: EditLinksService) {}

  @Post('invitations/:id/edit-links')
  @Throttle({default: {limit: 20, ttl: 60_000}})
  issue(@CurrentUser() admin: RequestUser, @Param() params: InvitationParams, @Body() body: IssueBody) {
    return this.links.issue(admin, params.id, body);
  }

  @Get('invitations/:id/edit-links')
  list(@Param() params: InvitationParams): Promise<EditLinkRow[]> {
    return this.links.list(params.id);
  }

  @Post('edit-links/:linkId/revoke')
  @HttpCode(200)
  revoke(@CurrentUser() admin: RequestUser, @Param() params: LinkParams): Promise<{ok: true}> {
    return this.links.revoke(admin, params.linkId);
  }
}

@Controller()
export class EditLinksController {
  constructor(private readonly links: EditLinksService) {}

  /** The web page for `/edit/<token>` asks which invitation the link opens. */
  @Public()
  @Post('edit-links/resolve')
  @HttpCode(200)
  @Throttle({default: {limit: 20, ttl: 60_000}})
  resolve(@Body() body: ResolveBody): Promise<{invitationId: string}> {
    return this.links.resolve(body);
  }

  /** "Save to my account": a signed-in customer takes the invitation over. */
  @Post('invitations/:id/claim')
  @HttpCode(200)
  @Throttle({default: {limit: 10, ttl: 60_000}})
  claim(@CurrentUser() user: RequestUser, @Param() params: InvitationParams, @Body() body: ClaimBody): Promise<{invitationId: string}> {
    return this.links.claim(user, params.id, body);
  }
}
