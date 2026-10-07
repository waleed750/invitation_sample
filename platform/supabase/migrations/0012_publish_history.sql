-- 0012_publish_history.sql — undo the last publish, switch template (B1).
--
-- Same privilege model as publish_invitation (0002): `authenticated` may
-- execute, ownership is enforced inside via auth.uid(); SECURITY DEFINER is
-- what allows the writes RLS / invitations_guard deny to owners directly.
-- search_path is pinned. Both revoke from public / anon.

-- ---------------------------------------------------------------------------
-- undo_publish(p_invitation_id): roll the live page back one publish.
--
-- Deletes the newest invitation_publishes row and restores invitations.data
-- from the snapshot of the previous one. Does NOT touch edits_used: an edit
-- is consumed only by publish_invitation (edits_used + 1), so undo gives
-- nothing back and takes nothing.
--   {ok:true, published_at}  (published_at of the snapshot now live)  or
--   {ok:false, reason} with reason in ('not_owner','expired','nothing_to_undo').
-- ---------------------------------------------------------------------------

create or replace function public.undo_publish(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner     uuid;
  v_status    text;
  v_until     timestamptz;
  v_latest_id uuid;
  v_prev_at   timestamptz;
  v_prev_data jsonb;
begin
  -- Lock the invitation row so concurrent undo/publish serialise.
  select i.owner_id, i.status, e.online_until
    into v_owner, v_status, v_until
  from public.invitations i
  left join public.invitation_entitlements e
    on e.invitation_id = i.id
  where i.id = p_invitation_id
  for update of i;

  if not found or v_owner is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  if v_status <> 'published' or (v_until is not null and now() > v_until) then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select p.id into v_latest_id
  from public.invitation_publishes p
  where p.invitation_id = p_invitation_id
  order by p.published_at desc, p.id desc
  limit 1;

  select p.published_at, p.snapshot -> 'data'
    into v_prev_at, v_prev_data
  from public.invitation_publishes p
  where p.invitation_id = p_invitation_id
    and p.id <> v_latest_id
  order by p.published_at desc, p.id desc
  limit 1;

  if v_latest_id is null or not found then
    return jsonb_build_object('ok', false, 'reason', 'nothing_to_undo');
  end if;

  delete from public.invitation_publishes where id = v_latest_id;

  update public.invitations
  set data       = coalesce(v_prev_data, data),
      updated_at = now()
  where id = p_invitation_id;

  return jsonb_build_object('ok', true, 'published_at', v_prev_at);
end;
$$;

revoke all on function public.undo_publish(uuid) from public, anon;
grant execute on function public.undo_publish(uuid) to authenticated;
grant execute on function public.undo_publish(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- switch_template(p_invitation_id, p_template_slug): change the template.
--
-- The target must be live and of the same tier as the entitlement.
-- template_switches_left: null = unlimited, 0 = none left, otherwise -1.
-- Choosing the template already in use is a no-op (nothing consumed).
--   {ok:true} / {ok:true, unchanged:true}  or
--   {ok:false, reason} with reason in
--   ('not_owner','template_not_found','tier_mismatch','no_switches_left').
-- ---------------------------------------------------------------------------

create or replace function public.switch_template(p_invitation_id uuid, p_template_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner       uuid;
  v_current     uuid;
  v_tier        text;
  v_switches    integer;
  v_tpl_id      uuid;
  v_tpl_tier    text;
begin
  select i.owner_id, i.template_id
    into v_owner, v_current
  from public.invitations i
  where i.id = p_invitation_id
  for update of i;

  if not found or v_owner is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  select t.id, t.tier into v_tpl_id, v_tpl_tier
  from public.templates t
  where t.slug = p_template_slug
    and t.status = 'live';

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'template_not_found');
  end if;

  if v_current is not distinct from v_tpl_id then
    return jsonb_build_object('ok', true, 'unchanged', true);
  end if;

  select e.tier, e.template_switches_left
    into v_tier, v_switches
  from public.invitation_entitlements e
  where e.invitation_id = p_invitation_id
  for update;

  if not found then
    -- No paid entitlement: nothing to switch with.
    return jsonb_build_object('ok', false, 'reason', 'no_switches_left');
  end if;

  if v_tier is distinct from v_tpl_tier then
    return jsonb_build_object('ok', false, 'reason', 'tier_mismatch');
  end if;

  if v_switches is not null then
    if v_switches <= 0 then
      return jsonb_build_object('ok', false, 'reason', 'no_switches_left');
    end if;
    update public.invitation_entitlements
    set template_switches_left = template_switches_left - 1,
        updated_at             = now()
    where invitation_id = p_invitation_id;
  end if;

  update public.invitations
  set template_id = v_tpl_id,
      updated_at  = now()
  where id = p_invitation_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.switch_template(uuid, text) from public, anon;
grant execute on function public.switch_template(uuid, text) to authenticated;
grant execute on function public.switch_template(uuid, text) to service_role;
