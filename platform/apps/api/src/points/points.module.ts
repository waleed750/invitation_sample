import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {PointsController} from './points.controller';
import {PointsRepository} from './points.repository';
import {PointsService} from './points.service';

@Module({controllers: [PointsController], providers: [PointsService, PointsRepository, AppLogger]})
export class PointsModule {}
