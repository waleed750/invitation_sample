-- tests/guards.sql — column guards under a ROLE-SWITCHING connection (0015).
--
-- RUN:  psql "$DATABASE_URL_ADMIN" -v ON_ERROR_STOP=1 -f tests/guards.sql
--   (after migrations 0000..latest; connect as the owner / superuser — the
--   file uses SET LOCAL ROLE to act as authenticated / anon, exactly like the
--   API does with app_api). Everything is ROLLED BACK at the end.
--
-- Proves: a direct client UPDATE of server-managed columns FAILS, an allowed
-- column succeeds, the SECURITY DEFINER publish_invitation() still works, and
-- anon cannot write at all.

begin;

-- ---------------------------------------------------------------------------
-- Fixtures (as the owner; guards are bypassed for non-end-user roles).
-- The signup trigger (0013) creates the profile row.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email)
values ('c0000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'guards-owner@example.com');

insert into auth.users (id, aud, role, email)
values ('c0000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'guards-other@example.com');

insert into public.templates (id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values (
  'c1000000-0000-0000-0000-000000000001',
  'guards-classic', 'قالب', 'Guards Classic',
  jsonb_build_object('ar', 'قالب', 'en', 'Guards Classic'),
  jsonb_build_object('ar', '', 'en', ''), 'classic', 'live', true
);

insert into public.invitations (id, owner_id, template_id, slug, data, status)
values
  ('c2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000a',
   'c1000000-0000-0000-0000-000000000001', 'guards-draft', '{"v": 0}', 'draft'),
  ('c2000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000000a',
   'c1000000-0000-0000-0000-000000000001', 'guards-live', '{"v": 0}', 'draft');

insert into public.invitation_entitlements
  (invitation_id, tier, edits_allowed, edits_used, template_switches_left, online_until)
values
  ('c2000000-0000-0000-0000-000000000001', 'classic', 15, 0, 1, now() + interval '30 days'),
  ('c2000000-0000-0000-0000-000000000002', 'classic', 15, 0, 1, now() + interval '30 days');

do $$
begin
  assert exists (select 1 from public.profiles where id = 'c0000000-0000-0000-0000-00000000000a'),
    'fixture: signup trigger must create the owner profile';
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. As `authenticated` (the owner): guarded columns are protected.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  n integer;
begin
  -- invitations: status
  begin
    update public.invitations set status = 'published'
    where id = 'c2000000-0000-0000-0000-000000000001';
    assert false, 'authenticated must NOT set invitations.status directly';
  exception when raise_exception then
    null;
  end;

  -- invitations: published_at
  begin
    update public.invitations set published_at = now()
    where id = 'c2000000-0000-0000-0000-000000000001';
    assert false, 'authenticated must NOT set invitations.published_at directly';
  exception when raise_exception then
    null;
  end;

  -- profiles: role
  begin
    update public.profiles set role = 'admin'
    where id = 'c0000000-0000-0000-0000-00000000000a';
    assert false, 'authenticated must NOT set profiles.role';
  exception when raise_exception then
    null;
  end;

  -- profiles: points_balance
  begin
    update public.profiles set points_balance = 1000000
    where id = 'c0000000-0000-0000-0000-00000000000a';
    assert false, 'authenticated must NOT set profiles.points_balance';
  exception when raise_exception then
    null;
  end;

  -- profiles: level / purchases_count
  begin
    update public.profiles set level = 'gold'
    where id = 'c0000000-0000-0000-0000-00000000000a';
    assert false, 'authenticated must NOT set profiles.level';
  exception when raise_exception then
    null;
  end;
  begin
    update public.profiles set purchases_count = 99
    where id = 'c0000000-0000-0000-0000-00000000000a';
    assert false, 'authenticated must NOT set profiles.purchases_count';
  exception when raise_exception then
    null;
  end;

  -- Allowed columns still work.
  update public.profiles set name = 'Renamed Owner'
  where id = 'c0000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 1, 'authenticated must be able to change profiles.name';

  update public.invitations set data = '{"v": 1}'
  where id = 'c2000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 1, 'authenticated must be able to change invitations.data';

  -- publish_invitation() is SECURITY DEFINER: the status flip is allowed there.
  perform public.publish_invitation('c2000000-0000-0000-0000-000000000002', '{"v": 2}'::jsonb);
  assert (select status from public.invitations where id = 'c2000000-0000-0000-0000-000000000002')
         = 'published', 'publish_invitation() must still publish';

  -- A published slug is frozen for the owner.
  begin
    update public.invitations set slug = 'guards-renamed'
    where id = 'c2000000-0000-0000-0000-000000000002';
    assert false, 'authenticated must NOT change a published slug';
  exception when raise_exception then
    null;
  end;
end;
$$;

-- Another authenticated user cannot touch the owner's rows (RLS, 0 rows).
select set_config('request.jwt.claims',
  '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

do $$
declare
  n integer;
begin
  update public.invitations set data = '{"hijack": true}'
  where id = 'c2000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'a different authenticated user must not update the owner invitation';
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Empty claims while still `authenticated`: no bypass (auth.uid() is null
--    must not disable the guard, which is the 0003 bug).
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '', true);

do $$
begin
  begin
    update public.profiles set role = 'admin'
    where id = 'c0000000-0000-0000-0000-00000000000a';
    -- RLS hides the row without a uid, so either 0 rows or an exception is fine,
    -- but the role must not have changed.
  exception when raise_exception or insufficient_privilege then
    null;
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. `anon` cannot write.
-- ---------------------------------------------------------------------------
reset role;
set local role anon;

do $$
begin
  begin
    update public.invitations set status = 'published'
    where id = 'c2000000-0000-0000-0000-000000000001';
    assert false, 'anon must not update invitations';
  exception when insufficient_privilege or raise_exception then
    null;
  end;

  begin
    update public.profiles set role = 'admin'
    where id = 'c0000000-0000-0000-0000-00000000000a';
    assert false, 'anon must not update profiles';
  exception when insufficient_privilege or raise_exception then
    null;
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Server roles are unrestricted (service_role and the owner).
-- ---------------------------------------------------------------------------
reset role;
set local role service_role;

do $$
declare
  n integer;
begin
  update public.profiles set points_balance = 10, level = 'silver'
  where id = 'c0000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 1, 'service_role must be able to change guarded profile columns';
end;
$$;

reset role;

do $$
begin
  assert (select role from public.profiles where id = 'c0000000-0000-0000-0000-00000000000a') = 'customer',
    'profile role must still be customer after all attempts';
  assert (select status from public.invitations where id = 'c2000000-0000-0000-0000-000000000001') = 'draft',
    'draft invitation must still be a draft';
end;
$$;

rollback;
