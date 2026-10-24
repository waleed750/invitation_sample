-- Owners can read their own order's amount allocation, and nobody else's.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('c1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'alloc-a@example.test'),
  ('c1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'alloc-b@example.test');

insert into public.orders (id, user_id, tier, kind, amount_minor, currency, provider, status) values
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'classic', 'new', 129900, 'EGP', 'manual', 'pending'),
  ('c2000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'classic', 'new', 129900, 'EGP', 'manual', 'pending');

insert into public.payment_amount_allocations (order_id, base_amount_minor, extra_minor) values
  ('c2000000-0000-4000-8000-000000000001', 129900, 7),
  ('c2000000-0000-4000-8000-000000000002', 129900, 9);

do $$
declare
  v_count integer;
  v_extra integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  select count(*), max(extra_minor) into v_count, v_extra from public.my_order_allocations();
  assert v_count = 1, 'owner must see exactly their own allocation, saw ' || v_count;
  assert v_extra = 7, 'owner must see their own extra_minor';

  begin
    perform 1 from public.payment_amount_allocations;
    assert false, 'authenticated must still not read the table directly';
  exception when insufficient_privilege then
    null;
  end;

  perform set_config('request.jwt.claims', '{"sub":"c1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
  select max(extra_minor) into v_extra from public.my_order_allocations();
  assert v_extra = 9, 'second user sees only their own allocation';

  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    perform 1 from public.my_order_allocations();
    assert false, 'anon must not call my_order_allocations';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

rollback;
