import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {MeController} from './me.controller';
import {MeService} from './me.service';

@Module({controllers: [MeController], providers: [MeService, AppLogger]})
export class MeModule {}
