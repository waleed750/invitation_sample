import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';

export const AdminStatsResponseSchema = z.object({
  revenue: z.object({
    todayMinor: z.number().int().nonnegative(),
    last7dMinor: z.number().int().nonnegative(),
    last30dMinor: z.number().int().nonnegative(),
    currency: z.literal('EGP')
  }),
  ordersByStatus: z.object({
    pending: z.number().int().nonnegative(),
    paid: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    refunded: z.number().int().nonnegative(),
    expired: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative()
  }),
  pendingManualPayments: z.number().int().nonnegative(),
  unmatchedPaymentEvents: z.number().int().nonnegative(),
  activeInvitations: z.number().int().nonnegative(),
  newSignups7d: z.number().int().nonnegative(),
  rsvps7d: z.number().int().nonnegative()
});

export class AdminStatsResponseDto extends createZodDto(AdminStatsResponseSchema) {}
export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>;
