-- 0025: customer pages (T21).
--  1. Upgrades: an extension / edits-pack order can target an existing invitation (orders.target_invitation_id).
--     Until now those kinds created no invitation, so fulfilment paid points out but changed no entitlement.
--  2. export_account_data(user): the caller's own data as JSON (never other people's: no guest RSVPs or messages).
--  3. anonymize_account(user): removes personal data and sign-in, keeps paid-order and credit records (legal).
-- All functions are service-role only; the API passes the authenticated user's id.

alter table public.orders
  add column target_invitation_id uuid references public.invitations (id) on delete set null;

create index idx_orders_target_invitation on public.orders (target_invitation_id) where target_invitation_id is not null;

-- ---------------------------------------------------------------------------
-- 1. create_pending_checkout with a target invitation
-- ---------------------------------------------------------------------------
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
  p_invitation_data jsonb,
  p_target_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_tier text := p_tier;
begin
  if p_kind in ('extension', 'edits') then
    -- must be the caller's own invitation with an entitlement; the order takes the invitation's plan, not the caller's word
    select e.tier into v_tier
    from public.invitations i
    join public.invitation_entitlements e on e.invitation_id = i.id
    where i.id = p_target_invitation_id and i.owner_id = p_user_id;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'target_not_found');
    end if;
  elsif p_target_invitation_id is not null then
    return jsonb_build_object('ok', false, 'reason', 'target_not_allowed');
  end if;

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
    idempotency_key, status, coupon_code, discount_total_minor, points_redeemed, target_invitation_id
  ) values (
    p_order_id, p_user_id, p_template_id, v_tier, p_kind, p_amount_minor, p_currency, p_provider,
    p_idempotency_key, 'pending', p_coupon_code, p_discount_total_minor, p_points_redeemed, p_target_invitation_id
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

revoke all on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb, uuid)
  to service_role;

-- The 14-argument version never linked an upgrade to its invitation; keep nobody calling it.
revoke all on function public.create_pending_checkout(uuid, uuid, uuid, text, text, bigint, text, text, text, text, bigint, integer, text, jsonb)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1b. fulfill_paid_order: same as 0006 except an upgrade is applied to its target invitation
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
  --    (T21) An extension / edits pack targets an existing invitation: orders.target_invitation_id.
  if v_order.target_invitation_id is not null then
    select i.id, i.data into v_inv_id, v_inv_data
    from public.invitations i
    where i.id = v_order.target_invitation_id;
  else
    select i.id, i.data into v_inv_id, v_inv_data
    from public.invitations i
    where i.order_id = v_order.id
    order by i.created_at desc
    limit 1;
  end if;

  if v_inv_id is not null then
    -- Event date drives min_online_until. Accept the documented shapes and
    -- ignore anything that is not an ISO date (never fail fulfillment).
    v_event_txt := coalesce(
      v_inv_data ->> 'event_date',
      v_inv_data #>> '{meta,eventDate}',
      v_inv_data #>> '{meta,event,date}',
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

-- ---------------------------------------------------------------------------
-- 2. export_account_data
-- ---------------------------------------------------------------------------
create or replace function public.export_account_data(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (
      select to_jsonb(p) from (
        select id, name, email, phone, preferred_locale, level, purchases_count, points_balance, credit_balance_minor, created_at
        from public.profiles where id = p_user
      ) p
    ),
    'orders', coalesce((
      select jsonb_agg(to_jsonb(o) order by o.created_at) from (
        select id, template_id, tier, kind, status, currency, amount_minor, discount_total_minor, points_redeemed, points_earned,
               provider, provider_ref, payment_txn_ref, target_invitation_id, created_at, paid_at, refunded_at
        from public.orders where user_id = p_user
      ) o
    ), '[]'::jsonb),
    'invitations', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.created_at) from (
        select inv.id, inv.slug, inv.status, inv.locale, inv.data, inv.created_at, inv.updated_at, inv.published_at,
               e.tier, e.edits_allowed, e.edits_used, e.online_until
        from public.invitations inv
        left join public.invitation_entitlements e on e.invitation_id = inv.id
        where inv.owner_id = p_user
      ) i
    ), '[]'::jsonb),
    'credit_topups', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at) from (
        select id, reference, amount_minor, extra_minor, currency, status, paid_minor, txn_ref, created_at, confirmed_at
        from public.credit_topups where user_id = p_user
      ) t
    ), '[]'::jsonb),
    'credit_ledger', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at) from (
        select id, kind, amount_minor, currency, topup_id, order_id, note, created_at
        from public.credit_ledger where user_id = p_user
      ) l
    ), '[]'::jsonb),
    'points_ledger', coalesce((
      select jsonb_agg(to_jsonb(pl) order by pl.created_at) from (
        select id, delta, reason, order_id, expires_at, created_at
        from public.points_ledger where user_id = p_user
      ) pl
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.created_at) from (
        select id, invitation_id, kind, original_name, content_type, size_bytes, status, created_at
        from public.media where owner_id = p_user
      ) m
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.export_account_data(uuid) from public, anon, authenticated;
grant execute on function public.export_account_data(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 3. anonymize_account
-- ---------------------------------------------------------------------------
create or replace function public.anonymize_account(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_placeholder text := 'deleted-' || replace(p_user::text, '-', '') || '@deleted.invalid';
  v_inv integer;
  v_media integer;
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if (select role from public.profiles where id = p_user) = 'admin' then
    return jsonb_build_object('ok', false, 'reason', 'admin_account');
  end if;

  -- Personal content: invitations (and everything hanging off them: publishes, RSVPs, guest messages, views, links).
  delete from public.invitations where owner_id = p_user;
  get diagnostics v_inv = row_count;
  delete from public.media where owner_id = p_user;
  get diagnostics v_media = row_count;

  -- The profile row stays (paid orders and the credit ledger must keep a valid owner), emptied of personal data.
  update public.profiles
  set name = null, email = null, phone = null, signup_method = null, preferred_locale = 'ar'
  where id = p_user;

  -- Sign-in: nothing can log in as this user again.
  delete from better_auth.session where "userId" = p_user;
  delete from better_auth.account where "userId" = p_user;
  delete from better_auth.verification
  where identifier in (select email from better_auth."user" where id = p_user);
  update better_auth."user"
  set name = 'Deleted', email = v_placeholder, "phoneNumber" = null, "phoneNumberVerified" = false, image = null,
      "emailVerified" = false, "updatedAt" = now()
  where id = p_user;
  update auth.users set email = v_placeholder, phone = null where id = p_user;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_user, 'account_deleted', 'profile', p_user::text, jsonb_build_object('invitations_removed', v_inv, 'media_rows_removed', v_media));

  return jsonb_build_object('ok', true, 'invitations_removed', v_inv, 'media_rows_removed', v_media);
end;
$$;

revoke all on function public.anonymize_account(uuid) from public, anon, authenticated;
grant execute on function public.anonymize_account(uuid) to service_role;
