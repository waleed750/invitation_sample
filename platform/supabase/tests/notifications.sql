-- notifications.sql — assertions for expire_stale_manual_orders_returning_ids.
-- Run as table owner after migrations 0000..0020.
begin;

insert into auth.users(id, email) values
  ('20000000-0000-4000-8000-000000000001', 'notif-user@example.com');

insert into public.templates(id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values ('20000000-0000-4000-8000-000000000002'::uuid, 'notif-template', 'اختبار', 'Notif Test',
  '{"ar":"اختبار","en":"Notif Test"}'::jsonb, '{"ar":"","en":""}'::jsonb, 'classic', 'live', true);

set local role service_role;

do $$
declare
  v_user uuid := '20000000-0000-4000-8000-000000000001'::uuid;
  v_template uuid := '20000000-0000-4000-8000-000000000002'::uuid;
  v_stale_order uuid := gen_random_uuid();
  v_fresh_order uuid := gen_random_uuid();
  v_other_order uuid := gen_random_uuid();
  v_expired_id uuid;
  v_count integer := 0;
  v_status text;
begin
  -- Stale manual pending order (older than 72 hours)
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_stale_order, v_user, v_template, 129900::bigint, 'EGP', 'manual', 'pending', now() - interval '75 hours');

  -- Fresh manual pending order (within 72 hours)
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_fresh_order, v_user, v_template, 129900::bigint, 'EGP', 'manual', 'pending', now() - interval '10 hours');

  -- Stale order with non-manual provider
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_other_order, v_user, v_template, 129900::bigint, 'EGP', 'fawry', 'pending', now() - interval '75 hours');

  -- Run expiry function returning IDs
  for v_expired_id in select id from public.expire_stale_manual_orders_returning_ids()
  loop
    v_count := v_count + 1;
    assert v_expired_id = v_stale_order, 'returned expired id matches stale order';
  end loop;

  assert v_count = 1, 'exactly 1 order expired';

  -- Verify stale order is now expired
  select status into v_status from public.orders where id = v_stale_order;
  assert v_status = 'expired', 'stale order flipped to expired';

  -- Verify fresh order is still pending
  select status into v_status from public.orders where id = v_fresh_order;
  assert v_status = 'pending', 'fresh order remains pending';

  -- Verify non-manual order is still pending
  select status into v_status from public.orders where id = v_other_order;
  assert v_status = 'pending', 'non-manual order remains pending';
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform id from public.expire_stale_manual_orders_returning_ids();
    raise exception 'authenticated should not execute expire_stale_manual_orders_returning_ids';
  exception when insufficient_privilege then null; end;
end;
$$;

set local role anon;
do $$
begin
  assert not has_function_privilege('anon', 'public.expire_stale_manual_orders_returning_ids(interval)', 'EXECUTE'),
    'anon has no execute privilege';
end;
$$;

rollback;
