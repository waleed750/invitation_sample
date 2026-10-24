-- T24: points are reserved by open orders; referral rewards (once, not yourself, reversed by a refund); points about to expire.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('b1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't24-referrer@example.test'),
  ('b1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 't24-friend@example.test'),
  ('b1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 't24-veteran@example.test'),
  ('b1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 't24-spender@example.test'),
  ('b1000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 't24-second-friend@example.test');

insert into public.templates (id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values ('b3000000-0000-4000-8000-000000000001', 't24-template', 'قالب', 'Template', '{"ar":"قالب","en":"Template"}'::jsonb, '{"ar":"","en":""}'::jsonb, 'classic', 'live', true);

do $$
declare
  REF constant uuid := 'b1000000-0000-4000-8000-000000000001';
  FRIEND constant uuid := 'b1000000-0000-4000-8000-000000000002';
  VET constant uuid := 'b1000000-0000-4000-8000-000000000003';
  SPENDER constant uuid := 'b1000000-0000-4000-8000-000000000004';
  FRIEND2 constant uuid := 'b1000000-0000-4000-8000-000000000005';
  T constant uuid := 'b3000000-0000-4000-8000-000000000001';
  r jsonb; v_code text; v_balance integer; v_ledger integer;
begin
  -- ---- points are reserved by open orders
  insert into public.points_ledger (user_id, delta, reason, expires_at) values (SPENDER, 500, 'admin', now() + interval '6 months');
  update public.profiles set points_balance = 500 where id = SPENDER;
  assert public.spendable_points(SPENDER) = 500, 'all points spendable at first';
  r := public.create_pending_checkout('b2000000-0000-4000-8000-000000000001', SPENDER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 20000, 400, 's-a', '{}'::jsonb, null);
  assert r ? 'order_id', 'first order reserves 400 points: ' || r::text;
  assert public.spendable_points(SPENDER) = 100, 'the open order holds its points';
  r := public.create_pending_checkout('b2000000-0000-4000-8000-000000000002', SPENDER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 5000, 200, 's-b', '{}'::jsonb, null);
  assert r->>'reason' = 'insufficient_points' and (r->>'spendable')::int = 100, 'the same points cannot back a second order: ' || r::text;
  assert not exists (select 1 from public.orders where id = 'b2000000-0000-4000-8000-000000000002'), 'a refused order leaves no row';
  update public.orders set status = 'cancelled' where id = 'b2000000-0000-4000-8000-000000000001';
  assert public.spendable_points(SPENDER) = 500, 'cancelling frees the points';
  r := public.create_pending_checkout('b2000000-0000-4000-8000-000000000002', SPENDER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 5000, 200, 's-b', '{}'::jsonb, null);
  assert r ? 'order_id', 'a smaller redemption now fits';
  assert (public.create_pending_checkout('b2000000-0000-4000-8000-000000000003', SPENDER, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 's-c', '{}'::jsonb, null)) ? 'order_id', 'an order that redeems nothing is never blocked';

  -- ---- referral code
  v_code := public.get_referral_code(REF);
  assert v_code ~ '^f-[a-hj-np-z2-9]{8}$', 'code format: ' || v_code;
  assert public.get_referral_code(REF) = v_code, 'the code is stable';
  assert public.get_referral_code('b1000000-0000-4000-8000-0000000000ff') is null, 'unknown user';
  assert public.get_referral_code(FRIEND) <> v_code, 'codes are personal';

  -- ---- attaching a referrer
  assert (public.attach_referrer(REF, v_code)->>'why') = 'self', 'you cannot refer yourself';
  assert (public.attach_referrer(FRIEND, 'f-zzzzzzzz')->>'why') = 'unknown_code', 'unknown code';
  perform public.create_pending_checkout('b2000000-0000-4000-8000-000000000010', VET, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 'v-a', '{}'::jsonb, null);
  perform public.fulfill_paid_order('b2000000-0000-4000-8000-000000000010');
  assert (public.attach_referrer(VET, v_code)->>'why') = 'not_a_new_customer', 'someone who already bought is not "a new friend"';
  r := public.attach_referrer(FRIEND, upper(v_code));
  assert (r->>'attached')::boolean, 'a new customer is attached (case-insensitive): ' || r::text;
  assert (public.attach_referrer(FRIEND, public.get_referral_code(SPENDER))->>'why') = 'already_referred', 'one referrer per friend';
  assert (select referred_by from public.profiles where id = FRIEND) = REF, 'recorded';

  -- ---- the reward: friend's first paid NEW order, once
  perform public.create_pending_checkout('b2000000-0000-4000-8000-000000000011', FRIEND, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 'f-a', '{}'::jsonb, null);
  assert (select points_balance from public.profiles where id = REF) = 0, 'no reward while the order is only pending';
  perform public.fulfill_paid_order('b2000000-0000-4000-8000-000000000011');
  select points_balance into v_balance from public.profiles where id = REF;
  assert v_balance = 100, 'referrer got +100: ' || v_balance;
  assert exists (select 1 from public.points_ledger where user_id = REF and reason = 'referral' and delta = 100 and order_id = 'b2000000-0000-4000-8000-000000000011'), 'ledger row tied to the friend''s order';
  assert (select referral_rewarded_at from public.profiles where id = FRIEND) is not null, 'friend marked as rewarded';
  perform public.create_pending_checkout('b2000000-0000-4000-8000-000000000012', FRIEND, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 'f-b', '{}'::jsonb, null);
  perform public.fulfill_paid_order('b2000000-0000-4000-8000-000000000012');
  select count(*) into v_ledger from public.points_ledger where user_id = REF and reason = 'referral';
  assert v_ledger = 1, 'a second order of the same friend rewards nothing: ' || v_ledger;
  perform public.fulfill_paid_order('b2000000-0000-4000-8000-000000000011');
  assert (select count(*) from public.points_ledger where user_id = REF and reason = 'referral') = 1, 'a duplicate fulfilment rewards nothing';
  r := public.referral_summary(REF);
  assert (r->>'invited')::int = 1 and (r->>'rewarded')::int = 1, 'summary: ' || r::text;

  -- an extension is not a "first purchase"
  perform public.attach_referrer(FRIEND2, v_code);
  perform public.create_pending_checkout('b2000000-0000-4000-8000-000000000020', FRIEND2, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 'g-a', '{}'::jsonb, null);
  update public.orders set status = 'cancelled' where id = 'b2000000-0000-4000-8000-000000000020';
  assert (select points_balance from public.profiles where id = REF) = 100, 'a cancelled order rewards nothing';

  -- ---- a refund takes the reward back, and it is not granted again
  perform public.refund_order('b2000000-0000-4000-8000-000000000011');
  select points_balance into v_balance from public.profiles where id = REF;
  assert v_balance = 0, 'refund reverses the reward in the referrer''s balance: ' || v_balance;
  assert (select coalesce(sum(delta), 0) from public.points_ledger where user_id = REF and (expires_at is null or expires_at > now())) = 0, 'ledger agrees with the cache';
  perform public.create_pending_checkout('b2000000-0000-4000-8000-000000000013', FRIEND, T, 'classic', 'new', 100000, 'EGP', 'manual', null, null, 0, 0, 'f-c', '{}'::jsonb, null);
  perform public.fulfill_paid_order('b2000000-0000-4000-8000-000000000013');
  assert (select points_balance from public.profiles where id = REF) = 0, 'a re-purchase after a refund is not rewarded again';
  -- the friend's own points follow the refund too
  assert (select count(*) from public.points_ledger where user_id = FRIEND and order_id = 'b2000000-0000-4000-8000-000000000011' and reason = 'refund') >= 1, 'buyer''s points reversed as before';

  -- ---- points about to expire
  insert into public.points_ledger (user_id, delta, reason, expires_at) values
    (VET, 300, 'admin', now() + interval '10 days'),
    (VET, 200, 'admin', now() + interval '100 days'),
    (VET, -100, 'redeem', null);
  r := public.points_expiring_soon(VET, 30);
  assert (r->>'points')::int = 300, 'the balance will really drop by the 300 that expire (the 100 spent never expire; later rows stay): ' || r::text;
  assert (r->>'first_expiry') is not null, 'the first expiry date is reported';
  assert (public.points_expiring_soon(VET, 3)->>'points')::int = 0, 'nothing within 3 days';
  -- spent points never expire, so they can lower the loss but never make it negative
  insert into public.points_ledger (user_id, delta, reason, expires_at) values (SPENDER, -500, 'redeem', null);
  assert (public.points_expiring_soon(SPENDER, 400)->>'points')::int = 0, 'never negative';
  assert (public.points_expiring_soon(SPENDER, 30)->>'points')::int = 0, 'points expiring after the window are not counted';
end $$;

rollback;
