import {Module, type Type} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {DevPaymentsController} from './dev-payments.controller';
import {MockPaymentProvider} from './mock-payment.provider';
import {PAYMENT_PROVIDER} from './payment-provider';
import {PaymentsController} from './payments.controller';
import {PaymentsRepository} from './payments.repository';
import {PaymentsService} from './payments.service';

export function paymentControllersForEnv(env: NodeJS.ProcessEnv): Type<unknown>[] {
  return env.PAYMENTS_PROVIDER === 'mock' && env.NODE_ENV !== 'production'
    ? [PaymentsController, DevPaymentsController]
    : [PaymentsController];
}

@Module({
  controllers: paymentControllersForEnv(process.env),
  providers: [
    PaymentsService,
    PaymentsRepository,
    MockPaymentProvider,
    AppLogger,
    {
      provide: PAYMENT_PROVIDER,
      inject: [AppConfigService, MockPaymentProvider],
      useFactory: (config: AppConfigService, mock: MockPaymentProvider) => {
        
        return mock;
      }
    }
  ],
  exports: [PAYMENT_PROVIDER, PaymentsService]
})
export class PaymentsModule {}
