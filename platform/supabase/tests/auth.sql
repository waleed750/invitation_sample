begin;

select set_config('request.jwt.claims', '', true);

do $$
begin
  -- 1. Check better_auth schema exists
  assert exists (select 1 from information_schema.schemata where schema_name = 'better_auth'),
    'schema better_auth must exist';

  -- 2. Check better_auth."user" exists
  assert exists (select 1 from information_schema.tables where table_schema = 'better_auth' and table_name = 'user'),
    'table better_auth.user must exist';

  -- 3. Check better_auth."session" exists
  assert exists (select 1 from information_schema.tables where table_schema = 'better_auth' and table_name = 'session'),
    'table better_auth.session must exist';
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
  select email, full_name, locale into p from public.profiles where id = '00000000-0000-0000-0000-000000001234';
  assert p.email = 'test@example.com', 'email must match test@example.com';
  assert p.full_name = 'Test User', 'full_name must match Test User';
  assert p.locale = 'ar', 'locale must match ar';
end;
$$;
reset role;

rollback;
