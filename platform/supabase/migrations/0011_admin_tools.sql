-- 0011_admin_tools.sql — B5: admin customer tools.
--
--   * admin_adjust_entitlement : add edits and/or extend online_until, audited
--   * admin_adjust_points      : signed points_ledger row (reason 'admin'), audited
--
-- Both functions are SECURITY DEFINER and executable by service_role only.
-- Each writes exactly one audit_log row with before/after values and the reason.

-- ---------------------------------------------------------------------------
-- 1. admin_adjust_entitlement
-- ---------------------------------------------------------------------------

create or replace function public.admin_adjust_entitlement(
  p_admin_id       uuid,
  p_invitation_id  uuid,
  p_add_edits      integer,
  p_extend_days    integer,
  p_reason         text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ent             public.invitation_entitlements%rowtype;
  v_status_before   text;
  v_status_after    text;
  v_add_edits       integer := coalesce(p_add_edits, 0);
  v_extend_days     integer := coalesce(p_extend_days, 0);
  v_new_edits       integer;
  v_new_online      timestamptz;
begin
  if p_reason is null or btrim(p_reason) = '' then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;

  if v_add_edits < 0 or v_add_edits > 100
     or v_extend_days < 0 or v_extend_days > 365
     or (v_add_edits = 0 and v_extend_days = 0) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_adjustment');
  end if;

  select * into v_ent
  from public.invitation_entitlements
  where invitation_id = p_invitation_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select status into v_status_before
  from public.invitations
  where id = p_invitation_id
  for update;

  v_status_after := v_status_before;
  v_new_edits := v_ent.edits_allowed + v_add_edits;
  v_new_online := v_ent.online_until;

  if v_extend_days > 0 then
    v_new_online := greatest(v_ent.online_until, now()) + make_interval(days => v_extend_days);
  end if;

  update public.invitation_entitlements
  set edits_allowed = v_new_edits,
      online_until  = v_new_online
  where invitation_id = p_invitation_id;

  -- An ended invitation that is online again goes back to published
  -- (invitations_guard lets SECURITY DEFINER code change status).
  if v_status_before = 'ended' and v_new_online is not null and v_new_online > now() then
    update public.invitations
    set status = 'published'
    where id = p_invitation_id;
    v_status_after := 'published';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    'entitlement.adjust',
    'invitation',
    p_invitation_id::text,
    jsonb_build_object(
      'reason', btrim(p_reason),
      'add_edits', v_add_edits,
      'extend_days', v_extend_days,
      'before', jsonb_build_object(
        'edits_allowed', v_ent.edits_allowed,
        'online_until', v_ent.online_until,
        'status', v_status_before
      ),
      'after', jsonb_build_object(
        'edits_allowed', v_new_edits,
        'online_until', v_new_online,
        'status', v_status_after
      )
    )
  );

  return jsonb_build_object(
    'ok', true,
    'edits_allowed', v_new_edits,
    'online_until', v_new_online,
    'status', v_status_after
  );
end;
$$;

revoke all on function public.admin_adjust_entitlement(uuid, uuid, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_adjust_entitlement(uuid, uuid, integer, integer, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 2. admin_adjust_points
-- ---------------------------------------------------------------------------

create or replace function public.admin_adjust_points(
  p_admin_id  uuid,
  p_user_id   uuid,
  p_delta     integer,
  p_reason    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile      public.profiles%rowtype;
  v_new_balance  integer;
begin
  if p_reason is null or btrim(p_reason) = '' then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;

  if p_delta is null or p_delta = 0 or p_delta < -100000 or p_delta > 100000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_adjustment');
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into public.points_ledger (user_id, delta, reason, expires_at)
  values (p_user_id, p_delta, 'admin', null);

  -- Same definition as fulfill_paid_order: non-expired ledger deltas.
  select coalesce(sum(delta), 0)::integer into v_new_balance
  from public.points_ledger
  where user_id = p_user_id
    and (expires_at is null or expires_at > now());

  update public.profiles
  set points_balance = v_new_balance
  where id = p_user_id;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (
    p_admin_id,
    'points.adjust',
    'profile',
    p_user_id::text,
    jsonb_build_object(
      'reason', btrim(p_reason),
      'delta', p_delta,
      'before', jsonb_build_object('points_balance', v_profile.points_balance),
      'after', jsonb_build_object('points_balance', v_new_balance)
    )
  );

  return jsonb_build_object('ok', true, 'balance', v_new_balance);
end;
$$;

revoke all on function public.admin_adjust_points(uuid, uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_adjust_points(uuid, uuid, integer, text)
  to service_role;
