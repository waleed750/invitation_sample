import {Module} from '@nestjs/common';
import {AuthModule} from '../auth';
import {AppConfigModule} from '../config/app-config.module';
import {AppLogger} from '../common/app-logger';
import {NotificationsRepository} from './notifications.repository';
import {NotificationsService} from './notifications.service';

@Module({
  imports: [AuthModule, AppConfigModule],
  providers: [NotificationsService, NotificationsRepository, AppLogger],
  exports: [NotificationsService, NotificationsRepository]
})
export class NotificationsModule {}
