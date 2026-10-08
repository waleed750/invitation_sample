-- 0014_admin_points_guard.sql

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
  v_profile         public.profiles%rowtype;
  v_current_balance integer;
  v_new_balance     integer;
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

  select coalesce(sum(delta), 0)::integer into v_current_balance
  from public.points_ledger
  where user_id = p_user_id
    and (expires_at is null or expires_at > now());

  if p_delta < 0 and (v_current_balance + p_delta) < 0 then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_points', 'balance', v_current_balance);
  end if;

  insert into public.points_ledger (user_id, delta, reason, expires_at)
  values (p_user_id, p_delta, 'admin', null);

  v_new_balance := v_current_balance + p_delta;

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
