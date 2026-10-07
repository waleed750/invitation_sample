import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {TemplatesController} from './templates.controller';
import {TemplatesRepository} from './templates.repository';
import {TemplatesService} from './templates.service';

@Module({controllers: [TemplatesController], providers: [TemplatesService, TemplatesRepository, AppLogger]})
export class TemplatesModule {}
