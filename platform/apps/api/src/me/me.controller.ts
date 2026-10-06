import {Body, Controller, Get, Patch} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {MeService, type MeResponse, UpdateMeBody} from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  getMe(@CurrentUser() user: RequestUser): Promise<MeResponse> {
    return this.me.getMe(user);
  }

  @Patch()
  updateMe(@CurrentUser() user: RequestUser, @Body() body: UpdateMeBody): Promise<MeResponse> {
    return this.me.updateLocale(user, body.locale);
  }
}
