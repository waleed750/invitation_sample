import {z} from 'zod';

export const adminPendingPaymentsSchema = z.array(z.object({
  id: z.string(),
  reference: z.string().nullable(),
  amountMinor: z.number(),
  currency: z.string(),
  createdAt: z.string(),
  ageHours: z.number(),
  customer: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
  }),
}));

export const adminConfirmResponseSchema = z.object({
  ok: z.literal(true),
  already: z.boolean(),
});

export const adminRejectResponseSchema = z.object({
  ok: z.literal(true),
});

export const adminCustomerSummarySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  level: z.string(),
  purchasesCount: z.number(),
  pointsBalance: z.number(),
  createdAt: z.string(),
});

export const adminCustomerDetailSchema = z.object({
  profile: adminCustomerSummarySchema,
  orders: z.array(z.object({
    id: z.string(),
    kind: z.string(),
    tier: z.string(),
    status: z.string(),
    amountMinor: z.number(),
    currency: z.string(),
    provider: z.string(),
    createdAt: z.string(),
  })),
  invitations: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    status: z.string(),
    templateSlug: z.string().nullable(),
    entitlement: z.object({
      editsAllowed: z.number(),
      editsUsed: z.number(),
      onlineUntil: z.string().nullable(),
    }).nullable(),
  })),
  pointsLedger: z.array(z.object({
    id: z.string(),
    delta: z.number(),
    reason: z.string(),
    orderId: z.string().nullable(),
    expiresAt: z.string().nullable(),
    createdAt: z.string(),
  })),
});

export const adminEntitlementAdjustmentResponseSchema = z.object({
  ok: z.literal(true),
  editsAllowed: z.number(),
  onlineUntil: z.string().nullable(),
  status: z.string(),
});

export const adminAdjustPointsResponseSchema = z.object({
  balance: z.number(),
});
