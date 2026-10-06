import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {TemplatesController} from './templates.controller';
import {TemplatesService} from './templates.service';

@Module({controllers: [TemplatesController], providers: [TemplatesService, AppLogger]})
export class TemplatesModule {}
