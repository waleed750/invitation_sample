import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {MeController} from './me.controller';
import {MeRepository} from './me.repository';
import {MeService} from './me.service';

@Module({controllers: [MeController], providers: [MeService, MeRepository, AppLogger]})
export class MeModule {}
