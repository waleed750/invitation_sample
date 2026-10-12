import {Module} from '@nestjs/common';
import {AdminStatsController} from './admin-stats.controller';
import {AdminStatsService} from './admin-stats.service';
import {AdminStatsRepository} from './admin-stats.repository';

@Module({
  controllers: [AdminStatsController],
  providers: [AdminStatsService, AdminStatsRepository],
  exports: [AdminStatsService]
})
export class AdminStatsModule {}
