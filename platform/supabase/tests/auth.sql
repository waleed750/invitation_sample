begin;

select set_config('request.jwt.claims', '', true);

do $$
begin
  -- 1. Check better_auth schema exists
  assert exists (select 1 from information_schema.schemata where schema_name = 'better_auth'),
    'schema better_auth must exist';

  -- 2. Check better_auth."user" exists with expected columns
  assert exists (select 1 from information_schema.tables where table_schema = 'better_auth' and table_name = 'user'),
    'table better_auth.user must exist';
  assert exists (select 1 from information_schema.columns where table_schema = 'better_auth' and table_name = 'user' and column_name = 'id'), 'user.id must exist';
  assert exists (select 1 from information_schema.columns where table_schema = 'better_auth' and table_name = 'user' and column_name = 'email'), 'user.email must exist';
  assert exists (select 1 from information_schema.columns where table_schema = 'better_auth' and table_name = 'user' and column_name = 'phoneNumber'), 'user.phoneNumber must exist';

  -- 3. Check better_auth."session" exists with expected columns
  assert exists (select 1 from information_schema.tables where table_schema = 'better_auth' and table_name = 'session'),
    'table better_auth.session must exist';
  assert exists (select 1 from information_schema.columns where table_schema = 'better_auth' and table_name = 'session' and column_name = 'id'), 'session.id must exist';
  assert exists (select 1 from information_schema.columns where table_schema = 'better_auth' and table_name = 'session' and column_name = 'token'), 'session.token must exist';
  assert exists (select 1 from information_schema.columns where table_schema = 'better_auth' and table_name = 'session' and column_name = 'userId'), 'session.userId must exist';
end;
$$;

-- 4. Check app_api grant on better_auth
-- We can test if app_api can select from better_auth.user
set local role app_api;
do $$
begin
  perform 1 from better_auth."user" limit 1;
end;
$$;
reset role;

-- 5. Test inserting into auth.users (service context) triggers profile creation
set local role service_role;
insert into auth.users (id, aud, role, email, raw_user_meta_data, raw_app_meta_data)
values (
  '00000000-0000-0000-0000-000000001234',
  'authenticated',
  'authenticated',
  'test@example.com',
  '{"name": "Test User", "locale": "ar"}'::jsonb,
  '{"provider": "email"}'::jsonb
);

do $$
declare
  p record;
begin
  select email, name, preferred_locale into p from public.profiles where id = '00000000-0000-0000-0000-000000001234';
  assert p.email = 'test@example.com', 'email must match test@example.com';
  assert p.name = 'Test User', 'name must match Test User';
  assert p.preferred_locale = 'ar', 'preferred_locale must match ar';
end;
$$;
reset role;

rollback;
