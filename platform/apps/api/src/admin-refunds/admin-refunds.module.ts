import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminRefundsController} from './admin-refunds.controller';
import {AdminRefundsRepository} from './admin-refunds.repository';
import {AdminRefundsService} from './admin-refunds.service';

@Module({controllers: [AdminRefundsController], providers: [AdminRefundsService, AdminRefundsRepository, AppLogger]})
export class AdminRefundsModule {}
