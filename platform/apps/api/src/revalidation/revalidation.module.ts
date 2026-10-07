import {Module} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {RevalidationService} from './revalidation.service';

@Module({
  providers: [RevalidationService, AppLogger],
  exports: [RevalidationService]
})
export class RevalidationModule {}
