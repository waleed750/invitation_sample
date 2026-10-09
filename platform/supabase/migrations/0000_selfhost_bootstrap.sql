-- 0000_selfhost_bootstrap.sql — recreate, on plain PostgreSQL 17, everything
-- Supabase used to provide so migrations 0001..0014 run UNCHANGED:
--   * roles anon / authenticated / service_role (+ the API login role app_api)
--   * Supabase's default privileges on schema public (0003 revokes from them)
--   * schema auth, auth.users (Supabase-compatible subset) and auth.uid()
--   * pgcrypto
--
-- Must be applied by a superuser / database owner (scripts/db-apply.sh does).
-- Idempotent: safe to re-run. NO passwords live in this file: set the
-- app_api password at deploy time (ALTER ROLE app_api PASSWORD '...').

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  -- Re-assert attributes on re-runs (a pre-existing role may differ).
  alter role anon nologin;
  alter role authenticated nologin;
  alter role service_role nologin bypassrls;

  -- Login role used by the NestJS API. It owns nothing and has no table
  -- privileges of its own: every query runs after `set local role
  -- anon|authenticated|service_role`. NOINHERIT keeps the member roles'
  -- privileges from leaking into the bare login session.
  if not exists (select 1 from pg_roles where rolname = 'app_api') then
    create role app_api login noinherit;
  end if;
  alter role app_api login noinherit;
end;
$$;

-- Membership is what allows `set local role ...` from the app_api session.
grant anon          to app_api;
grant authenticated to app_api;
grant service_role  to app_api;

-- ---------------------------------------------------------------------------
-- 2. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 3. Supabase default privileges on schema public.
-- Supabase grants these to anon/authenticated/service_role for every object
-- the migration owner creates; 0003 then REVOKEs from anon on sensitive
-- tables and grants back exact reads, and 0002/0004/0009+ REVOKE function
-- execute from public/anon/authenticated. The end state must match.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. auth schema: auth.users (Supabase-compatible subset) + auth.uid()
-- ---------------------------------------------------------------------------
create schema if not exists auth;

-- Policies and SECURITY INVOKER code call auth.uid() as the request role.
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  instance_id          uuid,
  id                   uuid primary key,
  aud                  text,
  role                 text,
  email                text,
  encrypted_password   text,
  email_confirmed_at   timestamptz,
  phone                text unique default null,
  phone_confirmed_at   timestamptz,
  raw_app_meta_data    jsonb default '{}'::jsonb,
  raw_user_meta_data   jsonb default '{}'::jsonb,
  is_super_admin       boolean,
  is_sso_user          boolean not null default false,
  is_anonymous         boolean not null default false,
  last_sign_in_at      timestamptz,
  banned_until         timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Same uniqueness Supabase enforces: one email per non-SSO user.
create unique index if not exists users_email_partial_key
  on auth.users (email)
  where is_sso_user = false;

-- Only the server (service_role) manages auth rows. Nothing else is granted:
-- the auth schema has no default privileges.
revoke all on table auth.users from public, anon, authenticated;
grant select, insert, update, delete on table auth.users to service_role;

-- auth.uid(): the caller's user id from the request claims GUC (set per
-- transaction by the API via set_config(..., true)); NULL when unset/empty.
-- Not recreated if a real one exists (e.g. someone applies this to Supabase).
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $fn$
      create function auth.uid()
      returns uuid
      language sql
      stable
      as $body$
        select nullif(
          nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
          ''
        )::uuid
      $body$
    $fn$;
  end if;
end;
$$;

revoke all on function auth.uid() from public;
grant execute on function auth.uid() to anon, authenticated, service_role;
