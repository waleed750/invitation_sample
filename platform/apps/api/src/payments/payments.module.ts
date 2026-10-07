import {Module, type Type} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {DevPaymentsController} from './dev-payments.controller';
import {ManualPaymentProvider} from './manual-payment.provider';
import {MockPaymentProvider} from './mock-payment.provider';
import {PAYMENT_PROVIDER, type PaymentProvider} from './payment-provider';
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
    ManualPaymentProvider,
    AppLogger,
    {
      provide: PAYMENT_PROVIDER,
      inject: [AppConfigService, MockPaymentProvider, ManualPaymentProvider],
      useFactory: (config: AppConfigService, mock: MockPaymentProvider, manual: ManualPaymentProvider): PaymentProvider => {
        if (config.paymentsProvider === 'manual') return manual;
        if (config.paymentsProvider === 'mock') return mock;
        throw new Error('fawry not implemented yet');
      }
    }
  ],
  exports: [PAYMENT_PROVIDER, PaymentsService]
})
export class PaymentsModule {}
