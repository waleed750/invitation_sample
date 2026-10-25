-- T22: admin tools. Every function refuses a non-admin; the licence gate; coupon uses; affiliate attribution and commission; manual refund.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('d1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't22-admin@example.test'),
  ('d1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 't22-buyer@example.test'),
  ('d1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 't22-friend@example.test');
update public.profiles set role = 'admin' where id = 'd1000000-0000-4000-8000-000000000001';

insert into public.templates (id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values ('d3000000-0000-4000-8000-000000000001', 't22-base', 'قالب', 'Base', '{"ar":"قالب","en":"Base"}'::jsonb, '{"ar":"","en":""}'::jsonb, 'classic', 'live', true);

do $$
declare
  ADMIN constant uuid := 'd1000000-0000-4000-8000-000000000001';
  BUYER constant uuid := 'd1000000-0000-4000-8000-000000000002';
  FRIEND constant uuid := 'd1000000-0000-4000-8000-000000000003';
  T constant uuid := 'd3000000-0000-4000-8000-000000000001';
  r jsonb;
  v_tpl uuid;
  v_asset uuid;
  v_aff uuid;
  v_aff_self uuid;
  v_used integer;
  v_n integer;
begin
  -- ---- non-admins are refused by every admin function
  assert (public.admin_set_setting(BUYER, 'support_whatsapp', '"+201000000000"'::jsonb)->>'reason') = 'not_admin', 'settings';
  assert (public.admin_create_coupon(BUYER, 'x-coupon', 10, null, null, null)->>'reason') = 'not_admin', 'coupon create';
  assert (public.admin_set_coupon_active(BUYER, 'x', false)->>'reason') = 'not_admin', 'coupon active';
  assert (public.admin_save_template(BUYER, null, '{}'::jsonb)->>'reason') = 'not_admin', 'template save';
  assert (public.admin_set_template_status(BUYER, T, 'retired')->>'reason') = 'not_admin', 'template status';
  assert (public.admin_save_template_asset(BUYER, T, null, '{}'::jsonb)->>'reason') = 'not_admin', 'asset save';
  assert (public.admin_delete_template_asset(BUYER, T, T)->>'reason') = 'not_admin', 'asset delete';
  assert (public.admin_save_affiliate(BUYER, null, '{}'::jsonb)->>'reason') = 'not_admin', 'affiliate save';
  assert (public.admin_record_payout(BUYER, T, 1, null, null, null, null)->>'reason') = 'not_admin', 'payout';
  assert (public.admin_mark_refunded(BUYER, T, 'x')->>'reason') = 'not_admin', 'refund';

  -- ---- settings
  assert (public.admin_set_setting(ADMIN, 'secret_key', '"x"'::jsonb)->>'reason') = 'unknown_key', 'only known keys';
  assert (public.admin_set_setting(ADMIN, 'support_whatsapp', '"not a number"'::jsonb)->>'reason') = 'invalid_value', 'whatsapp format';
  assert (public.admin_set_setting(ADMIN, 'support_whatsapp', '"+201000000000"'::jsonb)->>'ok')::boolean, 'valid whatsapp';
  assert (select value #>> '{}' from public.app_settings where key = 'support_whatsapp') = '+201000000000', 'stored';
  assert exists (select 1 from public.audit_log where action = 'settings.update' and target_id = 'support_whatsapp' and actor_id = ADMIN), 'audited';
  assert (public.admin_set_setting(ADMIN, 'payment_instructions', '"text"'::jsonb)->>'reason') = 'invalid_value', 'instructions are an object';
  assert (public.admin_set_setting(ADMIN, 'payment_instructions', '{"ar":"حوّلوا","en":"Transfer"}'::jsonb)->>'ok')::boolean, 'instructions stored';

  -- ---- coupons
  assert (public.admin_create_coupon(ADMIN, 'Bad Code!', 10, null, null, null)->>'reason') = 'invalid_code', 'code shape';
  assert (public.admin_create_coupon(ADMIN, 'both', 10, 5000, null, null)->>'reason') = 'percent_or_amount', 'percent XOR amount';
  assert (public.admin_create_coupon(ADMIN, 'none', null, null, null, null)->>'reason') = 'percent_or_amount', 'one of them is required';
  assert (public.admin_create_coupon(ADMIN, 'over', 150, null, null, null)->>'reason') = 'invalid_percent', 'percent range';
  r := public.admin_create_coupon(ADMIN, 'ONCE20', 20, null, 1, now() + interval '30 days');
  assert (r->>'ok')::boolean and r->>'code' = 'once20', 'created, code lower-cased: ' || r::text;
  assert (public.admin_create_coupon(ADMIN, 'once20', 20, null, 1, null)->>'reason') = 'code_taken', 'unique';

  -- a coupon use is counted when the order is paid (and not before)
  perform public.create_pending_checkout('d2000000-0000-4000-8000-000000000001', BUYER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, 'once20', 20000, 0, 't22-a', '{}'::jsonb, null);
  assert (select used_count from public.coupons where code = 'once20') = 0, 'a pending order is not a use';
  perform public.fulfill_paid_order('d2000000-0000-4000-8000-000000000001');
  select used_count into v_used from public.coupons where code = 'once20';
  assert v_used = 1, 'paid order counts one use: ' || v_used;
  perform public.fulfill_paid_order('d2000000-0000-4000-8000-000000000001');
  assert (select used_count from public.coupons where code = 'once20') = 1, 'a duplicate fulfilment does not count twice';
  assert (public.admin_set_coupon_active(ADMIN, 'ONCE20', false)->>'ok')::boolean, 'deactivated';
  assert not (select active from public.coupons where code = 'once20'), 'inactive';

  -- ---- template licence gate
  r := public.admin_save_template(ADMIN, null, '{"slug":"t22-new","name_ar":"جديد","name_en":"New","tier":"premium","category":"wedding","event_type":"wedding"}'::jsonb);
  assert (r->>'ok')::boolean, 'template created: ' || r::text;
  v_tpl := (r->>'id')::uuid;
  assert (select status from public.templates where id = v_tpl) = 'draft', 'starts as a draft';
  assert (public.admin_save_template(ADMIN, null, '{"slug":"t22-new","name_ar":"a","name_en":"b"}'::jsonb)->>'reason') = 'slug_taken', 'slug unique';
  assert (public.admin_save_template(ADMIN, null, '{"slug":"BAD SLUG","name_ar":"a","name_en":"b"}'::jsonb)->>'reason') = 'invalid_slug', 'slug shape';
  assert (public.admin_save_template(ADMIN, v_tpl, '{"name_ar":"جديد معدل","name_en":"New edited","tier":"premium","featured":true}'::jsonb)->>'ok')::boolean, 'edit';
  assert (select name->>'en' from public.templates where id = v_tpl) = 'New edited', 'names kept in sync';

  r := public.admin_save_template_asset(ADMIN, v_tpl, null, '{"r2_key":"templates/t22/a.webp","kind":"image"}'::jsonb);
  v_asset := (r->>'id')::uuid;
  r := public.admin_set_template_status(ADMIN, v_tpl, 'live');
  assert r->>'reason' = 'license_incomplete' and jsonb_array_length(r->'assets') = 1, 'an asset without source/licence blocks going live: ' || r::text;
  r := public.admin_save_template_asset(ADMIN, v_tpl, v_asset, '{"source":"own work","license":""}'::jsonb);
  assert (public.admin_set_template_status(ADMIN, v_tpl, 'live')->>'reason') = 'license_incomplete', 'a source alone is not enough';
  r := public.admin_save_template_asset(ADMIN, v_tpl, v_asset, '{"source":"own work","license":"CC0"}'::jsonb);
  assert (public.admin_set_template_status(ADMIN, v_tpl, 'live')->>'ok')::boolean, 'licensed asset: live';
  assert (select status from public.templates where id = v_tpl) = 'live', 'now live';
  -- the gate holds after launch: removing the licence pulls the template back to draft
  perform public.admin_save_template_asset(ADMIN, v_tpl, v_asset, '{"source":"own work","license":""}'::jsonb);
  assert (select status from public.templates where id = v_tpl) = 'draft', 'losing a licence unpublishes the template';
  assert (public.admin_set_template_status(ADMIN, v_tpl, 'retired')->>'ok')::boolean, 'draft -> retired';
  assert (public.admin_set_template_status(ADMIN, v_tpl, 'live')->>'reason') = 'invalid_transition', 'retired cannot jump to live';
  assert (public.admin_set_template_status(ADMIN, v_tpl, 'weird')->>'reason') = 'invalid_status', 'status values';
  assert (public.admin_delete_template_asset(ADMIN, v_tpl, v_asset)->>'ok')::boolean, 'asset deleted';
  assert exists (select 1 from public.audit_log where action = 'template.status' and target_id = v_tpl::text), 'status changes are audited';

  -- ---- affiliates
  r := public.admin_save_affiliate(ADMIN, null, '{"name":"Mona","ref_code":"MONA10","commission_pct":10,"customer_discount_pct":5,"phone":"+201555000111"}'::jsonb);
  assert (r->>'ok')::boolean, 'affiliate created: ' || r::text;
  v_aff := (r->>'id')::uuid;
  assert (select ref_code from public.affiliates where id = v_aff) = 'mona10', 'code lower-cased';
  assert (public.admin_save_affiliate(ADMIN, null, '{"name":"Dup","ref_code":"mona10"}'::jsonb)->>'reason') = 'code_taken', 'code unique';
  assert (public.admin_save_affiliate(ADMIN, null, '{"name":"Greedy","ref_code":"greedy","commission_pct":150}'::jsonb)->>'reason') = 'invalid_percent', 'percent bound';
  r := public.admin_save_affiliate(ADMIN, null, ('{"name":"Self","ref_code":"selfy","commission_pct":10,"phone":"+201000000777"}')::jsonb);
  v_aff_self := (r->>'id')::uuid;

  -- attribution: code beats link; a link counts for 30 days; unknown / inactive affiliates earn nothing
  perform public.create_pending_checkout('d2000000-0000-4000-8000-000000000002', BUYER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 't22-b', '{}'::jsonb, null);
  r := public.attach_order_affiliate('d2000000-0000-4000-8000-000000000002', 'nobody', 'mona10', now() - interval '31 days');
  assert (r->>'attributed')::boolean is false, 'a 31-day-old link has expired: ' || r::text;
  r := public.attach_order_affiliate('d2000000-0000-4000-8000-000000000002', null, 'mona10', now() - interval '29 days');
  assert (r->>'attributed')::boolean and r->>'attribution' = 'link', 'a 29-day-old link counts: ' || r::text;
  perform public.create_pending_checkout('d2000000-0000-4000-8000-000000000003', BUYER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 't22-c', '{}'::jsonb, null);
  r := public.attach_order_affiliate('d2000000-0000-4000-8000-000000000003', 'SELFY', 'mona10', now() - interval '1 day');
  assert r->>'attribution' = 'code' and (r->>'affiliate_id')::uuid = v_aff_self, 'the typed code beats the link: ' || r::text;
  r := public.attach_order_affiliate('d2000000-0000-4000-8000-000000000003', 'mona10', null, null);
  assert (r->>'attributed')::boolean is false, 'an order already attributed is not re-attributed';
  update public.affiliates set active = false where id = v_aff_self;
  perform public.create_pending_checkout('d2000000-0000-4000-8000-000000000004', BUYER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 't22-d', '{}'::jsonb, null);
  r := public.attach_order_affiliate('d2000000-0000-4000-8000-000000000004', 'selfy', null, null);
  assert (r->>'attributed')::boolean is false, 'an inactive affiliate earns nothing';
  r := public.attach_order_affiliate('d2000000-0000-4000-8000-000000000004', null, 'mona10', now());
  assert (r->>'attributed')::boolean, 'falls back to the link when the code is not valid';
  update public.affiliates set active = true where id = v_aff_self;

  -- commission: payable only after 7 days; refunds remove it; self-referrals are flagged
  perform public.fulfill_paid_order('d2000000-0000-4000-8000-000000000002');   -- Mona, EGP 1000
  perform public.fulfill_paid_order('d2000000-0000-4000-8000-000000000004');   -- Mona, EGP 1000
  r := public.affiliate_stats(v_aff, null, null);
  assert (r->>'orders')::int = 2 and (r->>'commission_earned_egp')::numeric = 200, 'earned 10% of two EGP 1000 orders: ' || r::text;
  assert (r->>'commission_payable_egp')::numeric = 0, 'nothing is payable inside the refund window: ' || r::text;
  assert (public.admin_record_payout(ADMIN, v_aff, 50, 'wallet', 'ref', null, null)->>'reason') = 'exceeds_payable', 'cannot pay out before the window ends';
  update public.orders set paid_at = now() - interval '8 days' where id = 'd2000000-0000-4000-8000-000000000002';
  r := public.affiliate_stats(v_aff, null, null);
  assert (r->>'commission_payable_egp')::numeric = 100 and (r->>'payable_now_egp')::numeric = 100, 'one order is past 7 days: ' || r::text;
  assert (public.admin_record_payout(ADMIN, v_aff, 150, 'wallet', 'ref', null, null)->>'reason') = 'exceeds_payable', 'more than payable is refused';
  r := public.admin_record_payout(ADMIN, v_aff, 60, 'wallet', 'W-1', null, null);
  assert (r->>'ok')::boolean, 'partial payout: ' || r::text;
  assert (public.affiliate_stats(v_aff, null, null)->>'payable_now_egp')::numeric = 40, 'payable falls by what was paid';
  assert (public.admin_record_payout(ADMIN, v_aff, 0, null, null, null, null)->>'reason') = 'invalid_amount', 'amount must be positive';
  assert (public.affiliate_stats(v_aff, current_date + 1, current_date + 5)->>'orders')::int = 0, 'date range filters orders';

  perform public.fulfill_paid_order('d2000000-0000-4000-8000-000000000003');   -- attributed to "selfy" whose phone equals the buyer's? buyer has none
  update public.profiles set phone = '+201000000777' where id = BUYER;
  r := public.affiliate_stats(v_aff_self, null, null);
  assert (r->>'self_referral_orders')::int = 1 and (r->>'commission_earned_egp')::numeric = 0, 'a self-referral earns nothing and is flagged: ' || r::text;

  -- ---- manual refund
  assert (public.admin_mark_refunded(ADMIN, 'd2000000-0000-4000-8000-000000000004', '')->>'reason') = 'note_required', 'a note is required';
  assert (public.admin_mark_refunded(ADMIN, 'd2000000-0000-4000-8000-0000000000ff', 'x')->>'reason') = 'not_found', 'unknown order';
  r := public.admin_mark_refunded(ADMIN, 'd2000000-0000-4000-8000-000000000004', 'returned by bank transfer');
  assert (r->>'ok')::boolean and (r->>'already')::boolean is false, 'refunded: ' || r::text;
  assert (select status from public.orders where id = 'd2000000-0000-4000-8000-000000000004') = 'refunded', 'status refunded';
  assert (public.admin_mark_refunded(ADMIN, 'd2000000-0000-4000-8000-000000000004', 'again')->>'already')::boolean, 'idempotent';
  r := public.affiliate_stats(v_aff, null, null);
  assert (r->>'orders')::int = 1 and (r->>'commission_earned_egp')::numeric = 100, 'a refund removes the commission: ' || r::text;
  assert (public.admin_mark_refunded(ADMIN, 'd2000000-0000-4000-8000-000000000003', 'dup test')->>'ok')::boolean, 'refund another paid order';
  assert (public.admin_mark_refunded(ADMIN, (select id from public.orders where status = 'pending' limit 1), 'x')->>'reason') is not null, 'pending orders are not refundable here';
  assert exists (select 1 from public.audit_log where action = 'order.refund_manual' and actor_id = ADMIN), 'refund audited';
end $$;

rollback;
