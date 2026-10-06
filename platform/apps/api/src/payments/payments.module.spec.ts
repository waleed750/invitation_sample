import {paymentControllersForEnv} from './payments.module';
import {PaymentsController} from './payments.controller';
import {DevPaymentsController} from './dev-payments.controller';

describe('PaymentsModule', () => {
  it('should include DevPaymentsController when env is mock and not production', () => {
    const controllers = paymentControllersForEnv({PAYMENTS_PROVIDER: 'mock', NODE_ENV: 'development'});
    expect(controllers).toContain(DevPaymentsController);
    expect(controllers).toContain(PaymentsController);
  });

  it('should not include DevPaymentsController in production', () => {
    const controllers = paymentControllersForEnv({PAYMENTS_PROVIDER: 'mock', NODE_ENV: 'production'});
    expect(controllers).not.toContain(DevPaymentsController);
    expect(controllers).toContain(PaymentsController);
  });

  it('should not include DevPaymentsController if provider is not mock', () => {
    const controllers = paymentControllersForEnv({PAYMENTS_PROVIDER: 'fawry', NODE_ENV: 'development'});
    expect(controllers).not.toContain(DevPaymentsController);
    expect(controllers).toContain(PaymentsController);
  });
});
