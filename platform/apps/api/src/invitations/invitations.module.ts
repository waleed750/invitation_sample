import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {InvitationsController} from './invitations.controller';
import {InvitationsService} from './invitations.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, AppLogger, {provide: CLOCK, useClass: SystemClock}]
})
export class InvitationsModule {}
