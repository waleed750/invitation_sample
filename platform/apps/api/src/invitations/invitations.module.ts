import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {InvitationsController} from './invitations.controller';
import {InvitationsRepository} from './invitations.repository';
import {InvitationsService} from './invitations.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository, AppLogger, {provide: CLOCK, useClass: SystemClock}]
})
export class InvitationsModule {}
