-- 0027: private edit links (T23).
-- An admin issues a secret link for one invitation. The 32-byte token is shown once; only its SHA-256 is stored.
-- The link works on the editor routes of that invitation only, can be revoked at any time, and can be claimed
-- into a customer's own account ("Save to my account"), which revokes every link of the invitation.

alter table public.invitation_access_links
  add column label text,
  add column expires_at timestamptz not null default (now() + interval '90 days'),
  add column claimed_by uuid references public.profiles (id) on delete set null,
  add column claimed_at timestamptz;

create unique index idx_access_links_token_hash on public.invitation_access_links (token_hash);

create or replace function public.admin_issue_edit_link(p_admin uuid, p_invitation uuid, p_token_hash text, p_label text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_expires timestamptz;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'reason', 'invalid_token'); end if;
  if not exists (select 1 from public.invitations where id = p_invitation and owner_id is not null) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  insert into public.invitation_access_links (invitation_id, token_hash, created_by, label)
  values (p_invitation, p_token_hash, p_admin, nullif(btrim(p_label), '')) returning id, expires_at into v_id, v_expires;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'edit_link.issue', 'invitation', p_invitation::text, jsonb_build_object('link', v_id));
  return jsonb_build_object('ok', true, 'id', v_id, 'expires_at', v_expires);
end $$;
revoke all on function public.admin_issue_edit_link(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_issue_edit_link(uuid, uuid, text, text) to service_role;

create or replace function public.admin_revoke_edit_link(p_admin uuid, p_link uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_inv uuid;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  update public.invitation_access_links set revoked_at = now() where id = p_link and revoked_at is null returning invitation_id into v_inv;
  if v_inv is null then
    if exists (select 1 from public.invitation_access_links where id = p_link) then return jsonb_build_object('ok', true, 'already', true); end if;
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'edit_link.revoke', 'invitation', v_inv::text, jsonb_build_object('link', p_link));
  return jsonb_build_object('ok', true, 'already', false);
end $$;
revoke all on function public.admin_revoke_edit_link(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_edit_link(uuid, uuid) to service_role;

-- The invitation a token opens, or {found:false}. Revoked, expired and claimed links never resolve.
create or replace function public.resolve_edit_link(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v public.invitation_access_links%rowtype; v_owner uuid;
begin
  select * into v from public.invitation_access_links where token_hash = p_token_hash;
  if not found or v.revoked_at is not null or v.expires_at <= now() then return jsonb_build_object('found', false); end if;
  select owner_id into v_owner from public.invitations where id = v.invitation_id;
  if v_owner is null then return jsonb_build_object('found', false); end if;
  if v.last_used_at is null or v.last_used_at < now() - interval '1 minute' then
    update public.invitation_access_links set last_used_at = now() where id = v.id;
  end if;
  return jsonb_build_object('found', true, 'link_id', v.id, 'invitation_id', v.invitation_id, 'owner_id', v_owner);
end $$;
revoke all on function public.resolve_edit_link(text) from public, anon, authenticated;
grant execute on function public.resolve_edit_link(text) to service_role;

-- "Save to my account": the invitation moves to the signed-in customer and every link to it stops working.
create or replace function public.claim_invitation(p_user uuid, p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_found jsonb; v_inv uuid; v_old uuid;
begin
  v_found := public.resolve_edit_link(p_token_hash);
  if (v_found ->> 'found')::boolean is not true then return jsonb_build_object('ok', false, 'reason', 'invalid_link'); end if;
  v_inv := (v_found ->> 'invitation_id')::uuid;
  v_old := (v_found ->> 'owner_id')::uuid;
  if not exists (select 1 from public.profiles where id = p_user) then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_old <> p_user then
    update public.invitations set owner_id = p_user where id = v_inv;
  end if;
  update public.invitation_access_links set revoked_at = coalesce(revoked_at, now()),
    claimed_by = case when id = (v_found ->> 'link_id')::uuid then p_user else claimed_by end,
    claimed_at = case when id = (v_found ->> 'link_id')::uuid then now() else claimed_at end
  where invitation_id = v_inv;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_user, 'invitation.claim', 'invitation', v_inv::text, jsonb_build_object('from_owner', v_old));
  return jsonb_build_object('ok', true, 'invitation_id', v_inv);
end $$;
revoke all on function public.claim_invitation(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_invitation(uuid, text) to service_role;
