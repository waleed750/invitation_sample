import {Module} from '@nestjs/common';
import {AuthRepository} from './auth.repository';
import {AuthGuard} from './auth.guard';
import {RolesGuard} from './roles.guard';

/** Provides the guards bound globally in `AppModule` (order: throttle → auth → roles). */
@Module({
  providers: [AuthGuard, RolesGuard, AuthRepository],
  exports: [AuthGuard, RolesGuard, AuthRepository]
})
export class AuthModule {}
