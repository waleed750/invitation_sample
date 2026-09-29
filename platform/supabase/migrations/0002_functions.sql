-- 0002_functions.sql — helpers, fulfillment, refunds, publish gate.
--
-- Every function pins `set search_path = public` so a caller-controlled
-- search_path can never redirect table or helper references (Supabase /
-- Postgres SECURITY DEFINER hardening).
--
-- Privilege model:
--   * fulfill_paid_order / refund_order : service_role ONLY (webhooks, admin
--     tools). Revoked from public / anon / authenticated.
--   * assert_can_publish / publish_invitation : authenticated users, with an
--     explicit owner check against auth.uid() inside the function body.

-- ---------------------------------------------------------------------------
-- is_admin(): true when the calling JWT user has role = 'admin'
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- level_for_purchases(): Member / Silver / Gold from paid-order count
--   0-1 -> member, 2-3 -> silver, 4+ -> gold  (PLATFORM_PLAN §16.4)
-- ---------------------------------------------------------------------------

create or replace function public.level_for_purchases(p_count integer)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_count is null or p_count <= 1 then 'member'
    when p_count <= 3 then 'silver'
    else 'gold'
  end;
$$;

-- ---------------------------------------------------------------------------
-- points_balance_v: sum of non-expired ledger deltas per user.
-- The cached profiles.points_balance is recomputed from this definition.
-- ---------------------------------------------------------------------------

create or replace view public.points_balance_v as
select
  l.user_id as user_id,
  coalesce(sum(l.delta), 0)::integer as balance
from public.points_ledger l
where l.expires_at is null
   or l.expires_at > now()
group by l.user_id;

-- ---------------------------------------------------------------------------
-- Tier table (PLATFORM_PLAN §16.3). Single source of truth used below:
--   save_the_date :  5 edits /  3 months online / event +  7 days / 1 switch
--   classic       : 15 edits /  6 months online / event + 14 days / 2 switches
--   premium       : 40 edits / 12 months online / event + 30 days / unlimited
-- Implemented as CASE expressions inside fulfill_paid_order so the rule
-- lives in exactly one place.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- fulfill_paid_order(p_order_id): atomic, idempotent fulfillment.
--
-- Called once per VERIFIED payment webhook (service role only). In ONE
-- transaction it:
--   1. locks the order row (FOR UPDATE); if it is not `pending` it returns
--      {ok:false, reason:'already_processed'} with NO changes (duplicate
--      webhooks are safe);
--   2. marks the order paid;
--   3. creates or extends invitation_entitlements per the tier table
--      (kind=new: fresh entitlement; kind=extension: add months to the
--      current online_until; kind=edits: +10 edits; kind=addon: points only);
--   4. writes points_ledger rows (purchase + first-order bonus + redeem);
--   5. recomputes profiles.purchases_count / level / points_balance;
--   6. returns a jsonb summary.
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
      v_base_points := floor(v_order.amount_egp / 10)::integer;
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

-- ---------------------------------------------------------------------------
-- refund_order(p_order_id): reverse a paid order.
--
-- Service role only. Compensates EVERY ledger row of the order with an
-- equal-and-opposite `refund` row (earned points are taken back; redeemed
-- points are given back), sets status `refunded`, and recomputes the
-- profile counters. The balance may legitimately go negative when points
-- were already spent (§16.4).
-- ---------------------------------------------------------------------------

create or replace function public.refund_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_row       record;
  v_paid_count  integer;
  v_new_balance integer;
  v_level       text;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found', 'order_id', p_order_id);
  end if;

  if v_order.status <> 'paid' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'not_refundable',
      'order_id', v_order.id,
      'status', v_order.status
    );
  end if;

  -- Compensating rows: negate every existing row for this order.
  -- (purchase/bonus deltas are removed; redeem deltas are restored.)
  for v_row in
    select id, user_id, delta
    from public.points_ledger
    where order_id = v_order.id
  loop
    insert into public.points_ledger (user_id, order_id, delta, reason, expires_at)
    values (v_row.user_id, v_order.id, -v_row.delta, 'refund', null);
  end loop;

  update public.orders
  set status = 'refunded',
      refunded_at = now()
  where id = v_order.id;

  if v_order.user_id is not null then
    select count(*)::integer into v_paid_count
    from public.orders
    where user_id = v_order.user_id
      and status = 'paid';

    select coalesce(sum(delta), 0)::integer into v_new_balance
    from public.points_ledger
    where user_id = v_order.user_id
      and (expires_at is null or expires_at > now());

    v_level := public.level_for_purchases(v_paid_count);

    update public.profiles
    set purchases_count = v_paid_count,
        level           = v_level,
        points_balance  = v_new_balance
    where id = v_order.user_id;
  else
    v_paid_count := null;
    v_new_balance := null;
    v_level := null;
  end if;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'purchases_count', v_paid_count,
    'points_balance', v_new_balance,
    'level', v_level
  );
