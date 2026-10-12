import {Injectable} from '@nestjs/common';
import {DbService} from '../database';

export interface AdminAuditLogDbRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ListAuditLogsInput {
  limit: number;
  before?: string;
  action?: string;
}

@Injectable()
export class AdminAuditRepository {
  constructor(private readonly db: DbService) {}

  async listAuditLogsAsServiceRole(input: ListAuditLogsInput): Promise<AdminAuditLogDbRow[]> {
    const {limit, before, action} = input;
    return this.db.asService(async (tx) => {
      return await tx<AdminAuditLogDbRow[]>`
        select
          a.id,
          a.actor_id,
          p.email as actor_email,
          a.action,
          a.target_type,
          a.target_id,
          a.details,
          a.created_at
        from public.audit_log a
        left join public.profiles p on p.id = a.actor_id
        where (${action ?? null}::text is null or a.action = ${action ?? null}::text)
          and (
            ${before ?? null}::text is null
            or (
              case
                when position(',' in coalesce(${before ?? null}::text, '')) > 0 then
                  (a.created_at, a.id) < (
                    split_part(${before ?? null}::text, ',', 1)::timestamptz,
                    split_part(${before ?? null}::text, ',', 2)::uuid
                  )
                when coalesce(${before ?? null}::text, '') ~ '^[0-9a-fA-F-]{36}$' then
                  (a.created_at, a.id) < (
                    (select created_at from public.audit_log where id = ${before ?? null}::uuid),
                    ${before ?? null}::uuid
                  )
                else
                  a.created_at < ${before ?? null}::timestamptz
              end
            )
          )
        order by a.created_at desc, a.id desc
        limit ${limit}::integer
      `;
    });
  }
}
