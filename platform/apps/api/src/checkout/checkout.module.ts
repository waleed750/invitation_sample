import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {PaymentsModule} from '../payments/payments.module';
import {PaymentEventsModule} from '../payment-events/payment-events.module';
import {CheckoutController} from './checkout.controller';
import {CheckoutRepository} from './checkout.repository';
import {CheckoutService} from './checkout.service';

@Module({imports: [PaymentsModule, PaymentEventsModule], controllers: [CheckoutController], providers: [CheckoutService, CheckoutRepository, AppLogger]})
export class CheckoutModule {}
