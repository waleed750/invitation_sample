import {Controller, Get} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {Public} from '../common/decorators';
import {TemplatesService, type PublicCatalogEntry} from './templates.service';

@Public()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Throttle({default: {limit: 60, ttl: 60_000}})
  @Get()
  list(): Promise<PublicCatalogEntry[]> {
    return this.templates.listLive();
  }
}
