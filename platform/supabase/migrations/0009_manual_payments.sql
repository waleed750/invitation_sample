-- 0009_manual_payments.sql — B7a: manual payments confirmed by an admin.
--
--   * orders: paid_amount_minor / payment_txn_ref / payment_note / confirmed_by,
--     status gains 'expired' and 'rejected'
--   * admin_confirm_manual_payment : lock, amount check, record, fulfill, audit
--   * admin_reject_manual_payment  : pending manual -> rejected, audit
--   * expire_stale_manual_orders   : pending manual older than N -> expired
--
-- All three functions are SECURITY DEFINER and executable by service_role only.
-- Customers have no path to mark an order paid.

-- ---------------------------------------------------------------------------
-- 1. orders columns + status check
-- ---------------------------------------------------------------------------

alter table public.orders add column paid_amount_minor bigint;
alter table public.orders add column payment_txn_ref text;
alter table public.orders add column payment_note text;
alter table public.orders add column confirmed_by uuid references public.profiles (id) on delete set null;

alter table public.orders add constraint orders_paid_amount_minor_check
  check (paid_amount_minor is null or paid_amount_minor >= 0);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'refunded', 'failed', 'expired', 'rejected'));

-- Pending manual orders are scanned by the admin list and the expiry job.
create index idx_orders_pending_manual
  on public.orders (created_at)
  where provider = 'manual' and status = 'pending';

-- Payment references (INV-XXXXXX) are what customers quote: they must be unique.
-- A rare collision makes the checkout save fail; a retry draws a new reference.
create unique index idx_orders_manual_provider_ref
  on public.orders (provider_ref)
  where provider = 'manual' and provider_ref is not null;

-- ---------------------------------------------------------------------------
-- 2. admin_confirm_manual_payment
-- ---------------------------------------------------------------------------

create or replace function public.admin_confirm_manual_payment(
  p_order_id            uuid,
  p_admin_id            uuid,
  p_paid_amount_minor   bigint,
  p_txn_ref             text,
  p_note                text,
  p_accept_mismatch     boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_mismatch  boolean;
  v_fulfill   jsonb;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_order.provider <> 'manual' then
    return jsonb_build_object('ok', false, 'reason', 'not_manual');
  end if;

  -- Idempotent: a second confirmation writes nothing.
  if v_order.status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  if v_order.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'not_pending', 'status', v_order.status);
  end if;

  if p_paid_amount_minor is null or p_paid_amount_minor < 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;

  v_mismatch := p_paid_amount_minor <> v_order.amount_minor;

  if v_mismatch and not coalesce(p_accept_mismatch, false) then
    return jsonb_build_object(
      'ok', false,
      'reason', 'amount_mismatch',
      'expected_minor', v_order.amount_minor,
      'received_minor', p_paid_amount_minor
    );
  end if;

  if v_mismatch and (p_note is null or btrim(p_note) = '') then
    return jsonb_build_object('ok', false, 'reason', 'note_required');
  end if;

  update public.orders
  set paid_amount_minor = p_paid_amount_minor,
      payment_txn_ref   = p_txn_ref,
      payment_note      = p_note,
      confirmed_by      = p_admin_id
  where id = p_order_id;

  -- Same fulfillment as an online payment (entitlement, points, affiliate).
  v_fulfill := public.fulfill_paid_order(p_order_id);

  if coalesce((v_fulfill ->> 'ok')::boolean, false) is not true then
    -- Fulfillment refused: undo the bookkeeping so the order stays untouched.
    raise exception 'fulfill_paid_order failed: %', v_fulfill::text;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    'order.mark_paid',
    'order',
    p_order_id::text,
    jsonb_build_object(
      'amount_minor', v_order.amount_minor,
      'currency', v_order.currency,
      'paid_amount_minor', p_paid_amount_minor,
      'txn_ref', p_txn_ref,
      'note', p_note,
      'mismatch_accepted', v_mismatch
    )
  );

  return jsonb_build_object('ok', true) || v_fulfill;
end;
$$;

revoke all on function public.admin_confirm_manual_payment(uuid, uuid, bigint, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_confirm_manual_payment(uuid, uuid, bigint, text, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3. admin_reject_manual_payment
-- ---------------------------------------------------------------------------

create or replace function public.admin_reject_manual_payment(
  p_order_id  uuid,
  p_admin_id  uuid,
  p_reason    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_order.provider <> 'manual' then
    return jsonb_build_object('ok', false, 'reason', 'not_manual');
  end if;

  if v_order.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'not_pending', 'status', v_order.status);
  end if;

  update public.orders
  set status       = 'rejected',
      payment_note = p_reason,
      confirmed_by = p_admin_id
  where id = p_order_id;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    'order.reject_payment',
    'order',
    p_order_id::text,
    jsonb_build_object(
      'amount_minor', v_order.amount_minor,
      'currency', v_order.currency,
      'reason', p_reason
    )
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_reject_manual_payment(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_reject_manual_payment(uuid, uuid, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 4. expire_stale_manual_orders (called by the daily job)
-- ---------------------------------------------------------------------------

create or replace function public.expire_stale_manual_orders(
  p_older_than interval default interval '72 hours'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.orders
  set status = 'expired'
  where provider = 'manual'
    and status = 'pending'
    and created_at < now() - p_older_than;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_stale_manual_orders(interval)
  from public, anon, authenticated;
grant execute on function public.expire_stale_manual_orders(interval)
  to service_role;
