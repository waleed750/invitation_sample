-- tests/rls_and_fulfillment.sql — money + privacy assertions.
--
-- RUN:  psql "$DATABASE_URL" -f tests/rls_and_fulfillment.sql
--   (run AFTER applying migrations/0001..0003 in order, against a throwaway
--   test project — never production. Connect as the database owner, e.g. the
--   `postgres` role, because the file uses SET LOCAL ROLE to impersonate
--   `service_role` and `anon`.)
--
-- Everything runs inside ONE transaction that is ROLLED BACK at the end, so
-- no test data survives. Any failed ASSERT aborts with an error.
--
-- What is covered:
--   1. duplicate fulfill_paid_order() calls change nothing the second time
--   2. a classic first order yields 15 edits / ~6 months online / 129 + 50 pts
--   3. the 2nd paid order lifts the level to silver; the 3rd earns the
--      silver 1.10x multiplier
--   4. refund_order() reverses points and recomputes counters
--   5. assert_can_publish() boundary: edits_used = edits_allowed, expiry
--   6. anon cannot select a draft invitation (but sees published ones)
--   7. prices: EGP tier defaults seeded, public read of active rows, no client
--      writes; a non-EGP paid order earns 0 points
--   8. manual payments (0009): confirm, idempotent re-confirm, mismatch rules,
--      reject, expiry; authenticated cannot execute the admin RPCs

begin;

-- ---------------------------------------------------------------------------
-- 0. Test scaffolding.
-- ---------------------------------------------------------------------------

-- On real Supabase, auth.uid() reads the JWT claims. Impersonate the test
-- owner by setting the claims GUC directly (exactly what PostgREST does per
-- request). On a bare-Postgres throwaway without Supabase Auth, provide a
-- minimal auth.uid() stub instead — but NEVER overwrite the real one.
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute 'create schema if not exists auth';
    execute $stub$
      create function auth.uid() returns uuid
      language sql stable as $uid_body$
        select ((nullif(current_setting('request.jwt.claims', true), '')::json)->>'sub')::uuid
      $uid_body$;
    $stub$;
  end if;
end;
$$;

-- Fixed test ids (readable, deterministic).
--  users/profiles : 11111111-1111-1111-1111-111111111111
--  template       : 22222222-2222-2222-2222-222222222222
--  order 1 / inv 1: 33333333-... / 44444444-...
--  order 2 / inv 2: 55555555-... / 66666666-...
--  order 3 / inv 3: 77777777-... / 88888888-...

-- auth.users row for the FK. Portable: only (id, aud, role) — instance_id is
-- nullable on Supabase, and auth.instances does not exist on bare Postgres.
insert into auth.users (id, aud, role)
values (
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated'
)
on conflict (id) do nothing;

insert into public.profiles (id, phone, email, name, preferred_locale, signup_method)
values (
  '11111111-1111-1111-1111-111111111111',
  '+201000000001', 'fulfill-test@example.com', 'Test Couple', 'ar', 'whatsapp'
)
on conflict (id) do update set
  purchases_count = 0, level = 'member', points_balance = 0;

insert into public.templates (id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values (
  '22222222-2222-2222-2222-222222222222',
  'test-classic', 'قالب تجريبي', 'Test Classic',
  jsonb_build_object('ar', 'قالب تجريبي', 'en', 'Test Classic'),
  jsonb_build_object('ar', '', 'en', ''), 'classic', 'live', true
)
on conflict (id) do update set status = 'live';

-- Order 1: first classic order, EGP 1299 (amount_minor 129900). Event 3 weeks out so the
-- "now + 6 months" leg wins over the "event + 14 days" floor.
insert into public.orders (id, user_id, template_id, tier, kind, amount_minor, currency, provider, status)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'classic', 'new', 129900, 'EGP', 'manual', 'pending'
)
on conflict (id) do update set status = 'pending', paid_at = null, refunded_at = null;

insert into public.invitations (id, owner_id, template_id, order_id, slug, data, status)
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  'test-ahmed-mona',
  '{"event_date": "2026-10-20"}',
  'draft'
)
on conflict (id) do update set status = 'draft', published_at = null;

-- ---------------------------------------------------------------------------
-- 1 + 2. Fulfill order 1 (as service_role, like the webhook handler).
-- ---------------------------------------------------------------------------

set local role service_role;

do $$
declare
  r jsonb;
