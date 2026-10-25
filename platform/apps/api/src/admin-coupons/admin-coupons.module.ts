import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminCouponsController} from './admin-coupons.controller';
import {AdminCouponsRepository} from './admin-coupons.repository';
import {AdminCouponsService} from './admin-coupons.service';

@Module({controllers: [AdminCouponsController], providers: [AdminCouponsService, AdminCouponsRepository, AppLogger]})
export class AdminCouponsModule {}
