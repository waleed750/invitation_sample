-- 0006_money_minor_units.sql — money as integer minor units + currency, and a
-- `prices` table. Done before any real orders exist.
--
--   * orders.amount_egp / discount_total  -> amount_minor / discount_total_minor (bigint)
--   * coupons.amount_off_egp              -> amount_off_minor (bigint) + currency
--   * templates.price_override_egp        -> rows in public.prices
--   * public.prices                       -> tier defaults + per-template prices
--   * create_pending_checkout / fulfill_paid_order recreated for the new columns
--
-- Minor unit = 1/100 of the major unit (EGP 1299 = 129900). Currencies with a
-- different exponent are a later concern (BACKEND_PLAN §2b).

-- ---------------------------------------------------------------------------
-- 1. orders
-- ---------------------------------------------------------------------------

alter table public.orders add column amount_minor bigint;
alter table public.orders add column discount_total_minor bigint;

update public.orders
set amount_minor = round(amount_egp * 100)::bigint,
    discount_total_minor = round(discount_total * 100)::bigint;

alter table public.orders alter column amount_minor set not null;
alter table public.orders alter column discount_total_minor set not null;
alter table public.orders alter column discount_total_minor set default 0;
alter table public.orders add constraint orders_amount_minor_check check (amount_minor >= 0);
alter table public.orders add constraint orders_discount_total_minor_check check (discount_total_minor >= 0);
alter table public.orders add constraint orders_currency_check check (currency ~ '^[A-Z]{3}$');

-- The old function bodies reference the columns below; they are replaced in
-- section 5. plpgsql bodies are not dependency-tracked, so the drop succeeds.
alter table public.orders drop column amount_egp;
alter table public.orders drop column discount_total;

-- ---------------------------------------------------------------------------
-- 2. coupons
-- ---------------------------------------------------------------------------

alter table public.coupons add column amount_off_minor bigint
  check (amount_off_minor is null or amount_off_minor >= 0);
alter table public.coupons add column currency text not null default 'EGP'
  check (currency ~ '^[A-Z]{3}$');

update public.coupons
set amount_off_minor = round(amount_off_egp * 100)::bigint
where amount_off_egp is not null;

alter table public.coupons drop column amount_off_egp;

-- ---------------------------------------------------------------------------
-- 3. prices
-- ---------------------------------------------------------------------------

create table public.prices (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid references public.templates (id) on delete cascade, -- null = tier default
  tier         text not null check (tier in ('save_the_date', 'classic', 'premium')),
  currency     text not null check (currency ~ '^[A-Z]{3}$'),
  amount_minor bigint not null check (amount_minor > 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index idx_prices_one_active
  on public.prices (coalesce(template_id, '00000000-0000-0000-0000-000000000000'::uuid), tier, currency)
  where active;

create trigger trg_prices_updated_at
  before update on public.prices
  for each row execute function public.handle_updated_at();

alter table public.prices enable row level security;

create policy "prices_select_active"
  on public.prices for select to anon, authenticated
  using (active);
-- NOTE: no insert/update/delete policies and no write grants: prices change
-- only through the service role (admin tools / migrations).

revoke all on table public.prices from anon, authenticated;
grant select on table public.prices to anon, authenticated;

-- Tier defaults (mirror TIERS in packages/shared/src/entitlement.ts).
insert into public.prices (template_id, tier, currency, amount_minor)
select null, v.tier, 'EGP', v.amount_minor
from (values
  ('save_the_date', 49900::bigint),
  ('classic',      129900::bigint),
  ('premium',      249900::bigint)
) as v(tier, amount_minor)
where not exists (
  select 1 from public.prices p
  where p.template_id is null and p.tier = v.tier and p.currency = 'EGP' and p.active
);

-- ---------------------------------------------------------------------------
-- 4. templates.price_override_egp -> prices
-- ---------------------------------------------------------------------------

insert into public.prices (template_id, tier, currency, amount_minor)
select t.id, t.tier, 'EGP', round(t.price_override_egp * 100)::bigint
from public.templates t
where t.price_override_egp is not null
  and not exists (
    select 1 from public.prices p
    where p.template_id = t.id and p.tier = t.tier and p.currency = 'EGP' and p.active
  );

alter table public.templates drop column price_override_egp;

-- ---------------------------------------------------------------------------
-- 5. create_pending_checkout (replaces the 0004 signature)
-- ---------------------------------------------------------------------------

drop function public.create_pending_checkout(uuid, uuid, uuid, text, text, numeric, text, text, text, numeric, integer, text, jsonb);

create or replace function public.create_pending_checkout(
  p_order_id uuid,
  p_user_id uuid,
  p_template_id uuid,
  p_tier text,
  p_kind text,
  p_amount_minor bigint,
  p_currency text,
  p_provider text,
  p_idempotency_key text,
  p_coupon_code text,
  p_discount_total_minor bigint,
  p_points_redeemed integer,
  p_invitation_slug text,
  p_invitation_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_idempotency_key, 0));
    select * into v_order
    from public.orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'order_id', v_order.id,
        'amount_minor', v_order.amount_minor,
        'currency', v_order.currency,
        'existing', true
      );
    end if;
  end if;

  insert into public.orders (
    id, user_id, template_id, tier, kind, amount_minor, currency, provider,
    idempotency_key, status, coupon_code, discount_total_minor, points_redeemed
  ) values (
    p_order_id, p_user_id, p_template_id, p_tier, p_kind, p_amount_minor, p_currency, p_provider,
    p_idempotency_key, 'pending', p_coupon_code, p_discount_total_minor, p_points_redeemed
  ) returning * into v_order;

  if p_kind = 'new' then
    insert into public.invitations (owner_id, template_id, order_id, slug, data, status)
    values (p_user_id, p_template_id, v_order.id, p_invitation_slug, p_invitation_data, 'draft');
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'amount_minor', v_order.amount_minor,
    'currency', v_order.currency,
    'existing', false
  );
