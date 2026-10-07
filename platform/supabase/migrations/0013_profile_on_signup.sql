-- 0013_profile_on_signup.sql

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _phone text;
  _email text;
  _name text;
  _locale text;
  _signup_method text;
begin
  -- normalize phone
  if new.phone is not null and new.phone <> '' then
    _phone := new.phone;
    if _phone ~ '^\d+$' then
      _phone := '+' || _phone;
    end if;
  else
    _phone := null;
  end if;

  -- normalize email
  if new.email is not null and new.email <> '' then
    _email := new.email;
  else
    _email := null;
  end if;

  -- name
  _name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');

  -- locale
  if new.raw_user_meta_data->>'locale' = 'en' then
    _locale := 'en';
  else
    _locale := 'ar';
  end if;

  -- signup_method: 'whatsapp' | 'email' | 'google' | 'password' | 'manual' | 'link'
  -- mapping: 'google' -> 'google', 'phone' -> 'whatsapp', 'email' -> 'email', anything else -> 'email'
  case new.raw_app_meta_data->>'provider'
    when 'google' then _signup_method := 'google';
    when 'phone' then _signup_method := 'whatsapp';
    when 'email' then _signup_method := 'email';
    else _signup_method := 'email';
  end case;

  begin
    insert into public.profiles (
      id, phone, email, name, preferred_locale, signup_method, role
    ) values (
      new.id, _phone, _email, _name, _locale, _signup_method, 'customer'
    ) on conflict (id) do nothing;
  exception
    when unique_violation then
      -- If phone or email is already taken, insert with nulls to not fail the signup
      insert into public.profiles (
        id, phone, email, name, preferred_locale, signup_method, role
      ) values (
        new.id, null, null, _name, _locale, _signup_method, 'customer'
      ) on conflict (id) do nothing;
  end;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill
do $$
declare
  u record;
  _phone text;
  _email text;
  _name text;
  _locale text;
  _signup_method text;
begin
  for u in select * from auth.users where not exists (select 1 from public.profiles where id = auth.users.id) loop
    if u.phone is not null and u.phone <> '' then
      _phone := u.phone;
      if _phone ~ '^\d+$' then
        _phone := '+' || _phone;
      end if;
    else
      _phone := null;
    end if;

    if u.email is not null and u.email <> '' then
      _email := u.email;
    else
      _email := null;
    end if;

    _name := coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '');

    if u.raw_user_meta_data->>'locale' = 'en' then
      _locale := 'en';
    else
      _locale := 'ar';
    end if;

    case u.raw_app_meta_data->>'provider'
      when 'google' then _signup_method := 'google';
      when 'phone' then _signup_method := 'whatsapp';
      when 'email' then _signup_method := 'email';
      else _signup_method := 'email';
    end case;

    begin
      insert into public.profiles (
        id, phone, email, name, preferred_locale, signup_method, role
      ) values (
        u.id, _phone, _email, _name, _locale, _signup_method, 'customer'
      ) on conflict (id) do nothing;
    exception
      when unique_violation then
        insert into public.profiles (
          id, phone, email, name, preferred_locale, signup_method, role
        ) values (
          u.id, null, null, _name, _locale, _signup_method, 'customer'
        ) on conflict (id) do nothing;
    end;
  end loop;
end;
$$;
