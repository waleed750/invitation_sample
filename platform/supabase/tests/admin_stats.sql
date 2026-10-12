-- L5 admin dashboard stats assertions. Run as table owner after migrations 0000..0019.
-- Transaction is rolled back at the end.
begin;

-- Fixtures: auth.users insert auto-creates profiles via trigger 0013
insert into auth.users(id, email) values
  ('19000000-0000-4000-8000-000000000001', 'stats-user1@example.com'),
  ('19000000-0000-4000-8000-000000000002', 'stats-user2@example.com'),
  ('19000000-0000-4000-8000-000000000003', 'stats-admin@example.com');

update public.profiles set role = 'admin' where id = '19000000-0000-4000-8000-000000000003'::uuid;

insert into public.templates(id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values ('19000000-0000-4000-8000-000000000004'::uuid, 'stats-test-template', 'اختبار', 'Stats Test',
  '{"ar":"اختبار","en":"Stats Test"}'::jsonb, '{"ar":"","en":""}'::jsonb, 'classic', 'live', true);

set local role service_role;

do $$
declare
  v_user uuid := '19000000-0000-4000-8000-000000000001'::uuid;
  v_template uuid := '19000000-0000-4000-8000-000000000004'::uuid;
  v_order_paid uuid := gen_random_uuid();
  v_order_pending uuid := gen_random_uuid();
  v_order_failed uuid := gen_random_uuid();
  v_order_refunded uuid := gen_random_uuid();
  v_order_expired uuid := gen_random_uuid();
  v_order_rejected uuid := gen_random_uuid();
  v_inv uuid := gen_random_uuid();
  v_event uuid := gen_random_uuid();
  v_row record;
begin
  -- Paid order with paid_at = now()
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at, paid_at)
  values (v_order_paid, v_user, v_template, 150000::bigint, 'EGP', 'manual', 'paid', now(), now());

  -- Pending manual order
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_order_pending, v_user, v_template, 129900::bigint, 'EGP', 'manual', 'pending', now());

  -- Orders in other statuses
  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_order_failed, v_user, v_template, 10000::bigint, 'EGP', 'manual', 'failed', now());

  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_order_refunded, v_user, v_template, 20000::bigint, 'EGP', 'manual', 'refunded', now());

  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_order_expired, v_user, v_template, 30000::bigint, 'EGP', 'manual', 'expired', now());

  insert into public.orders(id, user_id, template_id, amount_minor, currency, provider, status, created_at)
  values (v_order_rejected, v_user, v_template, 40000::bigint, 'EGP', 'manual', 'rejected', now());

  -- Payment event (unmatched)
  insert into public.payment_events(id, provider, external_id, amount_minor, currency, received_at, raw, status)
  values (v_event, 'generic-hmac', 'stats-evt-1', 129900::bigint, 'EGP', now(), '{}'::jsonb, 'unmatched');

  -- Active published invitation with online_until in the future
  insert into public.invitations(id, owner_id, template_id, order_id, slug, status)
  values (v_inv, v_user, v_template, v_order_paid, 'stats-inv-active', 'published');

  insert into public.invitation_entitlements(invitation_id, order_id, tier, edits_allowed, edits_used, online_until)
  values (v_inv, v_order_paid, 'classic', 15, 0, now() + interval '30 days');

  -- RSVP in last 7 days
  insert into public.rsvps(invitation_id, name, phone, guests_count, attending, created_at)
  values (v_inv, 'Test Guest', '+201012345678', 2, true, now());

  -- Query stats view
  select * into v_row from public.admin_stats_v;

  assert v_row.revenue_today_minor >= 150000::bigint, 'revenue_today_minor >= 150000';
  assert v_row.revenue_last7d_minor >= 150000::bigint, 'revenue_last7d_minor >= 150000';
  assert v_row.revenue_last30d_minor >= 150000::bigint, 'revenue_last30d_minor >= 150000';
  assert v_row.currency = 'EGP', 'currency is EGP';
  assert v_row.orders_paid >= 1, 'orders_paid >= 1';
  assert v_row.orders_pending >= 1, 'orders_pending >= 1';
  assert v_row.orders_failed >= 1, 'orders_failed >= 1';
  assert v_row.orders_refunded >= 1, 'orders_refunded >= 1';
  assert v_row.orders_expired >= 1, 'orders_expired >= 1';
  assert v_row.orders_rejected >= 1, 'orders_rejected >= 1';
  assert v_row.pending_manual_payments >= 1, 'pending_manual_payments >= 1';
  assert v_row.unmatched_payment_events >= 1, 'unmatched_payment_events >= 1';
  assert v_row.active_invitations >= 1, 'active_invitations >= 1';
  assert v_row.new_signups_7d >= 3, 'new_signups_7d >= 3';
  assert v_row.rsvps_7d >= 1, 'rsvps_7d >= 1';
end;
$$;

set local role authenticated;
do $$
begin
  begin
    perform 1 from public.admin_stats_v;
    raise exception 'authenticated read admin_stats_v';
  exception when insufficient_privilege then null; end;
end;
$$;

set local role anon;
do $$
begin
  assert not has_table_privilege('anon', 'public.admin_stats_v', 'SELECT');
end;
$$;

rollback;