end;
$$;

revoke all on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- 6. fulfill_paid_order (same signature as 0002; only the points line changes)
-- ---------------------------------------------------------------------------

create or replace function public.fulfill_paid_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order      public.orders%rowtype;
  v_profile    public.profiles%rowtype;
  v_inv_id     uuid;
  v_inv_data   jsonb;
  v_ent        public.invitation_entitlements%rowtype;
  v_has_ent    boolean := false;

  v_edits      integer;
  v_months     integer;
  v_grace_days integer;
  v_switches   integer;          -- null sentinel handled via v_unlimited
  v_unlimited  boolean;

  v_event_date date;
  v_event_txt  text;
  v_base_until timestamptz;
  v_new_until  timestamptz;
  v_min_until  timestamptz;

  v_level_before text;
  v_mult         numeric := 1.0;
  v_base_points  integer;
  v_earned       integer;
  v_is_first     boolean := false;

  v_paid_count   integer;
  v_new_balance  integer;
begin
  -- 1. Lock + idempotency guard. No writes happen before the status check,
  --    so duplicate webhooks / retries change nothing.
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found', 'order_id', p_order_id);
  end if;

  if v_order.status <> 'pending' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'already_processed',
      'order_id', v_order.id,
      'status', v_order.status
    );
  end if;

  -- 2. Mark paid.
  update public.orders
  set status = 'paid',
      paid_at = now()
  where id = v_order.id
  returning * into v_order;

  -- Tier parameters (single source of truth, see table above).
  case v_order.tier
    when 'save_the_date' then
      v_edits := 5;  v_months := 3;  v_grace_days := 7;  v_switches := 1;    v_unlimited := false;
    when 'premium' then
      v_edits := 40; v_months := 12; v_grace_days := 30; v_switches := null; v_unlimited := true;
    else -- 'classic'
      v_edits := 15; v_months := 6;  v_grace_days := 14; v_switches := 2;    v_unlimited := false;
  end case;

  -- 3. Entitlement: find the invitation produced for this order, if any.
  --    (Checkout creates the draft invitation with order_id set; if it does
  --    not exist yet, fulfillment still pays out points and the entitlement
  --    is created when the invitation is linked. The summary reports null.)
  select i.id, i.data into v_inv_id, v_inv_data
  from public.invitations i
  where i.order_id = v_order.id
  order by i.created_at desc
  limit 1;

  if v_inv_id is not null then
    -- Event date drives min_online_until. Accept the documented shapes and
    -- ignore anything that is not an ISO date (never fail fulfillment).
    v_event_txt := coalesce(
      v_inv_data ->> 'event_date',
      v_inv_data #>> '{event,date}',
      v_inv_data ->> 'eventDate'
    );
    if v_event_txt ~ '^\d{4}-\d{2}-\d{2}' then
      begin
        v_event_date := substring(v_event_txt from 1 for 10)::date;
      exception when others then
        v_event_date := null;
      end;
    end if;

    if v_event_date is not null then
      v_min_until := (v_event_date + (v_grace_days || ' days')::interval)::timestamptz;
    else
      v_min_until := null;
    end if;

    select * into v_ent
    from public.invitation_entitlements
    where invitation_id = v_inv_id
    for update;
    v_has_ent := found;

    if v_order.kind = 'new' or not v_has_ent then
      -- Fresh entitlement: online_until is the later of (now + months) and
      -- (event_date + grace), so it never ends before the event.
      v_base_until := now() + (v_months || ' months')::interval;
      v_new_until  := v_base_until;
      if v_min_until is not null and v_min_until > v_new_until then
        v_new_until := v_min_until;
      end if;

      insert into public.invitation_entitlements (
        invitation_id, order_id, tier,
        edits_allowed, edits_used, template_switches_left,
        online_until, min_online_until
      ) values (
        v_inv_id, v_order.id, v_order.tier,
        v_edits, 0, case when v_unlimited then null else v_switches end,
        v_new_until, v_min_until
      )
      on conflict (invitation_id) do update set
        order_id               = excluded.order_id,
        tier                   = excluded.tier,
        edits_allowed          = excluded.edits_allowed,
        edits_used             = 0,
        template_switches_left = excluded.template_switches_left,
        online_until           = excluded.online_until,
        min_online_until       = excluded.min_online_until,
        updated_at             = now();
    elsif v_order.kind = 'extension' then
      -- Paid extension: push the current window out by the tier months,
      -- then re-apply the event floor.
      v_base_until := coalesce(v_ent.online_until, now())
                      + (v_months || ' months')::interval;
      v_new_until := v_base_until;
      if v_min_until is not null and v_min_until > v_new_until then
        v_new_until := v_min_until;
      end if;

      update public.invitation_entitlements
      set order_id         = v_order.id,
          online_until     = v_new_until,
          min_online_until = coalesce(v_min_until, min_online_until),
          updated_at       = now()
      where invitation_id = v_inv_id;
    elsif v_order.kind = 'edits' then
      -- Edits pack: +10 published edits on top of whatever is allowed.
      update public.invitation_entitlements
      set order_id      = v_order.id,
          edits_allowed = edits_allowed + 10,
          updated_at    = now()
      where invitation_id = v_inv_id;
    else
      -- kind = 'addon' (subdomain, bilingual, reel, done-for-you...):
      -- no entitlement change, points are still earned below.
      update public.invitation_entitlements
      set order_id   = v_order.id,
          updated_at = now()
      where invitation_id = v_inv_id;
    end if;
  end if;

  -- 4. Points ledger (§16.4). Multiplier uses the level BEFORE this order.
  if v_order.user_id is not null then
    select * into v_profile
    from public.profiles
    where id = v_order.user_id
    for update;

    if found then
      v_level_before := v_profile.level;
      v_mult := case v_level_before
        when 'silver' then 1.10
        when 'gold'   then 1.25
        else 1.0
      end;

      v_is_first := (v_profile.purchases_count = 0);

      -- 1 point per EGP 10 actually paid (after discounts), floored,
      -- then the level multiplier, floored again.
      -- amount_minor / 1000 is bigint integer division (truncation == floor
      -- for non-negative amounts), identical to floor(amount_egp / 10).
      -- TODO(B14): points for non-EGP currencies
      v_base_points := case
        when v_order.currency = 'EGP' then (v_order.amount_minor / 1000)::integer
        else 0
      end;
      v_earned      := floor(v_base_points * v_mult)::integer;
      if v_earned < 0 then
        v_earned := 0;
      end if;

      if v_earned > 0 then
        insert into public.points_ledger (user_id, order_id, delta, reason, expires_at)
        values (v_profile.id, v_order.id, v_earned, 'purchase', now() + interval '12 months');
      end if;

      -- First paid order ever: +50 bonus.
      if v_is_first then
        insert into public.points_ledger (user_id, order_id, delta, reason, expires_at)
        values (v_profile.id, v_order.id, 50, 'bonus', now() + interval '12 months');
      end if;

      -- Points spent on this order: negative redeem row (never expires;
      -- expiry applies to earned points, not to spent ones).
      if v_order.points_redeemed > 0 then
        insert into public.points_ledger (user_id, order_id, delta, reason, expires_at)
        values (v_profile.id, v_order.id, -v_order.points_redeemed, 'redeem', null);
      end if;

      update public.orders
      set points_earned = v_earned + case when v_is_first then 50 else 0 end
      where id = v_order.id;

      -- 5. Recompute cached counters from source of truth.
      select count(*)::integer into v_paid_count
      from public.orders
      where user_id = v_profile.id
        and status = 'paid';

      select coalesce(sum(delta), 0)::integer into v_new_balance
      from public.points_ledger
      where user_id = v_profile.id
        and (expires_at is null or expires_at > now());

      update public.profiles
      set purchases_count = v_paid_count,
          level           = public.level_for_purchases(v_paid_count),
          points_balance  = v_new_balance
      where id = v_profile.id
      returning * into v_profile;
    end if;
  end if;

  -- 6. Summary.
  select * into v_ent
  from public.invitation_entitlements
  where invitation_id = v_inv_id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'invitation_id', v_inv_id,
    'tier', v_order.tier,
    'kind', v_order.kind,
    'edits_allowed', case when v_inv_id is null then null else v_ent.edits_allowed end,
    'edits_used', case when v_inv_id is null then null else v_ent.edits_used end,
    'template_switches_left', case when v_inv_id is null then null else v_ent.template_switches_left end,
    'online_until', case when v_inv_id is null then null else v_ent.online_until end,
    'points_earned', (
      select coalesce(sum(delta), 0)
      from public.points_ledger
      where order_id = v_order.id and delta > 0
    ),
    'purchases_count', case when v_order.user_id is null then null else v_profile.purchases_count end,
    'level', case when v_order.user_id is null then null else v_profile.level end
  );
end;
$$;


revoke all on function public.fulfill_paid_order(uuid) from public, anon, authenticated;
grant execute on function public.fulfill_paid_order(uuid) to service_role;
