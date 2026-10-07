import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {LifecycleRepository} from './lifecycle.repository';
import {LifecycleScheduler} from './lifecycle.scheduler';
import {LifecycleService} from './lifecycle.service';
import {LoggingNotificationsService} from './logging-notifications.service';
import {NOTIFICATIONS_PORT} from './notifications.port';

@Module({
  providers: [
    LifecycleService,
    LifecycleRepository,
    LifecycleScheduler,
    AppLogger,
    LoggingNotificationsService,
    {provide: CLOCK, useClass: SystemClock},
    {provide: NOTIFICATIONS_PORT, useClass: LoggingNotificationsService}
  ],
  exports: [LifecycleService]
})
export class LifecycleModule {}
