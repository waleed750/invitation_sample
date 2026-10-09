begin;

select plan(5);

-- 1. Check better_auth schema exists
select has_schema('better_auth', 'schema better_auth exists');

-- 2. Check better_auth."user" exists
select has_table('better_auth', 'user', 'table better_auth.user exists');

-- 3. Check better_auth."session" exists
select has_table('better_auth', 'session', 'table better_auth.session exists');

-- 4. Check app_api grant on better_auth
-- We can test if app_api can select from better_auth.user
set local role app_api;
select lives_ok(
    $$ select 1 from better_auth."user" limit 1 $$,
    'app_api can select from better_auth.user'
);
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

select results_eq(
  $$ select email, full_name, locale from public.profiles where id = '00000000-0000-0000-0000-000000001234' $$,
  $$ values ('test@example.com'::text, 'Test User'::text, 'ar'::text) $$,
  'trigger creates profile with right provider/locale'
);
reset role;

select * from finish();
rollback;
