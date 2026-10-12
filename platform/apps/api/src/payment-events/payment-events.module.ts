import {Module} from '@nestjs/common';
import {DatabaseModule} from '../database/database.module';
import {NotificationsModule} from '../notifications/notifications.module';
import {AdminPaymentEventsController, PaymentEventsController} from './payment-events.controller';
import {PaymentEventsRepository} from './payment-events.repository';
import {PaymentEventsService} from './payment-events.service';
import {UniqueAmountService} from './unique-amount.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [PaymentEventsController, AdminPaymentEventsController],
  providers: [PaymentEventsRepository, PaymentEventsService, UniqueAmountService],
  exports: [UniqueAmountService]
})
export class PaymentEventsModule {}
