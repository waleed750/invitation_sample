import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {OrdersController} from './orders.controller';
import {OrdersRepository} from './orders.repository';
import {OrdersService} from './orders.service';

@Module({controllers: [OrdersController], providers: [OrdersService, OrdersRepository, AppLogger]})
export class OrdersModule {}
