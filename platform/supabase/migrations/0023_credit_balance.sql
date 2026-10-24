-- T13: prepaid store credit. Every account has a balance; purchases always go through it.
-- A purchase the balance cannot cover waits as an order in status 'awaiting_balance' and is paid
-- automatically (oldest first, while the balance covers it) when an admin confirms a top-up.
-- Store credit only: it cannot be withdrawn or transferred, and refunds go back to it.
-- All writes go through the SECURITY DEFINER functions below (service_role only).

-- ---------------------------------------------------------------------------
-- settings (single row; edited from the admin settings page, T22)
-- ---------------------------------------------------------------------------
create table public.credit_settings (
  id                    boolean primary key default true check (id),
  min_topup_minor       bigint not null default 10000 check (min_topup_minor > 0),   -- EGP 100
  max_topup_minor       bigint not null default 5000000 check (max_topup_minor >= min_topup_minor),
  bonus_percent         numeric(5, 2) not null default 0 check (bonus_percent >= 0 and bonus_percent <= 100),
  bonus_min_topup_minor bigint not null default 0 check (bonus_min_topup_minor >= 0),
  updated_at            timestamptz not null default now()
);
insert into public.credit_settings default values;
alter table public.credit_settings enable row level security;
create policy "credit_settings_read" on public.credit_settings for select to authenticated using (true);
revoke all on table public.credit_settings from anon, authenticated;
grant select on table public.credit_settings to authenticated;

-- ---------------------------------------------------------------------------
-- balance cache + order statuses/provider
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column credit_balance_minor bigint not null default 0 check (credit_balance_minor >= 0);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'refunded', 'failed', 'expired', 'rejected', 'awaiting_balance', 'cancelled'));
alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check
  check (provider in ('fawry', 'kashier', 'manual', 'mock', 'balance'));

create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'profiles: role is managed by the server';
  end if;
  if new.level is distinct from old.level then
    raise exception 'profiles: level is managed by the server';
  end if;
  if new.purchases_count is distinct from old.purchases_count then
    raise exception 'profiles: purchases_count is managed by the server';
  end if;
  if new.points_balance is distinct from old.points_balance then
    raise exception 'profiles: points_balance is managed by the server';
  end if;
  if new.credit_balance_minor is distinct from old.credit_balance_minor then
    raise exception 'profiles: credit_balance_minor is managed by the server';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- top-ups (manual transfer, confirmed by an admin)
