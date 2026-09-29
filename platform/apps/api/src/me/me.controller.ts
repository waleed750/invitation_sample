import {Controller, Get} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {MeService, type MeResponse} from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  getMe(@CurrentUser() user: RequestUser): Promise<MeResponse> {
    return this.me.getMe(user);
  }
}
