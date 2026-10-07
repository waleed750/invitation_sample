import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminCustomersController} from './admin-customers.controller';
import {AdminCustomersRepository} from './admin-customers.repository';
import {AdminCustomersService} from './admin-customers.service';

@Module({
  controllers: [AdminCustomersController],
  providers: [AdminCustomersService, AdminCustomersRepository, AppLogger]
})
export class AdminCustomersModule {}
