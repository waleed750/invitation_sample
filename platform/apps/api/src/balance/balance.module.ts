import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {NotificationsModule} from '../notifications/notifications.module';
import {AdminBalanceController, BalanceController, OrderBalanceController} from './balance.controller';
import {BalanceRepository} from './balance.repository';
import {BalanceService} from './balance.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BalanceController, OrderBalanceController, AdminBalanceController],
  providers: [BalanceService, BalanceRepository, AppLogger],
  exports: [BalanceService]
})
export class BalanceModule {}
