import {Injectable} from '@nestjs/common';
import {AdminAuditRepository} from './admin-audit.repository';
import type {AdminAuditLogEntry, AdminAuditQueryDto} from './admin-audit.dto';

@Injectable()
export class AdminAuditService {
  constructor(private readonly repository: AdminAuditRepository) {}

  async listAuditLogs(query: AdminAuditQueryDto): Promise<AdminAuditLogEntry[]> {
    const rows = await this.repository.listAuditLogsAsServiceRole({
      limit: query.limit,
      before: query.before,
      action: query.action
    });

    return rows.map((r) => {
      const entry: AdminAuditLogEntry = {
        id: r.id,
        actorId: r.actor_id,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        details: r.details,
        createdAt: r.created_at
      };
      if (r.actor_email !== null) {
        entry.actorEmail = r.actor_email;
      }
      return entry;
    });
  }
}
