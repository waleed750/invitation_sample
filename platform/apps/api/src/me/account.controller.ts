import {Body, Controller, Get, Header, HttpCode, Post} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {AccountService, DeleteAccountBody} from './account.service';

@Controller('me')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  /** JSON download of the caller's own data. */
  @Get('export')
  @Header('Content-Disposition', 'attachment; filename="my-data.json"')
  @Header('Cache-Control', 'no-store')
  @Throttle({default: {limit: 5, ttl: 60_000}})
  exportData(@CurrentUser() user: RequestUser): Promise<Record<string, unknown>> {
    return this.account.exportData(user);
  }

  /** Deletes the caller's account (they confirm by typing their email). */
  @Post('delete')
  @HttpCode(200)
  @Throttle({default: {limit: 3, ttl: 60_000}})
  deleteAccount(@CurrentUser() user: RequestUser, @Body() body: DeleteAccountBody): Promise<{ok: true}> {
    return this.account.deleteAccount(user, body);
  }
}
