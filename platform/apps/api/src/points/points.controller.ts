import {Controller, Get} from '@nestjs/common';
import {CurrentUser, type RequestUser} from '../common/decorators';
import {PointsService, type PointsResponse} from './points.service';

@Controller('points')
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @Get()
  get(@CurrentUser() user: RequestUser): Promise<PointsResponse> {
    return this.points.get(user);
  }
}
