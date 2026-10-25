-- T13: credit balance. Single-session rules; the double-spend race is covered by scripts/test-credit-concurrency.sh.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('f1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't13-admin@example.test'),
  ('f1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 't13-a@example.test'),
  ('f1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 't13-b@example.test');
update public.profiles set role = 'admin' where id = 'f1000000-0000-4000-8000-000000000001';

insert into public.orders (id, user_id, tier, kind, amount_minor, currency, provider, status, created_at) values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002', 'classic', 'new', 100000, 'EGP', 'manual', 'pending', now() - interval '2 hours'),
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'classic', 'new', 130000, 'EGP', 'manual', 'pending', now() - interval '1 hour'),
  ('f2000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'classic', 'new', 100000, 'EGP', 'manual', 'pending', now());

do $$
declare
  A constant uuid := 'f1000000-0000-4000-8000-000000000002';
  B constant uuid := 'f1000000-0000-4000-8000-000000000003';
  ADMIN constant uuid := 'f1000000-0000-4000-8000-000000000001';
  O1 constant uuid := 'f2000000-0000-4000-8000-000000000001';
  O2 constant uuid := 'f2000000-0000-4000-8000-000000000002';
  r jsonb;
  v_topup uuid;
  v_expected bigint;
  v_balance bigint;
  v_count integer;
  v_status text;
begin
  -- ---- top-up request rules
  r := public.create_topup(A, 5000);
  assert r->>'reason' = 'below_minimum', 'below the minimum is refused: ' || r::text;
  r := public.create_topup(A, 150000);
  assert (r->>'ok')::boolean, 'valid top-up: ' || r::text;
  assert (r->>'reference') ~ '^TOP-[A-HJ-NP-Z2-9]{6}$', 'reference format';
  assert (r->>'extra_minor')::int between 1 and 99, 'unique piasters allocated';
  v_topup := (r->>'id')::uuid;
  v_expected := (r->>'expected_minor')::bigint;
  -- a second pending top-up never shares the total
  r := public.create_topup(B, 150000);
  assert (r->>'expected_minor')::bigint <> v_expected, 'two pending top-ups get different totals';

  -- ---- purchase with no balance waits as an awaiting order
  r := public.purchase_with_credit(A, O1);
  assert r->>'reason' = 'insufficient_balance' and (r->>'shortfall_minor')::bigint = 100000, 'shortfall reported: ' || r::text;
  select status into v_status from public.orders where id = O1;
  assert v_status = 'awaiting_balance', 'order waits for balance';
  r := public.purchase_with_credit(A, O2);
  select status into v_status from public.orders where id = O2;
  assert v_status = 'awaiting_balance', 'second order waits too';
  r := public.purchase_with_credit(B, O1);
  assert r->>'reason' = 'not_found', 'someone else cannot pay my order';

  -- ---- who may confirm
  r := public.confirm_topup(B, v_topup, v_expected, 'X', null, false);
  assert r->>'reason' = 'not_admin', 'a non-admin cannot confirm';
  r := public.confirm_topup(ADMIN, v_topup, v_expected - 7, 'X', null, false);
  assert r->>'reason' = 'amount_mismatch', 'a mismatch is not auto-confirmed';
  r := public.confirm_topup(ADMIN, v_topup, v_expected - 7, 'X', null, true);
  assert r->>'reason' = 'note_required', 'an accepted mismatch needs a note';
  select credit_balance_minor into v_balance from public.profiles where id = A;
  assert v_balance = 0, 'nothing credited yet';

  -- ---- exact confirmation credits once and pays the oldest awaiting order only
  r := public.confirm_topup(ADMIN, v_topup, v_expected, 'TXN-1', null, false);
  assert (r->>'ok')::boolean, 'confirm: ' || r::text;
  assert (r->>'paid_count')::int = 1, 'exactly the order the balance covers is paid: ' || r::text;
  select status into v_status from public.orders where id = O1;
  assert v_status = 'paid', 'oldest order paid';
  select status into v_status from public.orders where id = O2;
  assert v_status = 'awaiting_balance', 'the order the balance cannot cover stays awaiting';
  select credit_balance_minor into v_balance from public.profiles where id = A;
  assert v_balance = v_expected - 100000, 'balance = top-up - purchase, got ' || v_balance;
  select coalesce(sum(amount_minor), 0) into v_count from public.credit_ledger where user_id = A;
  assert v_count = v_balance, 'cached balance equals the ledger sum';

  -- ---- idempotent
  r := public.confirm_topup(ADMIN, v_topup, v_expected, 'TXN-1', null, false);
  assert (r->>'already')::boolean, 'second confirm is a no-op';
  select count(*) into v_count from public.credit_ledger where user_id = A and kind = 'topup';
  assert v_count = 1, 'credited once';
  r := public.purchase_with_credit(A, O1);
  assert (r->>'already')::boolean, 'paying a paid order is a no-op';
  select count(*) into v_count from public.credit_ledger where user_id = A and kind = 'purchase';
  assert v_count = 1, 'purchase written once';
  assert (select provider from public.orders where id = O1) = 'balance', 'paid from balance';

  -- ---- cancel
  r := public.cancel_awaiting_order(B, O2);
  assert r->>'reason' = 'not_found', 'cannot cancel someone else''s order';
  r := public.cancel_awaiting_order(A, O1);
  assert r->>'reason' = 'not_cancellable', 'a paid order cannot be cancelled';
  r := public.cancel_awaiting_order(A, O2);
  assert (r->>'ok')::boolean, 'awaiting order cancelled';
  assert (select status from public.orders where id = O2) = 'cancelled';

  -- ---- refund goes back to the balance, once
  select credit_balance_minor into v_balance from public.profiles where id = A;
  r := public.refund_to_balance(B, O1, 'x');
  assert r->>'reason' = 'not_admin', 'only an admin refunds';
  r := public.refund_to_balance(ADMIN, O1, 'customer request');
  assert (r->>'ok')::boolean and (r->>'refunded_minor')::bigint = 100000, 'refund: ' || r::text;
  assert (select credit_balance_minor from public.profiles where id = A) = v_balance + 100000, 'refund credited';
  assert (select status from public.orders where id = O1) = 'refunded';
  r := public.refund_to_balance(ADMIN, O1, 'again');
  assert (r->>'already')::boolean, 'second refund is a no-op';
  assert (select credit_balance_minor from public.profiles where id = A) = v_balance + 100000, 'not credited twice';

  -- ---- overdraft is impossible
  r := public.admin_adjust_credit(ADMIN, A, -999999999, 'too much');
  assert r->>'reason' = 'insufficient_balance', 'cannot adjust below zero';
  r := public.admin_adjust_credit(ADMIN, A, 5000, '');
  assert r->>'reason' = 'note_required';
  begin
    insert into public.credit_ledger (user_id, kind, amount_minor) values (A, 'admin', -999999999);
    assert false, 'a direct overdraft must fail';
  exception when check_violation then null;
  end;

  -- ---- append-only
  begin
    update public.credit_ledger set amount_minor = 1 where user_id = A;
    assert false, 'ledger update must fail';
  exception when raise_exception then null;
  end;
  begin
    delete from public.credit_ledger where user_id = A;
    assert false, 'ledger delete must fail';
  exception when raise_exception then null;
  end;
end $$;

-- ---- customers cannot touch their balance, see only their own rows, and have no write access
do $$
declare
  A constant uuid := 'f1000000-0000-4000-8000-000000000002';
  v_count integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"f1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
  set local role authenticated;

  begin
    update public.profiles set credit_balance_minor = 99999999 where id = A;
    assert false, 'a customer must not set their own balance';
  exception when raise_exception then null;
  end;
  select count(*) into v_count from public.credit_ledger;
  assert v_count > 0 and not exists (select 1 from public.credit_ledger where user_id <> A), 'only own ledger rows';
  select count(*) into v_count from public.credit_topups where user_id <> A;
  assert v_count = 0, 'only own top-ups';
  begin
    insert into public.credit_ledger (user_id, kind, amount_minor) values (A, 'topup', 1000);
    assert false, 'customer cannot write the ledger';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.confirm_topup(A, gen_random_uuid(), 1, 'x', null, false);
    assert false, 'customer cannot call confirm_topup';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.purchase_with_credit(A, gen_random_uuid());
    assert false, 'customer cannot call purchase_with_credit directly';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    perform 1 from public.credit_ledger;
    assert false, 'anon must not read the ledger';
  exception when insufficient_privilege then null;
  end;
  reset role;
end $$;

-- ---- payment-event matcher for top-ups (switched off in the API, correct in SQL)
do $$
declare
  B constant uuid := 'f1000000-0000-4000-8000-000000000003';
  r jsonb;
  v_topup uuid;
  v_expected bigint;
  v_event_ok uuid := gen_random_uuid();
  v_event_bad uuid := gen_random_uuid();
begin
  select id, amount_minor + extra_minor into v_topup, v_expected from public.credit_topups where user_id = B and status = 'pending';
  insert into public.payment_events (id, provider, external_id, amount_minor, currency, received_at, raw)
  values (v_event_ok, 'easyconfirm', 't13-ok', v_expected, 'EGP', now(), '{}'::jsonb),
         (v_event_bad, 'easyconfirm', 't13-bad', v_expected + 1, 'EGP', now(), '{}'::jsonb);
  r := public.system_confirm_topup(v_event_bad, v_topup, 'easyconfirm');
  assert r->>'reason' = 'amount_mismatch', 'wrong amount is not auto-confirmed';
  r := public.system_confirm_topup(v_event_ok, v_topup, 'easyconfirm');
  assert (r->>'ok')::boolean, 'exact event confirms: ' || r::text;
  assert (select credit_balance_minor from public.profiles where id = B) = v_expected, 'credited the paid amount';
  assert (select status from public.payment_events where id = v_event_ok) = 'matched';
  -- B's awaiting order is the 100000 one; the 150000 top-up covered it
  r := public.system_confirm_topup(v_event_ok, v_topup, 'easyconfirm');
  assert coalesce((r->>'already')::boolean, false) or r->>'reason' = 'event_not_available', 'replay does nothing';
end $$;

rollback;
