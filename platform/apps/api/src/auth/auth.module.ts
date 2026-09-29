import {Module} from '@nestjs/common';
import {AuthGuard} from './auth.guard';
import {RolesGuard} from './roles.guard';

/** Provides the guards bound globally in `AppModule` (order: throttle → auth → roles). */
@Module({
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard]
})
export class AuthModule {}
