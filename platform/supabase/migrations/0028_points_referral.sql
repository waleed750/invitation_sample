-- 0028: points at checkout + referral (T24).
--  1. Points are reserved by open orders: a customer cannot spend the same points on two orders waiting to be paid.
--  2. Referral: every customer has a personal code; when a friend's FIRST paid order completes, the referrer gets +100 points
--     (once per friend, never for yourself). A refund of that order takes the reward back.
--  3. points_expiring_soon(): what the customer is about to lose, for the points page.

alter table public.points_ledger drop constraint points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check
  check (reason in ('purchase', 'bonus', 'redeem', 'refund', 'admin', 'expire', 'referral'));

alter table public.profiles
  add column referral_code text unique check (referral_code ~ '^f-[a-hj-np-z2-9]{8}$'),
  add column referred_by uuid references public.profiles (id) on delete set null,
  add column referral_rewarded_at timestamptz;

create or replace function public.profiles_guard()
returns trigger language plpgsql set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if new.role is distinct from old.role then raise exception 'profiles: role is managed by the server'; end if;
  if new.level is distinct from old.level then raise exception 'profiles: level is managed by the server'; end if;
  if new.purchases_count is distinct from old.purchases_count then raise exception 'profiles: purchases_count is managed by the server'; end if;
  if new.points_balance is distinct from old.points_balance then raise exception 'profiles: points_balance is managed by the server'; end if;
  if new.referral_code is distinct from old.referral_code or new.referred_by is distinct from old.referred_by
     or new.referral_rewarded_at is distinct from old.referral_rewarded_at then
    raise exception 'profiles: referral fields are managed by the server';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 1. points reserved by open orders
-- ---------------------------------------------------------------------------
-- Spendable points = non-expired ledger balance minus the points already promised to this customer's other open orders.
create or replace function public.spendable_points(p_user uuid)
returns integer language sql stable security definer set search_path = public
as $$
  select greatest(0,
    coalesce((select sum(delta) from public.points_ledger where user_id = p_user and (expires_at is null or expires_at > now())), 0)::integer
    - coalesce((select sum(points_redeemed) from public.orders where user_id = p_user and status in ('pending', 'awaiting_balance')), 0)::integer
  );
$$;
revoke all on function public.spendable_points(uuid) from public, anon, authenticated;
grant execute on function public.spendable_points(uuid) to service_role;

-- Same as 0025, plus: the points an order redeems must be spendable, checked under a lock on the customer's profile.
create or replace function public.create_pending_checkout(
  p_order_id uuid, p_user_id uuid, p_template_id uuid, p_tier text, p_kind text, p_amount_minor bigint, p_currency text,
  p_provider text, p_idempotency_key text, p_coupon_code text, p_discount_total_minor bigint, p_points_redeemed integer,
  p_invitation_slug text, p_invitation_data jsonb, p_target_invitation_id uuid
) returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_tier text := p_tier;
begin
  if p_kind in ('extension', 'edits') then
    select e.tier into v_tier
    from public.invitations i join public.invitation_entitlements e on e.invitation_id = i.id
    where i.id = p_target_invitation_id and i.owner_id = p_user_id;
    if not found then return jsonb_build_object('ok', false, 'reason', 'target_not_found'); end if;
  elsif p_target_invitation_id is not null then
    return jsonb_build_object('ok', false, 'reason', 'target_not_allowed');
  end if;

  if p_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_idempotency_key, 0));
    select * into v_order from public.orders where user_id = p_user_id and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('order_id', v_order.id, 'amount_minor', v_order.amount_minor, 'currency', v_order.currency, 'existing', true);
    end if;
  end if;

  if p_points_redeemed > 0 then
    perform 1 from public.profiles where id = p_user_id for update;
    if public.spendable_points(p_user_id) < p_points_redeemed then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_points', 'spendable', public.spendable_points(p_user_id));
    end if;
  end if;

  insert into public.orders (
    id, user_id, template_id, tier, kind, amount_minor, currency, provider,
    idempotency_key, status, coupon_code, discount_total_minor, points_redeemed, target_invitation_id
  ) values (
    p_order_id, p_user_id, p_template_id, v_tier, p_kind, p_amount_minor, p_currency, p_provider,
    p_idempotency_key, 'pending', p_coupon_code, p_discount_total_minor, p_points_redeemed, p_target_invitation_id
  ) returning * into v_order;

  if p_kind = 'new' then
    insert into public.invitations (owner_id, template_id, order_id, slug, data, status)
    values (p_user_id, p_template_id, v_order.id, p_invitation_slug, p_invitation_data, 'draft');
  end if;

  return jsonb_build_object('order_id', v_order.id, 'amount_minor', v_order.amount_minor, 'currency', v_order.currency, 'existing', false);
end $$;
revoke all on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 2. referral
-- ---------------------------------------------------------------------------
create or replace function public.get_referral_code(p_user uuid)
returns text language plpgsql security definer set search_path = public
as $$
declare v_code text; v_try integer := 0; v_alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
begin
  select referral_code into v_code from public.profiles where id = p_user;
  if not found then return null; end if;
  if v_code is not null then return v_code; end if;
  loop
    v_try := v_try + 1;
    v_code := 'f-' || (select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1), '') from generate_series(1, 8));
    begin
      update public.profiles set referral_code = v_code where id = p_user and referral_code is null;
      select referral_code into v_code from public.profiles where id = p_user;
      return v_code;
    exception when unique_violation then
      if v_try >= 10 then raise; end if;
    end;
  end loop;
