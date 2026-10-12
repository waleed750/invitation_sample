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

export const adminStatsSchema = z.object({
  revenue: z.object({
    todayMinor: z.number(),
    last7dMinor: z.number(),
    last30dMinor: z.number(),
    currency: z.literal('EGP')
  }),
  ordersByStatus: z.object({
    pending: z.number(),
    paid: z.number(),
    failed: z.number(),
    refunded: z.number(),
    expired: z.number(),
    rejected: z.number()
  }),
  pendingManualPayments: z.number(),
  unmatchedPaymentEvents: z.number(),
  activeInvitations: z.number(),
  newSignups7d: z.number(),
  rsvps7d: z.number()
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

export const adminPaymentEventSchema = z.preprocess((val) => {
  if (val && typeof val === 'object') {
    const raw = val as Record<string, unknown>;
    return {
      id: raw.id,
      provider: raw.provider,
      externalId: raw.externalId ?? raw.external_id ?? null,
      amountMinor: Number(raw.amountMinor ?? raw.amount_minor ?? 0),
      currency: raw.currency ?? 'EGP',
      sender: raw.sender ?? null,
      referenceText: raw.referenceText ?? raw.reference_text ?? null,
      receivedAt: raw.receivedAt ?? raw.received_at,
      status: raw.status,
      orderId: raw.orderId ?? raw.order_id ?? null,
      matchReason: raw.matchReason ?? raw.match_reason ?? null,
      createdAt: raw.createdAt ?? raw.created_at
    };
  }
  return val;
}, z.object({
  id: z.string(),
  provider: z.string(),
  externalId: z.string().nullable(),
  amountMinor: z.number(),
  currency: z.string(),
  sender: z.string().nullable(),
  referenceText: z.string().nullable(),
  receivedAt: z.string(),
  status: z.string(),
  orderId: z.string().nullable(),
  matchReason: z.string().nullable(),
  createdAt: z.string()
}));
export type AdminPaymentEvent = z.infer<typeof adminPaymentEventSchema>;

export const adminAssignPaymentEventResponseSchema = z.object({
  ok: z.literal(true),
  already: z.boolean()
});
export type AdminAssignPaymentEventResponse = z.infer<typeof adminAssignPaymentEventResponseSchema>;

export const adminAuditLogEntrySchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string().optional(),
  action: z.string(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  details: z.record(z.string(), z.unknown()),
  createdAt: z.string()
});
export type AdminAuditLogEntry = z.infer<typeof adminAuditLogEntrySchema>;

