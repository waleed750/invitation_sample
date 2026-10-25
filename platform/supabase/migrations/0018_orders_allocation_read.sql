-- GET /v1/orders and /v1/orders/:id read the customer's own unique-piaster
-- allocation as the `authenticated` role, but payment_amount_allocations is
-- (deliberately) not readable by that role, so both endpoints failed with 503.
-- The table stays locked; this function exposes only the caller's own rows.
create or replace function public.my_order_allocations()
returns table (order_id uuid, extra_minor integer)
language sql
security definer
stable
set search_path = public
as $$
  select a.order_id, a.extra_minor
  from public.payment_amount_allocations a
  join public.orders o on o.id = a.order_id
  where o.user_id = auth.uid()
$$;

revoke all on function public.my_order_allocations() from public, anon;
grant execute on function public.my_order_allocations() to authenticated, service_role;