end;
$$;

revoke all on function public.refund_order(uuid) from public, anon, authenticated;
grant execute on function public.refund_order(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- assert_can_publish(p_invitation_id): the single server-side publish gate
-- (§16.8). Every publish path calls this. Returns
--   {ok:true, edits_left, online_until}  or
--   {ok:false, reason} with reason in ('not_owner','no_edits_left','expired').
--
-- Notes:
--   * A draft that was never published has no deadline yet -> not expired.
--   * An invitation with no entitlement row (e.g. legacy / link-only draft
--     with no paid order) is treated as 'expired': there is nothing to
--     publish against, and only the server (service role) can grant it.
-- ---------------------------------------------------------------------------

create or replace function public.assert_can_publish(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_owner  uuid;
  v_status text;
  v_until  timestamptz;
  v_pub_at timestamptz;
  v_allowed integer;
  v_used    integer;
begin
  select i.owner_id, i.status, e.online_until, i.published_at,
         e.edits_allowed, e.edits_used
    into v_owner, v_status, v_until, v_pub_at, v_allowed, v_used
  from public.invitations i
  left join public.invitation_entitlements e
    on e.invitation_id = i.id
  where i.id = p_invitation_id;

  if not found or v_owner is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  if v_allowed is null then
    -- No paid entitlement backing this invitation.
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_used >= v_allowed then
    return jsonb_build_object(
      'ok', false, 'reason', 'no_edits_left',
      'edits_allowed', v_allowed, 'edits_used', v_used
    );
  end if;

  if v_until is not null and now() > v_until then
    return jsonb_build_object(
      'ok', false, 'reason', 'expired',
      'online_until', v_until
    );
  end if;

  if v_status in ('ended', 'archived') then
    return jsonb_build_object('ok', false, 'reason', 'expired', 'status', v_status);
  end if;

  return jsonb_build_object(
    'ok', true,
    'edits_left', v_allowed - v_used,
    'online_until', v_until
  );
end;
$$;

grant execute on function public.assert_can_publish(uuid) to authenticated;
grant execute on function public.assert_can_publish(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- publish_invitation(p_invitation_id, p_data): owner publish path.
--
-- Calls assert_can_publish, then in one transaction: consumes one edit,
-- stores a snapshot row (undo/history), and flips the invitation to
-- published (setting first published_at). Callable by `authenticated`;
-- ownership is enforced inside via auth.uid(), and the SECURITY DEFINER
-- context is what allows the entitlement counter + snapshot writes that
-- RLS denies to owners directly.
-- ---------------------------------------------------------------------------

create or replace function public.publish_invitation(p_invitation_id uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gate    jsonb;
  v_used    integer;
  v_allowed integer;
begin
  v_gate := public.assert_can_publish(p_invitation_id);

  if not ((v_gate ->> 'ok')::boolean) then
    return v_gate;
  end if;

  update public.invitation_entitlements
  set edits_used = edits_used + 1,
      updated_at = now()
  where invitation_id = p_invitation_id
  returning edits_used, edits_allowed into v_used, v_allowed;

  update public.invitations
  set data         = coalesce(p_data, data),
      status       = 'published',
      published_at = coalesce(published_at, now()),
      updated_at   = now()
  where id = p_invitation_id
    and owner_id = auth.uid();

  if not found then
    -- Lost a race on ownership; roll back the consumed edit.
    raise exception 'publish_invitation: invitation not owned by caller';
  end if;

  insert into public.invitation_publishes (invitation_id, published_by, snapshot)
  values (
    p_invitation_id,
    auth.uid(),
    jsonb_build_object('data', p_data, 'edits_used', v_used, 'edits_allowed', v_allowed)
  );

  return jsonb_build_object(
    'ok', true,
    'invitation_id', p_invitation_id,
    'edits_used', v_used,
    'edits_left', v_allowed - v_used
  );
end;
$$;

grant execute on function public.publish_invitation(uuid, jsonb) to authenticated;
grant execute on function public.publish_invitation(uuid, jsonb) to service_role;
