import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {CLOCK, SystemClock} from '../common/clock';
import {PublicInvitationsController} from './public-invitations.controller';
import {PublicInvitationsRepository} from './public-invitations.repository';
import {PublicInvitationsService} from './public-invitations.service';

@Module({
  controllers: [PublicInvitationsController],
  providers: [PublicInvitationsService, PublicInvitationsRepository, AppLogger, {provide: CLOCK, useClass: SystemClock}]
})
export class PublicInvitationsModule {}
