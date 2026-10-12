import {Controller, Get, Query} from '@nestjs/common';
import {Roles} from '../common/decorators';
import {AdminAuditService} from './admin-audit.service';
import {AdminAuditQueryDto, type AdminAuditLogEntry} from './admin-audit.dto';

@Roles('admin')
@Controller('admin/audit-log')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  listAuditLogs(@Query() query: AdminAuditQueryDto): Promise<AdminAuditLogEntry[]> {
    return this.auditService.listAuditLogs(query);
  }
}