begin
  r := public.fulfill_paid_order('33333333-3333-3333-3333-333333333333');
  assert (r ->> 'ok') = 'true', 'order 1 must fulfill, got: ' || r::text;

  -- Classic tier: 15 edits, 2 template switches.
  assert (select edits_allowed from public.invitation_entitlements
          where invitation_id = '44444444-4444-4444-4444-444444444444') = 15,
    'classic must grant 15 edits';
  assert (select template_switches_left from public.invitation_entitlements
          where invitation_id = '44444444-4444-4444-4444-444444444444') = 2,
    'classic must grant 2 template switches';

  -- ~6 months online (event floor 2026-11-03 loses to now()+6mo).
  assert (select online_until from public.invitation_entitlements
          where invitation_id = '44444444-4444-4444-4444-444444444444')
         between now() + interval '5 months' and now() + interval '7 months',
    'classic online_until must be ~6 months out';

  -- Points: floor(1299/10) = 129 x member 1.0 + 50 first-order bonus = 179.
  assert (select points_balance from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 179,
    'first classic order must yield 129 + 50 = 179 points';
  assert (select purchases_count from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 1,
    'purchases_count must be 1';
  assert (select level from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 'member',
    '1 purchase must stay member';
end;
$$;

-- ---------------------------------------------------------------------------
-- Duplicate webhook: second call changes NOTHING.
-- ---------------------------------------------------------------------------

do $$
declare
  r        jsonb;
  v_before integer;
  v_after  integer;
  b_before integer;
  b_after  integer;
  e_before integer;
  e_after  integer;
begin
  select count(*) into v_before from public.points_ledger
  where order_id = '33333333-3333-3333-3333-333333333333';
  select points_balance, purchases_count into b_before, e_before from public.profiles
  where id = '11111111-1111-1111-1111-111111111111';

  r := public.fulfill_paid_order('33333333-3333-3333-3333-333333333333');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'already_processed',
    'duplicate fulfill must report already_processed, got: ' || r::text;

  select count(*) into v_after from public.points_ledger
  where order_id = '33333333-3333-3333-3333-333333333333';
  select points_balance, purchases_count into b_after, e_after from public.profiles
  where id = '11111111-1111-1111-1111-111111111111';

  assert v_after = v_before, 'duplicate fulfill must not add ledger rows';
  assert b_after = b_before, 'duplicate fulfill must not change points';
  assert e_after = e_before, 'duplicate fulfill must not change purchases_count';
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Orders 2 + 3: silver at 2 purchases; silver 1.10x on the 3rd.
-- ---------------------------------------------------------------------------

insert into public.orders (id, user_id, template_id, tier, kind, amount_minor, currency, provider, status)
values (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'classic', 'new', 129900, 'EGP', 'manual', 'pending'
)
on conflict (id) do update set status = 'pending', paid_at = null, refunded_at = null;

insert into public.invitations (id, owner_id, template_id, order_id, slug, data, status)
values (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  'test-ahmed-mona-2',
  '{"event_date": "2026-10-20"}',
  'draft'
)
on conflict (id) do update set status = 'draft', published_at = null;

insert into public.orders (id, user_id, template_id, tier, kind, amount_minor, currency, provider, status)
values (
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'classic', 'new', 129900, 'EGP', 'manual', 'pending'
)
on conflict (id) do update set status = 'pending', paid_at = null, refunded_at = null;

insert into public.invitations (id, owner_id, template_id, order_id, slug, data, status)
values (
  '88888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '77777777-7777-7777-7777-777777777777',
  'test-ahmed-mona-3',
  '{"event_date": "2026-10-20"}',
  'draft'
)
on conflict (id) do update set status = 'draft', published_at = null;

do $$
declare
  r jsonb;
begin
  -- Order 2: still member multiplier (level before = member): +129, no bonus.
  r := public.fulfill_paid_order('55555555-5555-5555-5555-555555555555');
  assert (r ->> 'ok') = 'true', 'order 2 must fulfill, got: ' || r::text;
  assert (select level from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 'silver',
    '2 purchases must lift level to silver';
  assert (select points_balance from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 179 + 129,
    'order 2 (member mult) must add exactly 129 points';

  -- Order 3: silver multiplier floor(129 * 1.10) = 141.
  r := public.fulfill_paid_order('77777777-7777-7777-7777-777777777777');
  assert (r ->> 'ok') = 'true', 'order 3 must fulfill, got: ' || r::text;
  assert (select points_balance from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 179 + 129 + 141,
    'order 3 (silver mult) must add exactly 141 points';
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. refund_order(order 2): takes back its 129, restores counters.
-- ---------------------------------------------------------------------------

do $$
declare
  r jsonb;
begin
  r := public.refund_order('55555555-5555-5555-5555-555555555555');
  assert (r ->> 'ok') = 'true', 'refund must succeed, got: ' || r::text;

  assert (select status from public.orders
          where id = '55555555-5555-5555-5555-555555555555') = 'refunded',
    'order 2 must be refunded';
  assert (select points_balance from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 179 + 141,
    'refund must reverse exactly the 129 earned points';
  assert (select purchases_count from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 2,
    'refund must drop purchases_count back to 2';
  assert (select level from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 'silver',
    '2 remaining paid orders must keep silver';
  assert exists (select 1 from public.points_ledger
                 where order_id = '55555555-5555-5555-5555-555555555555'
                   and reason = 'refund' and delta = -129),
    'refund must write a compensating -129 refund row';

  -- Second refund attempt: not refundable.
  r := public.refund_order('55555555-5555-5555-5555-555555555555');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'not_refundable',
    'double refund must be rejected, got: ' || r::text;
end;
$$;

-- 4b. A non-EGP paid order earns 0 points (TODO(B14) in fulfill_paid_order).
insert into public.orders (id, user_id, template_id, tier, kind, amount_minor, currency, provider, status)
values (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'classic', 'addon', 500000, 'USD', 'manual', 'pending'
);

do $$
declare
  r jsonb;
begin
  r := public.fulfill_paid_order('99999999-9999-9999-9999-999999999999');
  assert (r ->> 'ok') = 'true', 'USD order must fulfill, got: ' || r::text;
  assert (select points_earned from public.orders
          where id = '99999999-9999-9999-9999-999999999999') = 0,
    'non-EGP order must earn 0 points';
  assert not exists (select 1 from public.points_ledger
                     where order_id = '99999999-9999-9999-9999-999999999999'),
    'non-EGP order must write no ledger rows';
  assert (select points_balance from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 179 + 141,
    'non-EGP order must not change the points balance';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- 5. assert_can_publish() boundaries (impersonate the owner via JWT claims).
-- ---------------------------------------------------------------------------

set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

do $$
declare
  g jsonb;
begin
  -- Healthy draft: ok.
  g := public.assert_can_publish('44444444-4444-4444-4444-444444444444');
  assert (g ->> 'ok') = 'true', 'fresh draft must be publishable, got: ' || g::text;

  -- Edit budget exhausted -> no_edits_left.
  update public.invitation_entitlements
  set edits_used = edits_allowed
  where invitation_id = '44444444-4444-4444-4444-444444444444';
  g := public.assert_can_publish('44444444-4444-4444-4444-444444444444');
  assert (g ->> 'ok') = 'false' and (g ->> 'reason') = 'no_edits_left',
    'exhausted edits must report no_edits_left, got: ' || g::text;

  -- Restore edits, expire the window -> expired.
  update public.invitation_entitlements
  set edits_used = 0,
      online_until = now() - interval '1 day'
  where invitation_id = '44444444-4444-4444-4444-444444444444';
  g := public.assert_can_publish('44444444-4444-4444-4444-444444444444');
  assert (g ->> 'ok') = 'false' and (g ->> 'reason') = 'expired',
    'past online_until must report expired, got: ' || g::text;

  -- Stranger's invitation -> not_owner.
  g := public.assert_can_publish('00000000-0000-0000-0000-000000000000');
  assert (g ->> 'ok') = 'false' and (g ->> 'reason') = 'not_owner',
    'unknown invitation must report not_owner, got: ' || g::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. anon cannot select a draft (but sees published invitations).
-- Publish inv 1 through the server path (no JWT -> guard allows it),
-- then drop to the anon role.
-- ---------------------------------------------------------------------------

reset "request.jwt.claims";

update public.invitations
set status = 'published', published_at = now()
where id = '44444444-4444-4444-4444-444444444444';

-- The migration revokes default anon privileges and grants back only the
-- policy-filtered public SELECTs — re-grant idempotently so this asserts on
-- the RLS *policy* (row filtering), not on a missing grant.
grant select on table public.invitations to anon;

set local role anon;

do $$
declare
  v_drafts integer;
  v_all    integer;
begin
  select count(*) into v_drafts from public.invitations where status = 'draft';
  assert v_drafts = 0, 'anon must not see draft invitations';

  select count(*) into v_all from public.invitations;
  assert v_all = 1, 'anon must see exactly the one published invitation';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- 7. prices: seeded EGP tier defaults, public read, no client writes.
-- ---------------------------------------------------------------------------

do $$
begin
  assert (select amount_minor from public.prices
          where template_id is null and tier = 'save_the_date' and currency = 'EGP' and active) = 49900,
    'save_the_date EGP default must be 49900';
  assert (select amount_minor from public.prices
          where template_id is null and tier = 'classic' and currency = 'EGP' and active) = 129900,
    'classic EGP default must be 129900';
  assert (select amount_minor from public.prices
          where template_id is null and tier = 'premium' and currency = 'EGP' and active) = 249900,
    'premium EGP default must be 249900';
end;
$$;

-- Only one active row per (template, tier, currency).
do $$
begin
  begin
    insert into public.prices (template_id, tier, currency, amount_minor)
    values (null, 'classic', 'EGP', 1);
    assert false, 'duplicate active tier default must be rejected';
  exception when unique_violation then
    null;
  end;
end;
$$;

-- A template-specific price plus an inactive one (invisible to clients).
insert into public.prices (template_id, tier, currency, amount_minor, active)
values
  ('22222222-2222-2222-2222-222222222222', 'classic', 'EGP', 99900, true),
  ('22222222-2222-2222-2222-222222222222', 'premium', 'EGP', 1000, false);

set local role anon;

do $$
begin
  assert (select count(*) from public.prices
          where template_id = '22222222-2222-2222-2222-222222222222' and active) = 1,
    'anon must read the active template price';
  assert (select amount_minor from public.prices
          where template_id = '22222222-2222-2222-2222-222222222222' and tier = 'classic') = 99900,
    'anon must read the template classic price';
  assert (select count(*) from public.prices where not active) = 0,
    'anon must not see inactive prices';

  begin
    insert into public.prices (template_id, tier, currency, amount_minor)
    values (null, 'classic', 'USD', 9900);
    assert false, 'anon must not insert prices';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.prices set amount_minor = 1;
    assert false, 'anon must not update prices';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role authenticated;

do $$
begin
  assert (select count(*) from public.prices where active) >= 4,
    'authenticated must read active prices';

  begin
    insert into public.prices (template_id, tier, currency, amount_minor)
    values (null, 'classic', 'USD', 9900);
    assert false, 'authenticated must not insert prices';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.prices set amount_minor = 1;
    assert false, 'authenticated must not update prices';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- 8. Manual payments (0009): admin_confirm_manual_payment, reject, expiry.
--    Orders: A (exact confirm, with invitation), B (mismatch), C (old pending),
--    D (reject). Created as the table owner, then driven as service_role.
-- ---------------------------------------------------------------------------

reset role;

insert into public.orders (id, user_id, template_id, tier, kind, amount_minor, currency, provider, provider_ref, status)
values
  ('a1000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'classic', 'new', 129900, 'EGP', 'manual', 'INV-AAAAAA', 'pending'),
  ('a1000000-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'classic', 'edits', 9900, 'EGP', 'manual', 'INV-BBBBBB', 'pending'),
  ('a1000000-0000-0000-0000-00000000000d', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'classic', 'edits', 9900, 'EGP', 'manual', 'INV-DDDDDD', 'pending');

insert into public.orders (id, user_id, template_id, tier, kind, amount_minor, currency, provider, provider_ref, status, created_at)
values
  ('a1000000-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'classic', 'edits', 9900, 'EGP', 'manual', 'INV-CCCCCC', 'pending',
   now() - interval '100 hours');

insert into public.invitations (id, owner_id, template_id, order_id, slug, data, status)
values (
  'a2000000-0000-0000-0000-00000000000a',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'a1000000-0000-0000-0000-00000000000a',
  'test-manual-pay',
  '{"event_date": "2027-03-20"}',
  'draft'
);

set local role service_role;

do $$
declare
  r jsonb;
  v_points_before integer;
begin
  -- Exact amount: paid, entitlement created, bookkeeping + audit written.
  r := public.admin_confirm_manual_payment(
    'a1000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
    129900, 'TXN-1', null, false);
  assert (r ->> 'ok') = 'true', 'exact manual confirm must succeed, got: ' || r::text;
  assert (select status from public.orders where id = 'a1000000-0000-0000-0000-00000000000a') = 'paid',
    'confirmed order must be paid';
  assert (select paid_amount_minor from public.orders where id = 'a1000000-0000-0000-0000-00000000000a') = 129900,
    'paid_amount_minor must be recorded';
  assert (select payment_txn_ref from public.orders where id = 'a1000000-0000-0000-0000-00000000000a') = 'TXN-1',
    'txn ref must be recorded';
  assert (select confirmed_by from public.orders where id = 'a1000000-0000-0000-0000-00000000000a')
         = '11111111-1111-1111-1111-111111111111', 'confirmed_by must be the admin';
  assert (select count(*) from public.invitation_entitlements
          where invitation_id = 'a2000000-0000-0000-0000-00000000000a') = 1,
    'confirm must create the entitlement';
  assert (select count(*) from public.audit_log
          where action = 'order.mark_paid' and target_id = 'a1000000-0000-0000-0000-00000000000a') = 1,
    'confirm must write one audit_log row';

  -- Second confirm: no-op, no second audit row, no extra points.
  select points_balance into v_points_before from public.profiles
    where id = '11111111-1111-1111-1111-111111111111';
  r := public.admin_confirm_manual_payment(
    'a1000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
    129900, 'TXN-2', null, false);
  assert (r ->> 'ok') = 'true' and (r ->> 'already') = 'true', 'second confirm must be already:true, got: ' || r::text;
  assert (select payment_txn_ref from public.orders where id = 'a1000000-0000-0000-0000-00000000000a') = 'TXN-1',
    'second confirm must not overwrite the txn ref';
  assert (select count(*) from public.audit_log
          where action = 'order.mark_paid' and target_id = 'a1000000-0000-0000-0000-00000000000a') = 1,
    'second confirm must not write another audit row';
  assert (select points_balance from public.profiles where id = '11111111-1111-1111-1111-111111111111') = v_points_before,
    'second confirm must not change points';

  -- Mismatch without accept.
  r := public.admin_confirm_manual_payment(
    'a1000000-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
    5000, 'TXN-3', null, false);
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'amount_mismatch', 'expected amount_mismatch, got: ' || r::text;
  assert (select status from public.orders where id = 'a1000000-0000-0000-0000-00000000000b') = 'pending',
    'mismatch must leave the order pending';

  -- Accepted mismatch without a note.
  r := public.admin_confirm_manual_payment(
    'a1000000-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
    5000, 'TXN-3', '   ', true);
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'note_required', 'expected note_required, got: ' || r::text;
  assert (select status from public.orders where id = 'a1000000-0000-0000-0000-00000000000b') = 'pending',
    'note_required must leave the order pending';

  -- Accepted mismatch with a note succeeds and stores the received amount.
  r := public.admin_confirm_manual_payment(
    'a1000000-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
    5000, 'TXN-3', 'customer short-paid, agreed by phone', true);
  assert (r ->> 'ok') = 'true', 'accepted mismatch with note must succeed, got: ' || r::text;
  assert (select paid_amount_minor from public.orders where id = 'a1000000-0000-0000-0000-00000000000b') = 5000,
    'the received amount must be stored, not the expected one';

  -- Reject: pending -> rejected, audited; a rejected order cannot be confirmed.
  r := public.admin_reject_manual_payment(
    'a1000000-0000-0000-0000-00000000000d', '11111111-1111-1111-1111-111111111111', 'no payment received');
  assert (r ->> 'ok') = 'true', 'reject must succeed, got: ' || r::text;
  assert (select status from public.orders where id = 'a1000000-0000-0000-0000-00000000000d') = 'rejected',
    'rejected order must have status rejected';
  assert (select count(*) from public.audit_log
          where action = 'order.reject_payment' and target_id = 'a1000000-0000-0000-0000-00000000000d') = 1,
    'reject must write an audit row';
  r := public.admin_confirm_manual_payment(
    'a1000000-0000-0000-0000-00000000000d', '11111111-1111-1111-1111-111111111111',
    9900, 'TXN-4', null, false);
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'not_pending', 'rejected order must not confirm, got: ' || r::text;

  -- Expiry: the 100h-old pending manual order flips; paid orders are untouched.
  assert public.expire_stale_manual_orders() >= 1, 'expiry must flip at least the stale order';
  assert (select status from public.orders where id = 'a1000000-0000-0000-0000-00000000000c') = 'expired',
    'stale pending manual order must be expired';
  assert (select status from public.orders where id = 'a1000000-0000-0000-0000-00000000000a') = 'paid',
    'expiry must not touch paid orders';
end;
$$;

-- Customers (authenticated) can execute none of the three functions.
reset role;
set local role authenticated;

do $$
begin
  begin
    perform public.admin_confirm_manual_payment(
      'a1000000-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111', 9900, 'X', null, false);
    assert false, 'authenticated must not execute admin_confirm_manual_payment';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.admin_reject_manual_payment(
      'a1000000-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111', 'nope');
    assert false, 'authenticated must not execute admin_reject_manual_payment';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.expire_stale_manual_orders();
    assert false, 'authenticated must not execute expire_stale_manual_orders';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- Lifecycle: points expiry only refreshes the cache (no double deduction).
-- A user with 100 expired + 50 valid points must end with exactly 50.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '', true);
insert into auth.users (id, aud, role)
values ('99999999-9999-9999-9999-999999999999', 'authenticated', 'authenticated');
insert into public.profiles (id, email, name, preferred_locale, signup_method)
values ('99999999-9999-9999-9999-999999999999', 'expiry-test@example.com', 'Expiry Test', 'en', 'email');
insert into public.points_ledger (user_id, delta, reason, expires_at)
values
  ('99999999-9999-9999-9999-999999999999', 100, 'bonus', now() - interval '1 day'),
  ('99999999-9999-9999-9999-999999999999', 50, 'bonus', now() + interval '30 days');
select set_config('request.jwt.claims', '', true);
set local role service_role;
update public.profiles set points_balance = 150 where id = '99999999-9999-9999-9999-999999999999';
do $$
declare
  v_first  integer;
  v_second integer;
begin
  v_first := public.lifecycle_expire_points(now());
  assert v_first >= 1, 'expire_points must refresh the stale cached balance';
  assert (select points_balance from public.profiles where id = '99999999-9999-9999-9999-999999999999') = 50,
    'expired points must drop out exactly once (100 expired + 50 valid = 50)';
  assert (select count(*) from public.points_ledger
          where user_id = '99999999-9999-9999-9999-999999999999' and reason = 'expire') = 0,
    'expiry must not write extra ledger rows';
  v_second := public.lifecycle_expire_points(now());
  assert (select points_balance from public.profiles where id = '99999999-9999-9999-9999-999999999999') = 50,
    'a second run must not change the balance';
end;
$$;
reset role;

-- ---------------------------------------------------------------------------
-- 9. Admin tools (0011): admin_adjust_entitlement, admin_adjust_points.
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '', true);

insert into public.invitations (id, owner_id, template_id, slug, data, status)
values
  ('a3000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'test-admin-adjust', '{}', 'published'),
  ('a3000000-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', 'test-admin-ended', '{}', 'ended');

insert into public.invitation_entitlements (invitation_id, tier, edits_allowed, edits_used, online_until)
values
  ('a3000000-0000-0000-0000-00000000000a', 'classic', 5, 1, now() + interval '10 days'),
  ('a3000000-0000-0000-0000-00000000000b', 'classic', 5, 5, now() - interval '3 days');

set local role service_role;

do $$
declare
  r jsonb;
  v_before timestamptz;
begin
  -- Adds edits and extends from the current online_until; one audit row.
  select online_until into v_before from public.invitation_entitlements
  where invitation_id = 'a3000000-0000-0000-0000-00000000000a';
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000a', 10, 30, 'goodwill');
  assert (r ->> 'ok') = 'true', 'adjust entitlement must succeed, got: ' || r::text;
  assert (select edits_allowed from public.invitation_entitlements
          where invitation_id = 'a3000000-0000-0000-0000-00000000000a') = 15,
    'adjust must add edits';
  assert (select online_until from public.invitation_entitlements
          where invitation_id = 'a3000000-0000-0000-0000-00000000000a') = v_before + interval '30 days',
    'adjust must extend online_until by the given days';
  assert (select count(*) from public.audit_log
          where action = 'entitlement.adjust' and target_id = 'a3000000-0000-0000-0000-00000000000a') = 1,
    'adjust must write one audit_log row';
  assert (select details ->> 'reason' from public.audit_log
          where action = 'entitlement.adjust' and target_id = 'a3000000-0000-0000-0000-00000000000a') = 'goodwill',
    'audit must keep the reason';
  assert (select (details -> 'before' ->> 'edits_allowed')::integer from public.audit_log
          where action = 'entitlement.adjust' and target_id = 'a3000000-0000-0000-0000-00000000000a') = 5
     and (select (details -> 'after' ->> 'edits_allowed')::integer from public.audit_log
          where action = 'entitlement.adjust' and target_id = 'a3000000-0000-0000-0000-00000000000a') = 15,
    'audit must keep before/after values';

  -- Validation.
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000a', 1, 0, '   ');
  assert (r ->> 'reason') = 'reason_required', 'blank reason must be refused, got: ' || r::text;
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000a', 0, 0, 'nothing');
  assert (r ->> 'reason') = 'invalid_adjustment', 'zero/zero must be invalid, got: ' || r::text;
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000a', 101, 0, 'too many');
  assert (r ->> 'reason') = 'invalid_adjustment', 'edits over 100 must be invalid, got: ' || r::text;
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000a', 0, 366, 'too long');
  assert (r ->> 'reason') = 'invalid_adjustment', 'days over 365 must be invalid, got: ' || r::text;
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3ffffff-0000-0000-0000-00000000000f', 1, 0, 'missing');
  assert (r ->> 'reason') = 'not_found', 'unknown invitation must be not_found, got: ' || r::text;
  assert (select count(*) from public.audit_log where action = 'entitlement.adjust') = 1,
    'refused adjustments must not write audit rows';

  -- An ended invitation extended into the future is published again.
  r := public.admin_adjust_entitlement(
    '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000b', 0, 30, 'late payment');
  assert (r ->> 'ok') = 'true', 'extend ended must succeed, got: ' || r::text;
  assert (select status from public.invitations where id = 'a3000000-0000-0000-0000-00000000000b') = 'published',
    'extending an ended invitation must publish it again';
  assert (select online_until from public.invitation_entitlements
          where invitation_id = 'a3000000-0000-0000-0000-00000000000b') > now() + interval '29 days',
    'extension of an expired window starts from now';

  -- Points: ledger row + recomputed cache + audit.
  r := public.admin_adjust_points(
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 500, 'goodwill');
  assert (r ->> 'ok') = 'true', 'adjust points must succeed, got: ' || r::text;
  assert (r ->> 'balance')::integer = (select points_balance from public.profiles
          where id = '11111111-1111-1111-1111-111111111111'),
    'returned balance must equal the cached balance';
  assert (select count(*) from public.points_ledger
          where user_id = '11111111-1111-1111-1111-111111111111' and reason = 'admin' and delta = 500
            and expires_at is null) = 1,
    'adjust points must write an admin ledger row';
  assert (select points_balance from public.profiles where id = '11111111-1111-1111-1111-111111111111')
         = (select coalesce(sum(delta), 0)::integer from public.points_ledger
            where user_id = '11111111-1111-1111-1111-111111111111'
              and (expires_at is null or expires_at > now())),
    'cached balance must equal the non-expired ledger sum';
  assert (select count(*) from public.audit_log
          where action = 'points.adjust' and target_id = '11111111-1111-1111-1111-111111111111') = 1,
    'adjust points must write one audit_log row';
  r := public.admin_adjust_points(
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 0, 'zero');
  assert (r ->> 'reason') = 'invalid_adjustment', 'zero delta must be invalid, got: ' || r::text;
  r := public.admin_adjust_points(
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 100001, 'huge');
  assert (r ->> 'reason') = 'invalid_adjustment', 'delta over 100000 must be invalid, got: ' || r::text;
  r := public.admin_adjust_points(
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 5, '');
  assert (r ->> 'reason') = 'reason_required', 'empty reason must be refused, got: ' || r::text;
end;
$$;

reset role;
set local role authenticated;

do $$
begin
  begin
    perform public.admin_adjust_entitlement(
      '11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-00000000000a', 1, 0, 'nope');
    assert false, 'authenticated must not execute admin_adjust_entitlement';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.admin_adjust_points(
      '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 5, 'nope');
    assert false, 'authenticated must not execute admin_adjust_points';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- Publish history (0012): undo_publish + switch_template.
-- Fixtures are inserted as the database owner, then the functions run with
-- the owner's / a stranger's JWT claims (same impersonation as section 5).
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated');
insert into public.profiles (id, email, name, preferred_locale, signup_method)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'history-owner@example.com', 'History Owner', 'en', 'email');
insert into auth.users (id, aud, role)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated');
insert into public.profiles (id, email, name, preferred_locale, signup_method)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'history-stranger@example.com', 'History Stranger', 'en', 'email');

insert into public.templates (id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'test-history-classic-b', 'ب', 'B',
   jsonb_build_object('ar', 'ب', 'en', 'B'), jsonb_build_object('ar', '', 'en', ''), 'classic', 'live', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'test-history-premium', 'ج', 'C',
   jsonb_build_object('ar', 'ج', 'en', 'C'), jsonb_build_object('ar', '', 'en', ''), 'premium', 'live', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'test-history-draft', 'د', 'D',
   jsonb_build_object('ar', 'د', 'en', 'D'), jsonb_build_object('ar', '', 'en', ''), 'classic', 'draft', true);

-- inv 1: two publishes (undo works, switch tests). inv 2: one publish only.
insert into public.invitations (id, owner_id, template_id, slug, data, status)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222', 'test-history-a', '{"v": 0}', 'draft'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222', 'test-history-b', '{"v": 0}', 'draft');
insert into public.invitation_entitlements
  (invitation_id, tier, edits_allowed, edits_used, template_switches_left, online_until)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'classic', 15, 0, 1, now() + interval '30 days'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'classic', 15, 0, 1, now() + interval '30 days');

set local "request.jwt.claims" = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

do $$
declare
  r jsonb;
begin
  -- A draft is not live: undo reports expired by contract.
  r := public.undo_publish('dddddddd-dddd-dddd-dddd-ddddddddddd1');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'expired',
    'undo on a draft must report expired, got: ' || r::text;

  -- inv 1: publish v1 then v2 (v1 is backdated: now() is constant in a transaction).
  r := public.publish_invitation('dddddddd-dddd-dddd-dddd-ddddddddddd1', '{"v": 1}');
  assert (r ->> 'ok') = 'true', 'publish v1 must succeed, got: ' || r::text;
  update public.invitation_publishes set published_at = now() - interval '1 hour'
  where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1';
  r := public.publish_invitation('dddddddd-dddd-dddd-dddd-ddddddddddd1', '{"v": 2}');
  assert (r ->> 'ok') = 'true', 'publish v2 must succeed, got: ' || r::text;

  -- inv 2: a single publish.
  r := public.publish_invitation('dddddddd-dddd-dddd-dddd-ddddddddddd2', '{"v": 1}');
  assert (r ->> 'ok') = 'true', 'publish on inv 2 must succeed, got: ' || r::text;

  -- Undo restores v1, removes the latest row, keeps edits_used = 2.
  r := public.undo_publish('dddddddd-dddd-dddd-dddd-ddddddddddd1');
  assert (r ->> 'ok') = 'true', 'undo must succeed, got: ' || r::text;
  assert (r -> 'published_at') is not null, 'undo must return the live snapshot published_at';
  assert (select data from public.invitations where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') = '{"v": 1}'::jsonb,
    'undo must restore the previous snapshot data';
  assert (select count(*) from public.invitation_publishes
          where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') = 1,
    'undo must delete exactly the latest publish row';
  assert (select edits_used from public.invitation_entitlements
          where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') = 2,
    'undo must not change edits_used';

  -- One publish left -> nothing_to_undo (inv 1 now, inv 2 from the start).
  r := public.undo_publish('dddddddd-dddd-dddd-dddd-ddddddddddd1');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'nothing_to_undo',
    'one remaining publish must report nothing_to_undo, got: ' || r::text;
  r := public.undo_publish('dddddddd-dddd-dddd-dddd-ddddddddddd2');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'nothing_to_undo',
    'single publish must report nothing_to_undo, got: ' || r::text;

  -- switch_template: unknown / non-live template.
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'no-such-template');
  assert (r ->> 'reason') = 'template_not_found', 'unknown slug must report template_not_found, got: ' || r::text;
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-history-draft');
  assert (r ->> 'reason') = 'template_not_found', 'draft template must report template_not_found, got: ' || r::text;

  -- Same template: unchanged, nothing consumed.
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-classic');
  assert (r ->> 'ok') = 'true' and (r ->> 'unchanged') = 'true', 'same template must be unchanged, got: ' || r::text;
  assert (select template_switches_left from public.invitation_entitlements
          where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') = 1,
    'unchanged switch must not consume a switch';

  -- Other tier -> tier_mismatch (nothing consumed).
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-history-premium');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'tier_mismatch', 'premium on classic must report tier_mismatch, got: ' || r::text;
  assert (select template_switches_left from public.invitation_entitlements
          where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') = 1,
    'tier_mismatch must not consume a switch';

  -- A real switch decrements and updates template_id.
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-history-classic-b');
  assert (r ->> 'ok') = 'true', 'switch must succeed, got: ' || r::text;
  assert (select template_switches_left from public.invitation_entitlements
          where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') = 0,
    'switch must decrement template_switches_left';
  assert (select template_id from public.invitations where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1')
         = 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'switch must update template_id';

  -- No switches left.
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-classic');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'no_switches_left', 'zero left must report no_switches_left, got: ' || r::text;

  -- Unlimited (null) never decrements.
  update public.invitation_entitlements set template_switches_left = null
  where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1';
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-classic');
  assert (r ->> 'ok') = 'true', 'unlimited switch must succeed, got: ' || r::text;
  assert (select template_switches_left from public.invitation_entitlements
          where invitation_id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1') is null,
    'unlimited switches must stay null';
end;
$$;

-- A stranger gets not_owner for both, and nothing changes.
set local "request.jwt.claims" = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

do $$
declare
  r jsonb;
begin
  r := public.undo_publish('dddddddd-dddd-dddd-dddd-ddddddddddd1');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'not_owner', 'stranger undo must be not_owner, got: ' || r::text;
  r := public.switch_template('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'test-history-classic-b');
  assert (r ->> 'ok') = 'false' and (r ->> 'reason') = 'not_owner', 'stranger switch must be not_owner, got: ' || r::text;
  assert (select template_id from public.invitations where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1')
         = '22222222-2222-2222-2222-222222222222',
    'a refused switch must leave template_id alone';
end;
$$;
select set_config('request.jwt.claims', '', true);

rollback;
