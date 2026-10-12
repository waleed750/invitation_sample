import {Injectable} from '@nestjs/common';
import {AdminStatsRepository} from './admin-stats.repository';
import type {AdminStatsResponse} from './admin-stats.dto';

@Injectable()
export class AdminStatsService {
  constructor(private readonly repository: AdminStatsRepository) {}

  async getStats(): Promise<AdminStatsResponse> {
    return this.repository.getStatsAsServiceRole();
  }
}
