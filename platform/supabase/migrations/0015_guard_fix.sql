-- 0015_guard_fix.sql — SECURITY FIX for the column-guard triggers of 0003.
--
-- 0003 let a write through when `current_user <> session_user` or when
-- `auth.uid() is null`. Under any role-switching connection (the API's
-- app_api login + `set local role authenticated`, or PostgREST) current_user
-- differs from session_user for EVERY statement, so the guards never
-- protected anything; and an unauthenticated (anon) caller has auth.uid()
-- NULL, so it bypassed them as well.
--
-- New rule: the guard is skipped ONLY when the effective role is neither
-- `authenticated` nor `anon`. That is exactly: SECURITY DEFINER functions
-- (current_user = the migration owner, e.g. publish_invitation,
-- fulfill_paid_order), service_role, and the owner/superuser. Everything an
-- end user can reach as `authenticated` / `anon` goes through the column
-- checks, which are unchanged.

create or replace function public.invitations_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Publishes, expiry moves and order links go ONLY through RPCs / server.
  if new.status is distinct from old.status then
    raise exception 'invitations: status changes are allowed only via publish_invitation()';
  end if;
  if new.published_at is distinct from old.published_at then
    raise exception 'invitations: published_at is managed by the server';
  end if;
  if new.order_id is distinct from old.order_id then
    raise exception 'invitations: order_id is managed by the server';
  end if;
  -- A public slug is a stable share link: frozen once published.
  if old.status = 'published' and new.slug is distinct from old.slug then
    raise exception 'invitations: slug cannot change after publishing';
  end if;

  return new;
end;
$$;

create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Users may edit name/phone/email/locale — never their own privilege,
  -- loyalty or money fields.
  if new.role is distinct from old.role then
    raise exception 'profiles: role is managed by the server';
  end if;
  if new.level is distinct from old.level then
    raise exception 'profiles: level is managed by the server';
  end if;
  if new.purchases_count is distinct from old.purchases_count then
    raise exception 'profiles: purchases_count is managed by the server';
  end if;
  if new.points_balance is distinct from old.points_balance then
    raise exception 'profiles: points_balance is managed by the server';
  end if;

  return new;
end;
$$;