end $$;
revoke all on function public.get_referral_code(uuid) from public, anon, authenticated;
grant execute on function public.get_referral_code(uuid) to service_role;

-- A friend arrives with a code: remember who invited them. Only a customer with no paid order yet, once, never themself.
create or replace function public.attach_referrer(p_user uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_referrer uuid; v_me public.profiles%rowtype;
begin
  select * into v_me from public.profiles where id = p_user for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_me.referred_by is not null then return jsonb_build_object('ok', true, 'attached', false, 'why', 'already_referred'); end if;
  if exists (select 1 from public.orders where user_id = p_user and status in ('paid', 'refunded')) then
    return jsonb_build_object('ok', true, 'attached', false, 'why', 'not_a_new_customer');
  end if;
  select id into v_referrer from public.profiles where referral_code = lower(btrim(p_code));
  if v_referrer is null then return jsonb_build_object('ok', true, 'attached', false, 'why', 'unknown_code'); end if;
  if v_referrer = p_user then return jsonb_build_object('ok', true, 'attached', false, 'why', 'self'); end if;
  update public.profiles set referred_by = v_referrer where id = p_user;
  return jsonb_build_object('ok', true, 'attached', true);
end $$;
revoke all on function public.attach_referrer(uuid, text) from public, anon, authenticated;
grant execute on function public.attach_referrer(uuid, text) to service_role;

-- The reward: the friend's first paid NEW order gives the referrer +100 points, once. The row carries the friend's order id,
-- so refunding that order (refund_order) takes the reward back.
create or replace function public.reward_referrer()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_friend public.profiles%rowtype; v_balance integer;
begin
  if not (new.status = 'paid' and old.status is distinct from 'paid' and new.kind = 'new' and new.user_id is not null) then return new; end if;
  select * into v_friend from public.profiles where id = new.user_id for update;
  if v_friend.referred_by is null or v_friend.referred_by = v_friend.id or v_friend.referral_rewarded_at is not null then return new; end if;
  if (select count(*) from public.orders where user_id = new.user_id and status = 'paid' and id <> new.id) > 0 then return new; end if;
  if not exists (select 1 from public.profiles where id = v_friend.referred_by) then return new; end if;

  insert into public.points_ledger (user_id, order_id, delta, reason, expires_at)
  values (v_friend.referred_by, new.id, 100, 'referral', now() + interval '12 months');
  update public.profiles set referral_rewarded_at = now() where id = v_friend.id;
  select coalesce(sum(delta), 0)::integer into v_balance from public.points_ledger
   where user_id = v_friend.referred_by and (expires_at is null or expires_at > now());
  update public.profiles set points_balance = v_balance where id = v_friend.referred_by;
  return new;
end $$;
create trigger trg_orders_reward_referrer after update of status on public.orders
  for each row execute function public.reward_referrer();

-- refund_order recomputes only the buyer's cached balance; the referrer's reward is taken back by the same refund,
-- so refresh their cache too.
create or replace function public.refresh_referrer_balance()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_referrer uuid;
begin
  if not (new.status = 'refunded' and old.status is distinct from 'refunded') then return new; end if;
  for v_referrer in select distinct user_id from public.points_ledger where order_id = new.id and user_id is distinct from new.user_id loop
    update public.profiles set points_balance = (
      select coalesce(sum(delta), 0)::integer from public.points_ledger where user_id = v_referrer and (expires_at is null or expires_at > now())
    ) where id = v_referrer;
  end loop;
  return new;
end $$;
create trigger trg_orders_refresh_referrer after update of status on public.orders
  for each row execute function public.refresh_referrer_balance();

create or replace function public.referral_summary(p_user uuid)
returns jsonb language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'invited', (select count(*) from public.profiles where referred_by = p_user),
    'rewarded', (select count(*) from public.profiles where referred_by = p_user and referral_rewarded_at is not null),
    'reward_points', 100
  );
$$;
revoke all on function public.referral_summary(uuid) from public, anon, authenticated;
grant execute on function public.referral_summary(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 3. points about to expire
-- ---------------------------------------------------------------------------
-- What the customer would lose in the next p_days: the balance now minus the balance then (spent points never expire).
create or replace function public.points_expiring_soon(p_user uuid, p_days integer)
returns jsonb language sql stable security definer set search_path = public
as $$
  with b as (
    select
      coalesce(sum(delta) filter (where expires_at is null or expires_at > now()), 0) as now_balance,
      coalesce(sum(delta) filter (where expires_at is null or expires_at > now() + make_interval(days => p_days)), 0) as later_balance,
      min(expires_at) filter (where expires_at > now() and expires_at <= now() + make_interval(days => p_days) and delta > 0) as first_expiry
    from public.points_ledger where user_id = p_user
  )
  select jsonb_build_object('points', greatest(0, (now_balance - greatest(0, later_balance))::integer), 'first_expiry', first_expiry, 'days', p_days) from b;
$$;
revoke all on function public.points_expiring_soon(uuid, integer) from public, anon, authenticated;
grant execute on function public.points_expiring_soon(uuid, integer) to service_role;
