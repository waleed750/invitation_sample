-- 0019_admin_stats.sql — L5: admin dashboard stats view.
-- Aggregates overview metrics for the SaaS admin dashboard (service_role only).

create or replace view public.admin_stats_v as
select
  coalesce((select sum(amount_minor) from public.orders where status = 'paid' and currency = 'EGP' and paid_at >= date_trunc('day', now())), 0)::bigint as revenue_today_minor,
  coalesce((select sum(amount_minor) from public.orders where status = 'paid' and currency = 'EGP' and paid_at >= now() - interval '7 days'), 0)::bigint as revenue_last7d_minor,
  coalesce((select sum(amount_minor) from public.orders where status = 'paid' and currency = 'EGP' and paid_at >= now() - interval '30 days'), 0)::bigint as revenue_last30d_minor,
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
  (select count(*)::integer from public.rsvps where created_at >= now() - interval '7 days') as rsvps_7d;

revoke all on public.admin_stats_v from public, anon, authenticated;
grant select on public.admin_stats_v to service_role;
