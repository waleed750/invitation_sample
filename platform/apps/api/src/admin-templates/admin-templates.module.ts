import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminTemplatesController} from './admin-templates.controller';
import {AdminTemplatesRepository} from './admin-templates.repository';
import {AdminTemplatesService} from './admin-templates.service';

@Module({controllers: [AdminTemplatesController], providers: [AdminTemplatesService, AdminTemplatesRepository, AppLogger]})
export class AdminTemplatesModule {}
