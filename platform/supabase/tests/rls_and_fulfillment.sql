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

rollback;
