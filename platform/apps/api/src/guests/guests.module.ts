import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {GuestsController} from './guests.controller';
import {GuestsRepository} from './guests.repository';
import {GuestsService} from './guests.service';

@Module({controllers: [GuestsController], providers: [GuestsService, GuestsRepository, AppLogger]})
export class GuestsModule {}
