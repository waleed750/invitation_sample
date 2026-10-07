import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {EntitlementsController} from './entitlements.controller';
import {EntitlementsRepository} from './entitlements.repository';
import {EntitlementsService} from './entitlements.service';

@Module({
  controllers: [EntitlementsController],
  providers: [EntitlementsService, EntitlementsRepository, AppLogger, {provide: CLOCK, useClass: SystemClock}]
})
export class EntitlementsModule {}
