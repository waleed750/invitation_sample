-- L3 payment event assertions. Run as table owner after migrations 0000..0016.
-- No database is available in the lane sandbox; CI executes this transaction.
begin;
insert into auth.users(id, email) values
  ('16000000-0000-4000-8000-000000000001', 'payment-events-test@example.com'),
  ('16000000-0000-4000-8000-000000000002', 'payment-events-admin@example.com');
-- 0013 creates the profiles, so update rather than inserting a second profile.
update public.profiles set role = 'admin' where id = '16000000-0000-4000-8000-000000000002'::uuid;
insert into public.templates(id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values ('16000000-0000-4000-8000-000000000003'::uuid, 'payment-events-test', 'اختبار', 'Payment test',
  '{"ar":"اختبار","en":"Payment test"}'::jsonb, '{"ar":"","en":""}'::jsonb, 'classic', 'live', true);

set local role service_role;
do $$
declare
  v_user uuid := '16000000-0000-4000-8000-000000000001'::uuid;
  v_admin uuid := '16000000-0000-4000-8000-000000000002'::uuid;
  v_template uuid := '16000000-0000-4000-8000-000000000003'::uuid;
  v_one uuid := gen_random_uuid();
  v_two uuid := gen_random_uuid();
  v_three uuid := gen_random_uuid();
  v_inv uuid := gen_random_uuid();
  v_event uuid := gen_random_uuid();
  v_bad uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_extra_order uuid;
  v_admin_order uuid := gen_random_uuid();
  v_admin_event uuid := gen_random_uuid();
  v_r jsonb;
  v_first jsonb;
  v_before jsonb;
  v_audits bigint;
  v_points bigint;
  n integer;
begin
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, provider_ref, created_at)
    values (v_one, v_user, v_template, 129900::bigint, 'EGP', 'manual', 'INV-L30001', now() - interval '1 hour'),
      (v_two, v_user, v_template, 129900::bigint, 'EGP', 'manual', 'INV-L30002', now() - interval '1 hour'),
      (v_three, v_user, v_template, 129900::bigint, 'EGP', 'manual', 'INV-L30003', now() - interval '1 hour');
  v_first := public.allocate_unique_amount(v_one);
  assert (v_first ->> 'extra_minor')::integer = 1, 'smallest extra';
  assert public.allocate_unique_amount(v_one) = v_first, 'allocation idempotent';
  v_r := public.allocate_unique_amount(v_two);
  assert (v_r ->> 'extra_minor')::integer = 2, 'pending orders have different totals';
  assert (select count(*) from public.payment_amount_allocations where order_id = v_one) = 1;

  -- Overlapping bases must also be unique, not merely different extras.
  v_extra_order := gen_random_uuid();
  insert into public.orders(id, amount_minor, currency, provider) values (v_extra_order, 129901::bigint, 'EGP', 'manual');
  v_r := public.allocate_unique_amount(v_extra_order);
  assert (v_r ->> 'amount_minor')::bigint = 129903::bigint, 'different bases cannot collide';
  update public.orders set status = 'rejected' where id = v_extra_order;

  update public.orders set status = 'expired' where id = v_two;
  v_r := public.allocate_unique_amount(v_three);
  assert (v_r ->> 'extra_minor')::integer = 2, 'nonpending allocation released by status join';
  assert public.allocate_unique_amount(v_two) ->> 'reason' = 'not_pending';

  insert into public.invitations(id, owner_id, template_id, order_id, slug)
    values (v_inv, v_user, v_template, v_one, 'l3-payment-invitation');
  insert into public.payment_events(id, provider, external_id, amount_minor, currency, received_at, raw)
    values (v_event, 'generic-hmac', 'l3-transfer-one', 129901::bigint, 'EGP', now(), '{}'::jsonb),
      (v_bad, 'generic-hmac', 'l3-transfer-bad', 1::bigint, 'EGP', now(), '{}'::jsonb);

  select to_jsonb(o) into v_before from public.orders o where id = v_one;
  v_r := public.system_confirm_payment(v_bad, v_one, 'generic-hmac');
  assert v_r ->> 'reason' = 'amount_mismatch';
  assert (select to_jsonb(o) from public.orders o where id = v_one) = v_before, 'mismatch writes no order fields';
  assert (select status from public.payment_events where id = v_bad) = 'received';
  assert not exists (select 1 from public.audit_log where target_id = v_one::text);
  assert not exists (select 1 from public.invitation_entitlements where invitation_id = v_inv);
  update public.payment_events set amount_minor = 129901::bigint, currency = 'USD' where id = v_bad;
  assert public.system_confirm_payment(v_bad, v_one, 'generic-hmac') ->> 'reason' = 'amount_mismatch', 'currency mismatch';
  assert public.system_confirm_payment(v_event, v_one, 'easyconfirm') ->> 'reason' = 'provider_mismatch';
  update public.payment_events set currency = 'EGP', received_at = now() - interval '2 hours' where id = v_bad;
  assert public.system_confirm_payment(v_bad, v_one, 'generic-hmac') ->> 'reason' = 'outside_window';

  v_r := public.system_confirm_payment(v_event, v_one, 'generic-hmac');
  assert (v_r ->> 'ok')::boolean and not (v_r ->> 'already')::boolean;
  assert (select status from public.orders where id = v_one) = 'paid';
  assert (select paid_amount_minor from public.orders where id = v_one) = 129901::bigint;
  assert (select payment_txn_ref from public.orders where id = v_one) = 'l3-transfer-one';
  assert exists (select 1 from public.invitation_entitlements where invitation_id = v_inv and edits_allowed = 15);
  assert exists (select 1 from public.payment_events where id = v_event and status = 'matched' and order_id = v_one);
  assert exists (select 1 from public.audit_log where target_id = v_one::text and actor_id is null
    and action = 'order.auto_confirm' and details ->> 'provider' = 'generic-hmac'
    and details ->> 'event_id' = v_event::text and (details ->> 'paid_amount_minor')::bigint = 129901::bigint);
  select count(*) into v_audits from public.audit_log;
  select count(*) into v_points from public.points_ledger;
  select to_jsonb(o) into v_before from public.orders o where id = v_one;
  assert public.system_confirm_payment(v_event, v_one, 'generic-hmac') = '{"ok":true,"already":true}'::jsonb;
  assert (select count(*) from public.audit_log) = v_audits;
  assert (select count(*) from public.points_ledger) = v_points;
  assert (select to_jsonb(o) from public.orders o where id = v_one) = v_before;
  assert public.system_confirm_payment(v_event, v_three, 'generic-hmac') ->> 'reason' = 'event_already_matched';
  assert (select status from public.orders where id = v_three) = 'pending';

  insert into public.orders(id, amount_minor, currency, provider, created_at)
    values (v_other, 1::bigint, 'EGP', 'mock', now() - interval '1 hour');
  assert public.system_confirm_payment(v_bad, v_other, 'generic-hmac') ->> 'reason' = 'not_manual';
  assert public.allocate_unique_amount(v_other) ->> 'reason' = 'not_manual';
  assert public.system_confirm_payment(v_bad, v_two, 'generic-hmac') ->> 'reason' = 'not_pending';
  update public.orders set provider = 'manual', created_at = now() - interval '73 hours' where id = v_other;
  assert public.system_confirm_payment(v_bad, v_other, 'generic-hmac') ->> 'reason' = 'not_pending', 'stale pending is expired even before cron';
  assert public.allocate_unique_amount(gen_random_uuid()) ->> 'reason' = 'not_found';
  assert public.system_confirm_payment(gen_random_uuid(), v_three, 'generic-hmac') ->> 'reason' = 'not_found';

  -- Admin uses the same rules; actor/note are preserved and retries are no-ops.
  insert into public.orders(id, user_id, amount_minor, currency, provider, created_at)
    values (v_admin_order, v_user, 500::bigint, 'EGP', 'manual', now() - interval '1 hour');
  insert into public.payment_events(id, provider, external_id, amount_minor, currency, received_at, raw)
    values (v_admin_event, 'easyconfirm', 'l3-admin-transfer', 499::bigint, 'EGP', now(), '{}'::jsonb);
  assert public.admin_assign_payment_event(v_user, v_admin_event, v_admin_order, 'review') ->> 'reason' = 'not_admin';
  assert public.admin_assign_payment_event(v_admin, v_admin_event, v_admin_order, 'review') ->> 'reason' = 'amount_mismatch';
  assert public.admin_assign_payment_event(v_admin, v_admin_event, v_admin_order, '') ->> 'reason' = 'note_required';
  update public.payment_events set amount_minor = 500::bigint where id = v_admin_event;
  assert (public.admin_assign_payment_event(v_admin, v_admin_event, v_admin_order, 'Verified transfer') ->> 'ok')::boolean;
  assert exists (select 1 from public.audit_log where target_id = v_admin_order::text and actor_id = v_admin
    and action = 'order.assign_payment_event' and details ->> 'note' = 'Verified transfer');
  assert (select confirmed_by from public.orders where id = v_admin_order) = v_admin;
  select count(*) into v_audits from public.audit_log;
  assert public.admin_assign_payment_event(v_admin, v_admin_event, v_admin_order, 'Retry') = '{"ok":true,"already":true}'::jsonb;
  assert (select count(*) from public.audit_log) = v_audits;

  -- Exhaust all 99 slots, while a different currency still gets slot 1.
  for n in 1..99 loop
    v_extra_order := gen_random_uuid();
    insert into public.orders(id, amount_minor, currency, provider) values (v_extra_order, 900000::bigint, 'EGP', 'manual');
    v_r := public.allocate_unique_amount(v_extra_order);
    assert (v_r ->> 'extra_minor')::integer = n;
  end loop;
  v_extra_order := gen_random_uuid();
  insert into public.orders(id, amount_minor, currency, provider) values (v_extra_order, 900000::bigint, 'EGP', 'manual');
  assert public.allocate_unique_amount(v_extra_order) ->> 'reason' = 'no_slot';
  update public.orders set currency = 'USD' where id = v_extra_order;
  assert (public.allocate_unique_amount(v_extra_order) ->> 'extra_minor')::integer = 1;

  begin
    insert into public.payment_events(provider, external_id, amount_minor, currency, received_at, raw)
      values ('generic-hmac', 'l3-transfer-one', 129901::bigint, 'EGP', now(), '{}'::jsonb);
    raise exception 'duplicate external ID was accepted';
  exception when unique_violation then null;
  end;
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform public.allocate_unique_amount(gen_random_uuid());
    raise exception 'authenticated allocated an amount';
  exception when insufficient_privilege then null; end;
  begin
    perform public.system_confirm_payment(gen_random_uuid(), gen_random_uuid(), 'generic-hmac');
    raise exception 'authenticated confirmed a payment';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_assign_payment_event(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'note');
    raise exception 'authenticated assigned a payment';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.payment_events;
    raise exception 'authenticated read private notifications';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.payment_amount_allocations;
    raise exception 'authenticated read private allocations';
  exception when insufficient_privilege then null; end;
end;
$$;
set local role anon;
do $$
begin
  assert not has_function_privilege('anon', 'public.allocate_unique_amount(uuid)', 'EXECUTE');
  assert not has_function_privilege('anon', 'public.system_confirm_payment(uuid,uuid,text)', 'EXECUTE');
  assert not has_function_privilege('anon', 'public.admin_assign_payment_event(uuid,uuid,uuid,text)', 'EXECUTE');
  assert not has_table_privilege('anon', 'public.payment_events', 'SELECT');
  assert not has_table_privilege('anon', 'public.payment_amount_allocations', 'SELECT');
end;
$$;
rollback;
