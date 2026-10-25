import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AdminAffiliatesController, AffiliateClicksController} from './admin-affiliates.controller';
import {AdminAffiliatesRepository} from './admin-affiliates.repository';
import {AdminAffiliatesService} from './admin-affiliates.service';

@Module({
  controllers: [AdminAffiliatesController, AffiliateClicksController],
  providers: [AdminAffiliatesService, AdminAffiliatesRepository, AppLogger],
  exports: [AdminAffiliatesRepository]
})
export class AdminAffiliatesModule {}
