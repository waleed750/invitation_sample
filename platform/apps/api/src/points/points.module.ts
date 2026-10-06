import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {PointsController} from './points.controller';
import {PointsService} from './points.service';

@Module({controllers: [PointsController], providers: [PointsService, AppLogger]})
export class PointsModule {}
