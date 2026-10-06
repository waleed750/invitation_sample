import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {PaymentsModule} from '../payments/payments.module';
import {CheckoutController} from './checkout.controller';
import {CheckoutService} from './checkout.service';

@Module({imports: [PaymentsModule], controllers: [CheckoutController], providers: [CheckoutService, AppLogger]})
export class CheckoutModule {}
