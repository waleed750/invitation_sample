import {Module, type Type} from '@nestjs/common';
import {AuthRepository} from './auth.repository';
import {AuthGuard} from './auth.guard';
import {RolesGuard} from './roles.guard';
import {TestOtpController} from './test-otp.controller';

export function authControllersForEnv(env: NodeJS.ProcessEnv): Type<unknown>[] {
  const isEnabled = env.NODE_ENV !== 'production' && (env.NODE_ENV === 'test' || env.E2E_CAPTURE_EMAILS === '1' || env.E2E_CAPTURE_EMAILS === 'true');
  return isEnabled ? [TestOtpController] : [];
}

/** Provides the guards bound globally in `AppModule` (order: throttle → auth → roles). */
@Module({
  controllers: authControllersForEnv(process.env),
  providers: [AuthGuard, RolesGuard, AuthRepository],
  exports: [AuthGuard, RolesGuard, AuthRepository]
})
export class AuthModule {}

