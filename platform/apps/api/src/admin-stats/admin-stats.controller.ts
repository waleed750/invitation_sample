import {Controller, Get} from '@nestjs/common';
import {Roles} from '../common/decorators';
import {AdminStatsService} from './admin-stats.service';
import type {AdminStatsResponse} from './admin-stats.dto';

@Roles('admin')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly statsService: AdminStatsService) {}

  @Get()
  getStats(): Promise<AdminStatsResponse> {
    return this.statsService.getStats();
  }
}
