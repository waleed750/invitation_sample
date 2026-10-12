-- 0020_expired_ids.sql — expire stale manual orders returning expired order ids (service_role only).

create or replace function public.expire_stale_manual_orders_returning_ids(
  p_older_than interval default interval '72 hours'
)
returns table(id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.orders
  set status = 'expired'
  where provider = 'manual'
    and status = 'pending'
    and created_at < now() - p_older_than
  returning public.orders.id;
end;
$$;

revoke all on function public.expire_stale_manual_orders_returning_ids(interval)
  from public, anon, authenticated;
grant execute on function public.expire_stale_manual_orders_returning_ids(interval)
  to service_role;
