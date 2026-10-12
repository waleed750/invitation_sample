import {Module} from '@nestjs/common';
import {AdminAuditController} from './admin-audit.controller';
import {AdminAuditService} from './admin-audit.service';
import {AdminAuditRepository} from './admin-audit.repository';

@Module({
  controllers: [AdminAuditController],
  providers: [AdminAuditService, AdminAuditRepository],
  exports: [AdminAuditService]
})
export class AdminAuditModule {}
