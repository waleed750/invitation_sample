-- 0028 replaced profiles_guard() for referral fields but omitted the credit
-- balance check from 0023. Keep all protected fields in the same guard.
create or replace function public.profiles_guard()
returns trigger language plpgsql set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if new.role is distinct from old.role then raise exception 'profiles: role is managed by the server'; end if;
  if new.level is distinct from old.level then raise exception 'profiles: level is managed by the server'; end if;
  if new.purchases_count is distinct from old.purchases_count then raise exception 'profiles: purchases_count is managed by the server'; end if;
  if new.points_balance is distinct from old.points_balance then raise exception 'profiles: points_balance is managed by the server'; end if;
  if new.credit_balance_minor is distinct from old.credit_balance_minor then
    raise exception 'profiles: credit_balance_minor is managed by the server';
  end if;
  if new.referral_code is distinct from old.referral_code or new.referred_by is distinct from old.referred_by
     or new.referral_rewarded_at is distinct from old.referral_rewarded_at then
    raise exception 'profiles: referral fields are managed by the server';
  end if;
  return new;
end $$;
