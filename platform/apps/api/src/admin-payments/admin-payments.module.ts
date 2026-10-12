import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {NotificationsModule} from '../notifications/notifications.module';
import {AdminPaymentsController} from './admin-payments.controller';
import {AdminPaymentsRepository} from './admin-payments.repository';
import {AdminPaymentsService} from './admin-payments.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService, AdminPaymentsRepository, AppLogger]
})
export class AdminPaymentsModule {}
