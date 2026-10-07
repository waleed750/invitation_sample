import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {InvitationEditingService} from './invitation-editing.service';
import {InvitationsController, SlugsController} from './invitations.controller';
import {InvitationsRepository} from './invitations.repository';
import {InvitationsService} from './invitations.service';

@Module({
  controllers: [InvitationsController, SlugsController],
  providers: [InvitationsService, InvitationEditingService, InvitationsRepository, AppLogger, {provide: CLOCK, useClass: SystemClock}]
})
export class InvitationsModule {}
