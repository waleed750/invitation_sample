import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {OrdersController} from './orders.controller';
import {OrdersService} from './orders.service';

@Module({controllers: [OrdersController], providers: [OrdersService, AppLogger]})
export class OrdersModule {}
