import {Module} from '@nestjs/common';
import {AuthRepository} from './auth.repository';
import {AuthGuard} from './auth.guard';
import {RolesGuard} from './roles.guard';

import {EMAIL_SENDER, LogEmailSender, SmtpEmailSender, type EmailSender} from './email-sender';
import {AppConfigService} from '../config/app-config.service';
import {AppLogger} from '../common/app-logger';

/** Provides the guards bound globally in `AppModule` (order: throttle → auth → roles), and shared EmailSender. */
@Module({
  providers: [
    AuthGuard,
    RolesGuard,
    AuthRepository,
    AppLogger,
    LogEmailSender,
    SmtpEmailSender,
    {
      provide: EMAIL_SENDER,
      useFactory: (config: AppConfigService, logger: AppLogger): EmailSender => {
        if (config.isProduction) {
          return new SmtpEmailSender(config, logger);
        }
        return new LogEmailSender(logger);
      },
      inject: [AppConfigService, AppLogger]
    }
  ],
  exports: [AuthGuard, RolesGuard, AuthRepository, EMAIL_SENDER, LogEmailSender, SmtpEmailSender]
})
export class AuthModule {}
