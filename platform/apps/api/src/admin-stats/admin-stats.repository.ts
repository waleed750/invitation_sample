import {Injectable} from '@nestjs/common';
import {DbService} from '../database';

export interface AdminStatsData {
  revenue: {
    todayMinor: number;
    last7dMinor: number;
    last30dMinor: number;
    currency: 'EGP';
  };
  ordersByStatus: {
    pending: number;
    paid: number;
    failed: number;
    refunded: number;
    expired: number;
    rejected: number;
  };
  pendingManualPayments: number;
  unmatchedPaymentEvents: number;
  activeInvitations: number;
  newSignups7d: number;
  rsvps7d: number;
}

@Injectable()
export class AdminStatsRepository {
  constructor(private readonly db: DbService) {}

  async getStatsAsServiceRole(): Promise<AdminStatsData> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{
        revenue_today_minor: string;
        revenue_last7d_minor: string;
        revenue_last30d_minor: string;
        currency: string;
        orders_pending: number;
        orders_paid: number;
        orders_failed: number;
        orders_refunded: number;
        orders_expired: number;
        orders_rejected: number;
        pending_manual_payments: number;
        unmatched_payment_events: number;
        active_invitations: number;
        new_signups_7d: number;
        rsvps_7d: number;
      }[]>`
        select
          coalesce((select sum(amount_minor) from public.orders where status = 'paid' and currency = 'EGP' and paid_at >= date_trunc('day', now())), 0)::text as revenue_today_minor,
          coalesce((select sum(amount_minor) from public.orders where status = 'paid' and currency = 'EGP' and paid_at >= now() - interval '7 days'), 0)::text as revenue_last7d_minor,
          coalesce((select sum(amount_minor) from public.orders where status = 'paid' and currency = 'EGP' and paid_at >= now() - interval '30 days'), 0)::text as revenue_last30d_minor,
          'EGP'::text as currency,
          (select count(*) filter (where status = 'pending')::integer from public.orders) as orders_pending,
          (select count(*) filter (where status = 'paid')::integer from public.orders) as orders_paid,
          (select count(*) filter (where status = 'failed')::integer from public.orders) as orders_failed,
          (select count(*) filter (where status = 'refunded')::integer from public.orders) as orders_refunded,
          (select count(*) filter (where status = 'expired')::integer from public.orders) as orders_expired,
          (select count(*) filter (where status = 'rejected')::integer from public.orders) as orders_rejected,
          (select count(*)::integer from public.orders where provider = 'manual' and status = 'pending') as pending_manual_payments,
          (select count(*)::integer from public.payment_events where status = 'unmatched') as unmatched_payment_events,
          (select count(*)::integer from public.invitations i join public.invitation_entitlements e on e.invitation_id = i.id where i.status = 'published' and e.online_until is not null and e.online_until > now()) as active_invitations,
          (select count(*)::integer from public.profiles where created_at >= now() - interval '7 days') as new_signups_7d,
          (select count(*)::integer from public.rsvps where created_at >= now() - interval '7 days') as rsvps_7d
      `;
      const row = rows[0];
      return {
        revenue: {
          todayMinor: Number(row.revenue_today_minor),
          last7dMinor: Number(row.revenue_last7d_minor),
          last30dMinor: Number(row.revenue_last30d_minor),
          currency: 'EGP'
        },
        ordersByStatus: {
          pending: row.orders_pending,
          paid: row.orders_paid,
          failed: row.orders_failed,
          refunded: row.orders_refunded,
          expired: row.orders_expired,
          rejected: row.orders_rejected
        },
        pendingManualPayments: row.pending_manual_payments,
        unmatchedPaymentEvents: row.unmatched_payment_events,
        activeInvitations: row.active_invitations,
        newSignups7d: row.new_signups_7d,
        rsvps7d: row.rsvps_7d
      };
    });
  }
}
