import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {AppConfigService} from '../config/app-config.service';
import {NotificationsModule, NotificationsService} from '../notifications';
import {LifecycleRepository} from './lifecycle.repository';
import {LifecycleScheduler} from './lifecycle.scheduler';
import {LifecycleService} from './lifecycle.service';
import {LoggingNotificationsService} from './logging-notifications.service';
import {NOTIFICATIONS_PORT, type NotificationsPort} from './notifications.port';

@Module({
  imports: [NotificationsModule],
  providers: [
    LifecycleService,
    LifecycleRepository,
    LifecycleScheduler,
    AppLogger,
    LoggingNotificationsService,
    {provide: CLOCK, useClass: SystemClock},
    {
      provide: NOTIFICATIONS_PORT,
      useFactory: (
        config: AppConfigService,
        notifications: NotificationsService,
        logAdapter: LoggingNotificationsService
      ): NotificationsPort => {
        if (config.emailChannel === 'smtp' && config.notificationsEmailEnabled) {
          return {
            sendEndReminder: (ownerId: string, invitationId: string, onlineUntil: Date) =>
              notifications.endReminder(ownerId, invitationId, onlineUntil)
          };
        }
        return logAdapter;
      },
      inject: [AppConfigService, NotificationsService, LoggingNotificationsService]
    }
  ],
  exports: [LifecycleService]
})
export class LifecycleModule {}
