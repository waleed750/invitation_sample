import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminPaymentsController} from './admin-payments.controller';
import {AdminPaymentsRepository} from './admin-payments.repository';
import {AdminPaymentsService} from './admin-payments.service';

@Module({
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService, AdminPaymentsRepository, AppLogger]
})
export class AdminPaymentsModule {}
