import {Controller, Get, NotFoundException, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Public} from '../common/decorators';
import {AppConfigService} from '../config/app-config.service';
import {testOtpStore} from './test-otp.store';

@ApiTags('Testing')
@Controller('test')
export class TestOtpController {
  constructor(private readonly config: AppConfigService) {}

  @Public()
  @Get('otp')
  getOtp(@Query('email') email?: string) {
    if (!this.config.e2eCaptureEmails) {
      throw new NotFoundException('Not found');
    }
    const entry = testOtpStore.get(email);
    if (!entry) {
      throw new NotFoundException('No OTP found');
    }
    return {
      ok: true,
      code: entry.code,
      otp: entry.code,
      email: entry.email
    };
  }

  @Public()
  @Get('email-code')
  getEmailCode(@Query('email') email?: string) {
    return this.getOtp(email);
  }
}