-- ---------------------------------------------------------------------------
create table public.credit_topups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete restrict,
  reference    text not null unique,                     -- TOP-XXXXXX
  amount_minor bigint not null check (amount_minor > 0), -- what the customer asked to add
  extra_minor  integer not null default 0 check (extra_minor between 0 and 99), -- unique piasters (matcher)
  currency     text not null default 'EGP' check (currency = 'EGP'),
  status       text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'expired')),
  paid_minor   bigint check (paid_minor is null or paid_minor > 0),
  txn_ref      text,
  note         text,
  confirmed_by uuid references public.profiles (id) on delete set null,
  confirmed_at timestamptz,
  expires_at   timestamptz not null default (now() + interval '72 hours'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_credit_topups_updated_at before update on public.credit_topups
  for each row execute function public.handle_updated_at();
create index idx_credit_topups_user on public.credit_topups (user_id, created_at desc);
create index idx_credit_topups_queue on public.credit_topups (status, created_at);
alter table public.credit_topups enable row level security;
create policy "credit_topups_select_own" on public.credit_topups for select to authenticated using (user_id = auth.uid());
create policy "credit_topups_select_admin" on public.credit_topups for select to authenticated using (public.is_admin());
revoke all on table public.credit_topups from anon, authenticated;
grant select on table public.credit_topups to authenticated;
grant all on table public.credit_topups to service_role;

-- ---------------------------------------------------------------------------
-- ledger (append-only)
-- ---------------------------------------------------------------------------
create table public.credit_ledger (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete restrict,
  kind         text not null check (kind in ('topup', 'bonus', 'purchase', 'refund', 'admin')),
  amount_minor bigint not null check (amount_minor <> 0),
  currency     text not null default 'EGP' check (currency = 'EGP'),
  topup_id     uuid references public.credit_topups (id),
  order_id     uuid references public.orders (id),
  note         text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  -- sign rules per kind
  check ((kind in ('topup', 'bonus', 'refund') and amount_minor > 0) or (kind = 'purchase' and amount_minor < 0) or kind = 'admin')
);
create index idx_credit_ledger_user on public.credit_ledger (user_id, created_at desc);
-- Idempotency: each top-up credits once, each order is paid once and refunded once.
create unique index uq_credit_ledger_topup on public.credit_ledger (topup_id) where kind = 'topup';
create unique index uq_credit_ledger_bonus on public.credit_ledger (topup_id) where kind = 'bonus';
create unique index uq_credit_ledger_purchase on public.credit_ledger (order_id) where kind = 'purchase';
create unique index uq_credit_ledger_refund on public.credit_ledger (order_id) where kind = 'refund';

create or replace function public.credit_ledger_immutable()
returns trigger language plpgsql set search_path = public
as $$
begin
  raise exception 'credit_ledger is append-only';
end;
$$;
create trigger trg_credit_ledger_immutable before update or delete on public.credit_ledger
  for each row execute function public.credit_ledger_immutable();

-- The cached balance follows the ledger; its CHECK (>= 0) makes overdrafts impossible.
create or replace function public.credit_ledger_apply()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set credit_balance_minor = credit_balance_minor + new.amount_minor where id = new.user_id;
  return new;
end;
$$;
create trigger trg_credit_ledger_apply after insert on public.credit_ledger
  for each row execute function public.credit_ledger_apply();

alter table public.credit_ledger enable row level security;
create policy "credit_ledger_select_own" on public.credit_ledger for select to authenticated using (user_id = auth.uid());
create policy "credit_ledger_select_admin" on public.credit_ledger for select to authenticated using (public.is_admin());
revoke all on table public.credit_ledger from anon, authenticated;
grant select on table public.credit_ledger to authenticated;
grant all on table public.credit_ledger to service_role;

-- ---------------------------------------------------------------------------
-- functions (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.new_topup_reference()
returns text language plpgsql set search_path = public
as $$
declare
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_ref text;
  v_try integer := 0;
begin
  loop
    v_ref := 'TOP-' || (
      select string_agg(substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.credit_topups where reference = v_ref);
    v_try := v_try + 1;
    if v_try > 20 then raise exception 'could not allocate a top-up reference'; end if;
  end loop;
  return v_ref;
end;
$$;

-- A customer asks to add credit. Allocates unique piasters so an incoming transfer can be matched.
create or replace function public.create_topup(p_user_id uuid, p_amount_minor bigint)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_settings public.credit_settings%rowtype;
  v_extra integer;
  v_topup public.credit_topups%rowtype;
begin
  select * into v_settings from public.credit_settings;
  if p_amount_minor is null or p_amount_minor < v_settings.min_topup_minor then
    return jsonb_build_object('ok', false, 'reason', 'below_minimum', 'min_minor', v_settings.min_topup_minor);
  end if;
  if p_amount_minor > v_settings.max_topup_minor then
    return jsonb_build_object('ok', false, 'reason', 'above_maximum', 'max_minor', v_settings.max_topup_minor);
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  -- Same lock as allocate_unique_amount: slots are chosen across orders and top-ups together.
  perform pg_advisory_xact_lock(160016::bigint);
  perform public.expire_stale_topups();
  if (select count(*) from public.credit_topups where user_id = p_user_id and status = 'pending') >= 3 then
    return jsonb_build_object('ok', false, 'reason', 'too_many_pending');
  end if;
  select s.extra into v_extra from generate_series(1, 99) as s(extra)
  where not exists (
    select 1 from public.payment_amount_allocations a join public.orders o on o.id = a.order_id
    where o.status = 'pending' and a.base_amount_minor + a.extra_minor = p_amount_minor + s.extra
  ) and not exists (
    select 1 from public.credit_topups t
    where t.status = 'pending' and t.amount_minor + t.extra_minor = p_amount_minor + s.extra
  ) order by s.extra limit 1;
  if v_extra is null then return jsonb_build_object('ok', false, 'reason', 'no_slot'); end if;
  insert into public.credit_topups (user_id, reference, amount_minor, extra_minor)
  values (p_user_id, public.new_topup_reference(), p_amount_minor, v_extra)
  returning * into v_topup;
  return jsonb_build_object('ok', true, 'id', v_topup.id, 'reference', v_topup.reference,
    'amount_minor', v_topup.amount_minor, 'extra_minor', v_topup.extra_minor,
    'expected_minor', v_topup.amount_minor + v_topup.extra_minor, 'expires_at', v_topup.expires_at);
end;
$$;
revoke all on function public.create_topup(uuid, bigint) from public, anon, authenticated;
grant execute on function public.create_topup(uuid, bigint) to service_role;

create or replace function public.expire_stale_topups()
returns integer language plpgsql security definer set search_path = public
as $$
declare v_count integer;
begin
  update public.credit_topups set status = 'expired' where status = 'pending' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.expire_stale_topups() from public, anon, authenticated;
grant execute on function public.expire_stale_topups() to service_role;

-- Pays one order from the balance. Locks the profile first, then the order (the same order everywhere).
-- Never overdraws, and paying twice is a no-op.
create or replace function public.purchase_with_credit(p_user_id uuid, p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_balance bigint;
  v_order public.orders%rowtype;
  v_fulfill jsonb;
begin
  select credit_balance_minor into v_balance from public.profiles where id = p_user_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.user_id is distinct from p_user_id then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_order.status = 'paid' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_order.status not in ('pending', 'awaiting_balance') then
    return jsonb_build_object('ok', false, 'reason', 'not_payable', 'status', v_order.status);
  end if;
  if v_order.currency <> 'EGP' then return jsonb_build_object('ok', false, 'reason', 'currency'); end if;
  if v_order.amount_minor > v_balance then
    if v_order.status = 'pending' then
      update public.orders set status = 'awaiting_balance' where id = v_order.id;
    end if;
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'balance_minor', v_balance, 'amount_minor', v_order.amount_minor,
      'shortfall_minor', v_order.amount_minor - v_balance);
  end if;
  if v_order.amount_minor > 0 then
    insert into public.credit_ledger (user_id, kind, amount_minor, order_id, note)
    values (p_user_id, 'purchase', -v_order.amount_minor, v_order.id, 'order ' || v_order.id::text);
  end if;
  update public.orders
     set status = 'pending', provider = 'balance', paid_amount_minor = v_order.amount_minor,
         payment_txn_ref = 'BAL-' || substr(v_order.id::text, 1, 8), confirmed_by = null
   where id = v_order.id;
  v_fulfill := public.fulfill_paid_order(v_order.id);
  if coalesce((v_fulfill ->> 'ok')::boolean, false) is not true then
    raise exception 'fulfill_paid_order failed: %', v_fulfill::text;
  end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_user_id, 'order.pay_with_balance', 'order', v_order.id::text,
    jsonb_build_object('amount_minor', v_order.amount_minor, 'currency', v_order.currency));
  return jsonb_build_object('ok', true, 'already', false, 'balance_minor', v_balance - v_order.amount_minor) || v_fulfill;
end;
$$;
revoke all on function public.purchase_with_credit(uuid, uuid) from public, anon, authenticated;
grant execute on function public.purchase_with_credit(uuid, uuid) to service_role;

-- Pays the customer's awaiting orders, oldest first, for as long as the balance covers them.
create or replace function public.pay_awaiting_orders(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_order record;
  v_result jsonb;
  v_paid uuid[] := '{}';
begin
  for v_order in
    select id from public.orders where user_id = p_user_id and status = 'awaiting_balance' order by created_at, id
  loop
    v_result := public.purchase_with_credit(p_user_id, v_order.id);
    exit when coalesce((v_result ->> 'ok')::boolean, false) is not true;
    v_paid := v_paid || v_order.id;
  end loop;
  return jsonb_build_object('paid_order_ids', to_jsonb(v_paid), 'paid_count', coalesce(array_length(v_paid, 1), 0));
end;
$$;
revoke all on function public.pay_awaiting_orders(uuid) from public, anon, authenticated;
grant execute on function public.pay_awaiting_orders(uuid) to service_role;

create or replace function public.cancel_awaiting_order(p_user_id uuid, p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.user_id is distinct from p_user_id then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_order.status = 'cancelled' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_order.status <> 'awaiting_balance' then
    return jsonb_build_object('ok', false, 'reason', 'not_cancellable', 'status', v_order.status);
  end if;
  update public.orders set status = 'cancelled' where id = v_order.id;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_user_id, 'order.cancel_awaiting', 'order', v_order.id::text, jsonb_build_object('amount_minor', v_order.amount_minor));
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;
revoke all on function public.cancel_awaiting_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_awaiting_order(uuid, uuid) to service_role;

-- Credits a confirmed top-up (admin, or the payment-event matcher when p_admin_id is null) and then pays
-- the customer's awaiting orders. Confirming twice credits once.
create or replace function public.confirm_topup(
  p_admin_id uuid, p_topup_id uuid, p_paid_minor bigint, p_txn_ref text, p_note text, p_accept_mismatch boolean
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_topup public.credit_topups%rowtype;
  v_settings public.credit_settings%rowtype;
  v_expected bigint;
  v_mismatch boolean;
  v_bonus bigint := 0;
  v_paid jsonb;
begin
  if p_admin_id is not null and not exists (select 1 from public.profiles where id = p_admin_id and role = 'admin') then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;
  select * into v_topup from public.credit_topups where id = p_topup_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_topup.status = 'confirmed' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_topup.status = 'rejected' or (v_topup.status = 'expired' and p_admin_id is null) then
    return jsonb_build_object('ok', false, 'reason', 'not_pending', 'status', v_topup.status);
  end if;
  if p_paid_minor is null or p_paid_minor <= 0 then return jsonb_build_object('ok', false, 'reason', 'invalid_amount'); end if;
  v_expected := v_topup.amount_minor + v_topup.extra_minor;
  v_mismatch := p_paid_minor <> v_expected;
  if v_mismatch and (p_admin_id is null or not coalesce(p_accept_mismatch, false)) then
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch', 'expected_minor', v_expected, 'received_minor', p_paid_minor);
  end if;
  if v_mismatch and (p_note is null or btrim(p_note) = '') then
    return jsonb_build_object('ok', false, 'reason', 'note_required');
  end if;
  -- profile row lock first (same order as purchase_with_credit)
  perform 1 from public.profiles where id = v_topup.user_id for update;
  insert into public.credit_ledger (user_id, kind, amount_minor, topup_id, note, created_by)
  values (v_topup.user_id, 'topup', p_paid_minor, v_topup.id, v_topup.reference, p_admin_id);
  select * into v_settings from public.credit_settings;
  if v_settings.bonus_percent > 0 and p_paid_minor >= v_settings.bonus_min_topup_minor then
    v_bonus := floor(p_paid_minor * v_settings.bonus_percent / 100)::bigint;
    if v_bonus > 0 then
      insert into public.credit_ledger (user_id, kind, amount_minor, topup_id, note, created_by)
      values (v_topup.user_id, 'bonus', v_bonus, v_topup.id, 'top-up bonus', p_admin_id);
    end if;
  end if;
  update public.credit_topups
     set status = 'confirmed', paid_minor = p_paid_minor, txn_ref = p_txn_ref, note = p_note,
         confirmed_by = p_admin_id, confirmed_at = now()
   where id = v_topup.id;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin_id, 'topup.confirm', 'topup', v_topup.id::text,
    jsonb_build_object('user_id', v_topup.user_id, 'reference', v_topup.reference, 'expected_minor', v_expected,
      'paid_minor', p_paid_minor, 'bonus_minor', v_bonus, 'txn_ref', p_txn_ref, 'note', p_note, 'mismatch_accepted', v_mismatch));
  v_paid := public.pay_awaiting_orders(v_topup.user_id);
  return jsonb_build_object('ok', true, 'already', false, 'credited_minor', p_paid_minor, 'bonus_minor', v_bonus) || v_paid;
end;
$$;
revoke all on function public.confirm_topup(uuid, uuid, bigint, text, text, boolean) from public, anon, authenticated;
grant execute on function public.confirm_topup(uuid, uuid, bigint, text, text, boolean) to service_role;

create or replace function public.reject_topup(p_admin_id uuid, p_topup_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_topup public.credit_topups%rowtype;
begin
  if not exists (select 1 from public.profiles where id = p_admin_id and role = 'admin') then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;
  select * into v_topup from public.credit_topups where id = p_topup_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_topup.status = 'rejected' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_topup.status not in ('pending', 'expired') then
    return jsonb_build_object('ok', false, 'reason', 'not_pending', 'status', v_topup.status);
  end if;
  update public.credit_topups set status = 'rejected', note = p_reason, confirmed_by = p_admin_id where id = v_topup.id;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin_id, 'topup.reject', 'topup', v_topup.id::text, jsonb_build_object('reference', v_topup.reference, 'reason', p_reason));
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;
revoke all on function public.reject_topup(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_topup(uuid, uuid, text) to service_role;

-- Refund a paid order to the customer's balance (store credit).
create or replace function public.refund_to_balance(p_admin_id uuid, p_order_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_amount bigint;
  v_result jsonb;
begin
  if not exists (select 1 from public.profiles where id = p_admin_id and role = 'admin') then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.status = 'refunded' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_order.status <> 'paid' or v_order.user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_refundable', 'status', v_order.status);
  end if;
  v_amount := coalesce(v_order.paid_amount_minor, v_order.amount_minor);
  perform 1 from public.profiles where id = v_order.user_id for update;
  v_result := public.refund_order(p_order_id);
  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    raise exception 'refund_order failed: %', v_result::text;
  end if;
  if v_amount > 0 then
    insert into public.credit_ledger (user_id, kind, amount_minor, order_id, note, created_by)
    values (v_order.user_id, 'refund', v_amount, v_order.id, p_note, p_admin_id);
  end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin_id, 'order.refund_to_balance', 'order', v_order.id::text,
    jsonb_build_object('amount_minor', v_amount, 'note', p_note));
  return jsonb_build_object('ok', true, 'already', false, 'refunded_minor', v_amount);
end;
$$;
revoke all on function public.refund_to_balance(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.refund_to_balance(uuid, uuid, text) to service_role;

create or replace function public.admin_adjust_credit(p_admin_id uuid, p_user_id uuid, p_delta_minor bigint, p_note text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_balance bigint;
begin
  if not exists (select 1 from public.profiles where id = p_admin_id and role = 'admin') then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;
  if p_delta_minor is null or p_delta_minor = 0 then return jsonb_build_object('ok', false, 'reason', 'invalid_amount'); end if;
  if p_note is null or btrim(p_note) = '' then return jsonb_build_object('ok', false, 'reason', 'note_required'); end if;
  select credit_balance_minor into v_balance from public.profiles where id = p_user_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_balance + p_delta_minor < 0 then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance', 'balance_minor', v_balance);
  end if;
  insert into public.credit_ledger (user_id, kind, amount_minor, note, created_by)
  values (p_user_id, 'admin', p_delta_minor, p_note, p_admin_id);
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin_id, 'credit.adjust', 'profile', p_user_id::text, jsonb_build_object('delta_minor', p_delta_minor, 'note', p_note));
  return jsonb_build_object('ok', true, 'balance_minor', v_balance + p_delta_minor);
end;
$$;
revoke all on function public.admin_adjust_credit(uuid, uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.admin_adjust_credit(uuid, uuid, bigint, text) to service_role;

-- Payment-event matcher for top-ups (built, switched OFF by PAYMENT_EVENTS_ENABLED=false in the API):
-- the same locks and exact-amount rule as system_confirm_payment.
create or replace function public.system_confirm_topup(p_event_id uuid, p_topup_id uuid, p_provider text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_event public.payment_events%rowtype;
  v_topup public.credit_topups%rowtype;
  v_result jsonb;
begin
  select * into v_event from public.payment_events where id = p_event_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_event.provider is distinct from p_provider then return jsonb_build_object('ok', false, 'reason', 'provider_mismatch'); end if;
  if v_event.order_id is not null or v_event.status in ('matched', 'duplicate', 'rejected') then
    return jsonb_build_object('ok', false, 'reason', 'event_not_available');
  end if;
  select * into v_topup from public.credit_topups where id = p_topup_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_topup.status = 'confirmed' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_topup.status <> 'pending' or v_topup.expires_at <= now() then return jsonb_build_object('ok', false, 'reason', 'not_pending'); end if;
  if v_event.received_at < v_topup.created_at or v_event.received_at >= v_topup.expires_at or v_event.received_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'outside_window');
  end if;
  if v_event.currency <> v_topup.currency or v_event.amount_minor <> v_topup.amount_minor + v_topup.extra_minor then
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch',
      'expected_minor', v_topup.amount_minor + v_topup.extra_minor, 'received_minor', v_event.amount_minor);
  end if;
  v_result := public.confirm_topup(null, p_topup_id, v_event.amount_minor, v_event.external_id, null, false);
  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    raise exception 'confirm_topup failed: %', v_result::text;
  end if;
  update public.payment_events set status = 'matched', match_reason = 'topup_exact_match' where id = p_event_id;
  return v_result;
end;
$$;
revoke all on function public.system_confirm_topup(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.system_confirm_topup(uuid, uuid, text) to service_role;
