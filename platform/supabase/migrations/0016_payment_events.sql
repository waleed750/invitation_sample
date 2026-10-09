-- L3: provider notifications and active unique-piaster allocations.
-- Plain PostgreSQL; service_role is supplied by 0000_selfhost_bootstrap.
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  sender text,
  reference_text text,
  received_at timestamptz not null,
  raw jsonb not null,
  status text not null default 'received'
    check (status in ('received','matched','unmatched','ambiguous','duplicate','rejected')),
  order_id uuid references public.orders(id),
  match_reason text,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);
create index idx_payment_events_queue on public.payment_events(status, created_at desc);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from public, anon, authenticated;
grant all on public.payment_events to service_role;

create table public.payment_amount_allocations (
  order_id uuid primary key references public.orders(id) on delete cascade,
  base_amount_minor bigint not null check (base_amount_minor >= 0),
  extra_minor integer not null check (extra_minor between 1 and 99),
  created_at timestamptz not null default now()
);
alter table public.payment_amount_allocations enable row level security;
revoke all on public.payment_amount_allocations from public, anon, authenticated;
grant all on public.payment_amount_allocations to service_role;

create or replace function public.allocate_unique_amount(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_allocation public.payment_amount_allocations%rowtype;
  v_extra integer;
begin
  -- Serialize slot selection across ALL bases/currencies. A per-base lock is
  -- insufficient: 10000+2 collides with 10001+1. Taken before any row lock.
  perform pg_advisory_xact_lock(160016::bigint);
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.provider <> 'manual' then return jsonb_build_object('ok', false, 'reason', 'not_manual'); end if;
  if v_order.status <> 'pending' or v_order.created_at + interval '72 hours' <= now() then
    return jsonb_build_object('ok', false, 'reason', 'not_pending');
  end if;
  select * into v_allocation from public.payment_amount_allocations where order_id = p_order_id;
  if found then
    return jsonb_build_object('amount_minor', v_allocation.base_amount_minor + v_allocation.extra_minor,
      'extra_minor', v_allocation.extra_minor);
  end if;
  select s.extra into v_extra from generate_series(1, 99) as s(extra)
  where not exists (
    select 1 from public.payment_amount_allocations a
    join public.orders o on o.id = a.order_id
    where o.status = 'pending' and o.currency = v_order.currency
      and a.base_amount_minor + a.extra_minor = v_order.amount_minor + s.extra
  ) order by s.extra limit 1;
  if v_extra is null then return jsonb_build_object('ok', false, 'reason', 'no_slot'); end if;
  insert into public.payment_amount_allocations(order_id, base_amount_minor, extra_minor)
    values (p_order_id, v_order.amount_minor, v_extra);
  return jsonb_build_object('amount_minor', v_order.amount_minor + v_extra, 'extra_minor', v_extra);
end;
$$;
revoke all on function public.allocate_unique_amount(uuid) from public, anon, authenticated;
grant execute on function public.allocate_unique_amount(uuid) to service_role;

-- Automatic confirmation: locks prevent event reuse and double fulfillment.
create or replace function public.system_confirm_payment(p_event_id uuid, p_order_id uuid, p_provider text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_event public.payment_events%rowtype;
  v_expected bigint;
  v_fulfill jsonb;
begin
  -- All confirmation paths lock event, then order in the same order.
  select * into v_event from public.payment_events where id = p_event_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_event.provider is distinct from p_provider then return jsonb_build_object('ok', false, 'reason', 'provider_mismatch'); end if;
  if v_event.order_id is not null and v_event.order_id <> p_order_id then
    return jsonb_build_object('ok', false, 'reason', 'event_already_matched');
  end if;
  if v_event.status in ('duplicate', 'rejected') then
    return jsonb_build_object('ok', false, 'reason', 'event_not_available');
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.provider <> 'manual' then return jsonb_build_object('ok', false, 'reason', 'not_manual'); end if;
  if v_order.status = 'paid' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_order.status <> 'pending' or v_order.created_at + interval '72 hours' <= now() then
    return jsonb_build_object('ok', false, 'reason', 'not_pending');
  end if;
  if v_event.received_at < v_order.created_at
     or v_event.received_at >= v_order.created_at + interval '72 hours'
     or v_event.received_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'outside_window');
  end if;
  select v_order.amount_minor + coalesce(a.extra_minor, 0) into v_expected
    from public.orders o left join public.payment_amount_allocations a on a.order_id = o.id
    where o.id = p_order_id and o.status = 'pending';
  if v_event.amount_minor <> v_expected or v_event.currency <> v_order.currency then
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch',
      'expected_minor', v_expected, 'received_minor', v_event.amount_minor);
  end if;
  update public.orders set paid_amount_minor = v_event.amount_minor,
    payment_txn_ref = v_event.external_id, payment_note = null, confirmed_by = null
    where id = p_order_id;
  v_fulfill := public.fulfill_paid_order(p_order_id);
  if coalesce((v_fulfill ->> 'ok')::boolean, false) is not true then
    raise exception 'fulfill_paid_order failed: %', v_fulfill::text;
  end if;
  update public.payment_events set status = 'matched', order_id = p_order_id,
    match_reason = coalesce(match_reason, 'exact_match') where id = p_event_id;
  insert into public.audit_log(actor_id, action, target_type, target_id, details)
  values (null, 'order.auto_confirm', 'order', p_order_id::text,
    jsonb_build_object('provider', v_event.provider, 'event_id', p_event_id,
      'external_id', v_event.external_id, 'amount_minor', v_order.amount_minor,
      'expected_minor', v_expected, 'paid_amount_minor', v_event.amount_minor,
      'currency', v_event.currency, 'note', null));
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;
revoke all on function public.system_confirm_payment(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.system_confirm_payment(uuid, uuid, text) to service_role;

-- Manual queue: same exact-match rules; no amount override.
create or replace function public.admin_assign_payment_event(p_admin_id uuid, p_event_id uuid, p_order_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_event public.payment_events%rowtype;
  v_expected bigint;
  v_fulfill jsonb;
begin
  if not exists (select 1 from public.profiles where id = p_admin_id and role = 'admin') then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;
  if p_note is null or length(btrim(p_note)) < 1 or length(p_note) > 500 then
    return jsonb_build_object('ok', false, 'reason', 'note_required');
  end if;
  -- All confirmation paths lock event, then order in the same order.
  select * into v_event from public.payment_events where id = p_event_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_event.order_id is not null and v_event.order_id <> p_order_id then
    return jsonb_build_object('ok', false, 'reason', 'event_already_matched');
  end if;
  if v_event.status in ('duplicate', 'rejected') then
    return jsonb_build_object('ok', false, 'reason', 'event_not_available');
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.provider <> 'manual' then return jsonb_build_object('ok', false, 'reason', 'not_manual'); end if;
  if v_order.status = 'paid' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_order.status <> 'pending' or v_order.created_at + interval '72 hours' <= now() then
    return jsonb_build_object('ok', false, 'reason', 'not_pending');
  end if;
  if v_event.received_at < v_order.created_at
     or v_event.received_at >= v_order.created_at + interval '72 hours'
     or v_event.received_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'outside_window');
  end if;
  select v_order.amount_minor + coalesce(a.extra_minor, 0) into v_expected
    from public.orders o left join public.payment_amount_allocations a on a.order_id = o.id
    where o.id = p_order_id and o.status = 'pending';
  if v_event.amount_minor <> v_expected or v_event.currency <> v_order.currency then
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch',
      'expected_minor', v_expected, 'received_minor', v_event.amount_minor);
  end if;
  update public.orders set paid_amount_minor = v_event.amount_minor,
    payment_txn_ref = v_event.external_id, payment_note = p_note, confirmed_by = p_admin_id
    where id = p_order_id;
  v_fulfill := public.fulfill_paid_order(p_order_id);
  if coalesce((v_fulfill ->> 'ok')::boolean, false) is not true then
    raise exception 'fulfill_paid_order failed: %', v_fulfill::text;
  end if;
  update public.payment_events set status = 'matched', order_id = p_order_id,
    match_reason = coalesce(match_reason, 'admin_assignment') where id = p_event_id;
  insert into public.audit_log(actor_id, action, target_type, target_id, details)
  values (p_admin_id, 'order.assign_payment_event', 'order', p_order_id::text,
    jsonb_build_object('provider', v_event.provider, 'event_id', p_event_id,
      'external_id', v_event.external_id, 'amount_minor', v_order.amount_minor,
      'expected_minor', v_expected, 'paid_amount_minor', v_event.amount_minor,
      'currency', v_event.currency, 'note', p_note));
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;
revoke all on function public.admin_assign_payment_event(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_assign_payment_event(uuid, uuid, uuid, text) to service_role;
