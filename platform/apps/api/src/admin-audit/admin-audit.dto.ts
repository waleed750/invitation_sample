import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';

export const AdminAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().trim().min(1).max(200).optional(),
  action: z.string().trim().min(1).max(100).optional()
}).strict();

export class AdminAuditQueryDto extends createZodDto(AdminAuditQuerySchema) {}

export const AdminAuditLogEntrySchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string().optional(),
  action: z.string(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  details: z.record(z.string(), z.unknown()),
  createdAt: z.string()
});

export class AdminAuditLogEntryDto extends createZodDto(AdminAuditLogEntrySchema) {}
export type AdminAuditLogEntry = z.infer<typeof AdminAuditLogEntrySchema>;
