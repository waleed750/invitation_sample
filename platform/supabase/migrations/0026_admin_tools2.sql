-- 0026: admin tools (T22).
--   1. app_settings: payment instructions, notification texts, support WhatsApp (admin only, audited)
--   2. coupons: used_count was never incremented, so max_uses never limited anything; count a use when the order is paid
--   3. templates: create/edit, status draft -> live -> retired, with a licence gate; assets with source + licence
--   4. affiliates: create/update, attribution (a code beats a link, links count for 30 days), stats, payouts,
--      commission payable only after the 7-day refund window
--   5. manual refund (money returned outside the system)
-- Every function takes the acting admin's id and re-checks the role; all are service-role only.

create or replace function public.assert_admin(p_admin uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = p_admin and role = 'admin'); $$;
revoke all on function public.assert_admin(uuid) from public, anon, authenticated;
grant execute on function public.assert_admin(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 1. settings
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key        text primary key check (key in ('payment_instructions', 'email_texts', 'support_whatsapp')),
  value      jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on table public.app_settings from public, anon, authenticated;

insert into public.app_settings (key, value) values
  ('payment_instructions', '{"ar": "", "en": ""}'::jsonb),
  ('email_texts', '{}'::jsonb),
  ('support_whatsapp', '""'::jsonb);

create or replace function public.admin_set_setting(p_admin uuid, p_key text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_old jsonb;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  select value into v_old from public.app_settings where key = p_key;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown_key'); end if;
  if p_key = 'support_whatsapp' and not (jsonb_typeof(p_value) = 'string' and (p_value #>> '{}') ~ '^(\+?[0-9]{8,15})?$') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_value');
  end if;
  if p_key in ('payment_instructions', 'email_texts') and jsonb_typeof(p_value) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_value');
  end if;
  update public.app_settings set value = p_value, updated_by = p_admin, updated_at = now() where key = p_key;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'settings.update', 'setting', p_key, jsonb_build_object('from', v_old, 'to', p_value));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_set_setting(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_set_setting(uuid, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 2. coupon uses
-- ---------------------------------------------------------------------------
create or replace function public.count_coupon_use()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.coupon_code is not null and new.status = 'paid' and old.status is distinct from 'paid' then
    update public.coupons set used_count = used_count + 1 where code = new.coupon_code;
  end if;
  return new;
end $$;
create trigger trg_orders_count_coupon_use after update of status on public.orders
  for each row execute function public.count_coupon_use();

create or replace function public.admin_create_coupon(
  p_admin uuid, p_code text, p_percent numeric, p_amount_minor bigint, p_max_uses integer, p_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_code text := lower(btrim(p_code));
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if v_code !~ '^[a-z0-9_-]{3,32}$' then return jsonb_build_object('ok', false, 'reason', 'invalid_code'); end if;
  if (p_percent is null) = (p_amount_minor is null) then return jsonb_build_object('ok', false, 'reason', 'percent_or_amount'); end if;
  if p_percent is not null and (p_percent <= 0 or p_percent > 100) then return jsonb_build_object('ok', false, 'reason', 'invalid_percent'); end if;
  if p_amount_minor is not null and p_amount_minor <= 0 then return jsonb_build_object('ok', false, 'reason', 'invalid_amount'); end if;
  if p_max_uses is not null and p_max_uses <= 0 then return jsonb_build_object('ok', false, 'reason', 'invalid_max_uses'); end if;
  if exists (select 1 from public.coupons where code = v_code) then return jsonb_build_object('ok', false, 'reason', 'code_taken'); end if;
  insert into public.coupons (code, percent_off, amount_off_minor, currency, max_uses, expires_at, active)
  values (v_code, p_percent, p_amount_minor, 'EGP', p_max_uses, p_expires_at, true);
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'coupon.create', 'coupon', v_code, jsonb_build_object('percent', p_percent, 'amount_minor', p_amount_minor, 'max_uses', p_max_uses, 'expires_at', p_expires_at));
  return jsonb_build_object('ok', true, 'code', v_code);
end $$;
revoke all on function public.admin_create_coupon(uuid, text, numeric, bigint, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_create_coupon(uuid, text, numeric, bigint, integer, timestamptz) to service_role;

create or replace function public.admin_set_coupon_active(p_admin uuid, p_code text, p_active boolean)
returns jsonb language plpgsql security definer set search_path = public
as $$
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  update public.coupons set active = p_active where code = lower(p_code);
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, case when p_active then 'coupon.activate' else 'coupon.deactivate' end, 'coupon', lower(p_code), '{}'::jsonb);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_set_coupon_active(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_coupon_active(uuid, text, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- 3. templates
-- ---------------------------------------------------------------------------
-- p_data keys: slug, name_ar, name_en, tagline_ar, tagline_en, tier (save_the_date|classic|premium), category, event_type,
-- sort_order, featured, sample_data_ar, sample_data_en. A new template starts as a draft.
create or replace function public.admin_save_template(p_admin uuid, p_id uuid, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_slug text := lower(btrim(p_data ->> 'slug'));
  v_tier text := coalesce(p_data ->> 'tier', 'classic');
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if v_tier not in ('save_the_date', 'classic', 'premium') then return jsonb_build_object('ok', false, 'reason', 'invalid_tier'); end if;
  if coalesce(btrim(p_data ->> 'name_ar'), '') = '' or coalesce(btrim(p_data ->> 'name_en'), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'names_required');
  end if;
  if p_id is null then
    if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return jsonb_build_object('ok', false, 'reason', 'invalid_slug'); end if;
    if exists (select 1 from public.templates where slug = v_slug) then return jsonb_build_object('ok', false, 'reason', 'slug_taken'); end if;
    insert into public.templates (slug, name_ar, name_en, name, tagline, tier, category, event_type, sort_order, featured,
                                  sample_data_ar, sample_data_en, status, license_complete, theme_spec, preview_media)
    values (v_slug, p_data ->> 'name_ar', p_data ->> 'name_en',
            jsonb_build_object('ar', p_data ->> 'name_ar', 'en', p_data ->> 'name_en'),
            jsonb_build_object('ar', coalesce(p_data ->> 'tagline_ar', ''), 'en', coalesce(p_data ->> 'tagline_en', '')),
            v_tier, nullif(p_data ->> 'category', ''), nullif(p_data ->> 'event_type', ''),
            coalesce((p_data ->> 'sort_order')::integer, 100), coalesce((p_data ->> 'featured')::boolean, false),
            coalesce(p_data -> 'sample_data_ar', '{}'::jsonb), coalesce(p_data -> 'sample_data_en', '{}'::jsonb),
            'draft', false, '{}'::jsonb, '[]'::jsonb)
    returning id into v_id;
    insert into public.audit_log (actor_id, action, target_type, target_id, details)
    values (p_admin, 'template.create', 'template', v_id::text, jsonb_build_object('slug', v_slug));
  else
    update public.templates set
      name_ar = p_data ->> 'name_ar', name_en = p_data ->> 'name_en',
      name = jsonb_build_object('ar', p_data ->> 'name_ar', 'en', p_data ->> 'name_en'),
      tagline = jsonb_build_object('ar', coalesce(p_data ->> 'tagline_ar', tagline ->> 'ar', ''), 'en', coalesce(p_data ->> 'tagline_en', tagline ->> 'en', '')),
      tier = v_tier, category = nullif(p_data ->> 'category', ''), event_type = nullif(p_data ->> 'event_type', ''),
      sort_order = coalesce((p_data ->> 'sort_order')::integer, sort_order), featured = coalesce((p_data ->> 'featured')::boolean, featured),
      sample_data_ar = coalesce(p_data -> 'sample_data_ar', sample_data_ar), sample_data_en = coalesce(p_data -> 'sample_data_en', sample_data_en)
    where id = p_id returning id into v_id;
    if v_id is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
    insert into public.audit_log (actor_id, action, target_type, target_id, details)
    values (p_admin, 'template.update', 'template', v_id::text, '{}'::jsonb);
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.admin_save_template(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_template(uuid, uuid, jsonb) to service_role;

-- Assets that lack a source or a licence (the gate looks at these).
create or replace function public.template_unlicensed_assets(p_template uuid)
returns jsonb language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(a.id order by a.created_at), '[]'::jsonb)
  from public.template_assets a
  where a.template_id = p_template and (coalesce(btrim(a.source), '') = '' or coalesce(btrim(a.license), '') = '');
$$;
revoke all on function public.template_unlicensed_assets(uuid) from public, anon, authenticated;
grant execute on function public.template_unlicensed_assets(uuid) to service_role;

create or replace function public.admin_set_template_status(p_admin uuid, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_old text; v_bad jsonb;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if p_status not in ('draft', 'live', 'retired') then return jsonb_build_object('ok', false, 'reason', 'invalid_status'); end if;
  select status into v_old from public.templates where id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_old = p_status then return jsonb_build_object('ok', true, 'already', true); end if;
  -- draft -> live -> retired (a retired template can be put back to draft to be fixed, not straight to live)
  if not ((v_old = 'draft' and p_status in ('live', 'retired')) or (v_old = 'live' and p_status in ('retired', 'draft')) or (v_old = 'retired' and p_status = 'draft')) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_transition', 'from', v_old, 'to', p_status);
  end if;
  if p_status = 'live' then
    v_bad := public.template_unlicensed_assets(p_id);
    if jsonb_array_length(v_bad) > 0 then
      return jsonb_build_object('ok', false, 'reason', 'license_incomplete', 'assets', v_bad);
    end if;
  end if;
  update public.templates set status = p_status, license_complete = (p_status = 'live' or license_complete) where id = p_id;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'template.status', 'template', p_id::text, jsonb_build_object('from', v_old, 'to', p_status));
  return jsonb_build_object('ok', true, 'already', false);
end $$;
revoke all on function public.admin_set_template_status(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_template_status(uuid, uuid, text) to service_role;

create or replace function public.admin_save_template_asset(p_admin uuid, p_template uuid, p_asset uuid, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_status text;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  select status into v_status from public.templates where id = p_template;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if p_asset is null then
    if coalesce(btrim(p_data ->> 'r2_key'), '') = '' then return jsonb_build_object('ok', false, 'reason', 'key_required'); end if;
    insert into public.template_assets (template_id, r2_key, kind, size_bytes, source, license, license_url)
    values (p_template, btrim(p_data ->> 'r2_key'), nullif(p_data ->> 'kind', ''), (p_data ->> 'size_bytes')::bigint,
            nullif(btrim(p_data ->> 'source'), ''), nullif(btrim(p_data ->> 'license'), ''), nullif(btrim(p_data ->> 'license_url'), ''))
    returning id into v_id;
  else
    update public.template_assets set
      kind = coalesce(nullif(p_data ->> 'kind', ''), kind),
      source = nullif(btrim(p_data ->> 'source'), ''), license = nullif(btrim(p_data ->> 'license'), ''), license_url = nullif(btrim(p_data ->> 'license_url'), '')
    where id = p_asset and template_id = p_template returning id into v_id;
    if v_id is null then return jsonb_build_object('ok', false, 'reason', 'asset_not_found'); end if;
  end if;
  -- A live template whose asset loses its source or licence goes back to draft: the gate holds after launch too.
  if v_status = 'live' and jsonb_array_length(public.template_unlicensed_assets(p_template)) > 0 then
    update public.templates set status = 'draft' where id = p_template;
    insert into public.audit_log (actor_id, action, target_type, target_id, details)
    values (p_admin, 'template.status', 'template', p_template::text, jsonb_build_object('from', 'live', 'to', 'draft', 'why', 'license_incomplete'));
  end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'template.asset', 'template', p_template::text, jsonb_build_object('asset', v_id));
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.admin_save_template_asset(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_template_asset(uuid, uuid, uuid, jsonb) to service_role;

create or replace function public.admin_delete_template_asset(p_admin uuid, p_template uuid, p_asset uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  delete from public.template_assets where id = p_asset and template_id = p_template;
  if not found then return jsonb_build_object('ok', false, 'reason', 'asset_not_found'); end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'template.asset_delete', 'template', p_template::text, jsonb_build_object('asset', p_asset));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_delete_template_asset(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_template_asset(uuid, uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4. affiliates
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_affiliate(p_admin uuid, p_id uuid, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_code text := lower(btrim(p_data ->> 'ref_code'));
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if coalesce(btrim(p_data ->> 'name'), '') = '' then return jsonb_build_object('ok', false, 'reason', 'name_required'); end if;
  if coalesce((p_data ->> 'commission_pct')::numeric, 0) < 0 or coalesce((p_data ->> 'commission_pct')::numeric, 0) > 100
     or coalesce((p_data ->> 'customer_discount_pct')::numeric, 0) < 0 or coalesce((p_data ->> 'customer_discount_pct')::numeric, 0) > 30 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_percent');
  end if;
  if p_id is null then
    if v_code !~ '^[a-z0-9_-]{3,32}$' then return jsonb_build_object('ok', false, 'reason', 'invalid_code'); end if;
    if exists (select 1 from public.affiliates where ref_code = v_code) then return jsonb_build_object('ok', false, 'reason', 'code_taken'); end if;
    insert into public.affiliates (name, phone, ref_code, commission_pct, customer_discount_pct, payout_method, payout_details, active)
    values (btrim(p_data ->> 'name'), nullif(btrim(p_data ->> 'phone'), ''), v_code, coalesce((p_data ->> 'commission_pct')::numeric, 10),
            coalesce((p_data ->> 'customer_discount_pct')::numeric, 0), nullif(p_data ->> 'payout_method', ''),
            coalesce(p_data -> 'payout_details', '{}'::jsonb), true)
    returning id into v_id;
    insert into public.audit_log (actor_id, action, target_type, target_id, details)
    values (p_admin, 'affiliate.create', 'affiliate', v_id::text, jsonb_build_object('ref_code', v_code));
  else
    update public.affiliates set
      name = btrim(p_data ->> 'name'), phone = nullif(btrim(p_data ->> 'phone'), ''),
      commission_pct = coalesce((p_data ->> 'commission_pct')::numeric, commission_pct),
      customer_discount_pct = coalesce((p_data ->> 'customer_discount_pct')::numeric, customer_discount_pct),
      payout_method = nullif(p_data ->> 'payout_method', ''), payout_details = coalesce(p_data -> 'payout_details', payout_details),
      active = coalesce((p_data ->> 'active')::boolean, active)
    where id = p_id returning id into v_id;
    if v_id is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
    insert into public.audit_log (actor_id, action, target_type, target_id, details)
    values (p_admin, 'affiliate.update', 'affiliate', v_id::text, '{}'::jsonb);
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.admin_save_affiliate(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_affiliate(uuid, uuid, jsonb) to service_role;

-- Which affiliate gets an order. A code the buyer typed always beats a link they clicked earlier;
-- a link only counts for 30 days after the click. Only an active affiliate is credited.
create or replace function public.resolve_affiliate(p_code text, p_ref text, p_ref_at timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare v_aff public.affiliates%rowtype; v_how text;
begin
  if nullif(btrim(p_code), '') is not null then
    select * into v_aff from public.affiliates where ref_code = lower(btrim(p_code)) and active;
    if found then v_how := 'code'; end if;
  end if;
  if v_how is null and nullif(btrim(p_ref), '') is not null and p_ref_at is not null
     and p_ref_at <= now() + interval '5 minutes' and p_ref_at > now() - interval '30 days' then
    select * into v_aff from public.affiliates where ref_code = lower(btrim(p_ref)) and active;
    if found then v_how := 'link'; end if;
  end if;
  if v_how is null then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'affiliate_id', v_aff.id, 'attribution', v_how, 'customer_discount_pct', v_aff.customer_discount_pct);
end $$;
revoke all on function public.resolve_affiliate(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.resolve_affiliate(text, text, timestamptz) to service_role;

create or replace function public.attach_order_affiliate(p_order uuid, p_code text, p_ref text, p_ref_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_found jsonb; v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.affiliate_id is not null or v_order.status not in ('pending', 'awaiting_balance') then
    return jsonb_build_object('ok', true, 'attributed', false);
  end if;
  v_found := public.resolve_affiliate(p_code, p_ref, p_ref_at);
  if (v_found ->> 'found')::boolean is not true then return jsonb_build_object('ok', true, 'attributed', false); end if;
  update public.orders set affiliate_id = (v_found ->> 'affiliate_id')::uuid, attribution = v_found ->> 'attribution' where id = p_order;
  return jsonb_build_object('ok', true, 'attributed', true, 'affiliate_id', v_found -> 'affiliate_id', 'attribution', v_found -> 'attribution');
end $$;
revoke all on function public.attach_order_affiliate(uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.attach_order_affiliate(uuid, text, text, timestamptz) to service_role;

-- Counts one affiliate-link click per day and landing path (no personal data).
create or replace function public.count_affiliate_click(p_ref text, p_path text)
returns void language sql security definer set search_path = public
as $$
  insert into public.affiliate_clicks (affiliate_id, day, landing_path, count)
  select id, current_date, left(coalesce(nullif(p_path, ''), '/'), 120), 1 from public.affiliates where ref_code = lower(btrim(p_ref)) and active
  on conflict (affiliate_id, day, landing_path) do update set count = public.affiliate_clicks.count + 1;
$$;
revoke all on function public.count_affiliate_click(text, text) from public, anon, authenticated;
grant execute on function public.count_affiliate_click(text, text) to service_role;

-- Stats for a date range. Commission is earned on paid, not-refunded orders; it becomes PAYABLE once the order is 7 days old
-- (the refund window). Orders where the buyer's phone is the affiliate's own phone are flagged as self-referrals and earn nothing.
create or replace function public.affiliate_stats(p_affiliate uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_aff public.affiliates%rowtype;
  v_clicks bigint;
  v_orders integer; v_self integer;
  v_earned numeric(12,2); v_payable numeric(12,2); v_paid numeric(12,2);
begin
  select * into v_aff from public.affiliates where id = p_affiliate;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select coalesce(sum(count), 0) into v_clicks from public.affiliate_clicks
   where affiliate_id = p_affiliate and day between coalesce(p_from, date '2000-01-01') and coalesce(p_to, date '2999-12-31');

  with o as (
    select ord.id, ord.amount_minor, ord.paid_at,
           (v_aff.phone is not null and pr.phone is not null and pr.phone = v_aff.phone) as self_referral
    from public.orders ord left join public.profiles pr on pr.id = ord.user_id
    where ord.affiliate_id = p_affiliate and ord.status = 'paid'
      and ord.paid_at::date between coalesce(p_from, date '2000-01-01') and coalesce(p_to, date '2999-12-31')
  )
  select count(*) filter (where not self_referral), count(*) filter (where self_referral),
         coalesce(sum(round(amount_minor * v_aff.commission_pct / 100.0) / 100.0) filter (where not self_referral), 0),
         coalesce(sum(round(amount_minor * v_aff.commission_pct / 100.0) / 100.0) filter (where not self_referral and paid_at <= now() - interval '7 days'), 0)
  into v_orders, v_self, v_earned, v_payable from o;

  select coalesce(sum(amount_egp), 0) into v_paid from public.affiliate_payouts where affiliate_id = p_affiliate;
  return jsonb_build_object('ok', true, 'clicks', v_clicks, 'orders', v_orders, 'self_referral_orders', v_self,
    'commission_earned_egp', v_earned, 'commission_payable_egp', v_payable,
    'paid_out_egp', v_paid, 'payable_now_egp', greatest(0, least(v_payable, v_earned) - v_paid));
end $$;
revoke all on function public.affiliate_stats(uuid, date, date) from public, anon, authenticated;
grant execute on function public.affiliate_stats(uuid, date, date) to service_role;

create or replace function public.admin_record_payout(p_admin uuid, p_affiliate uuid, p_amount_egp numeric, p_method text, p_reference text, p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_stats jsonb; v_id uuid;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if p_amount_egp is null or p_amount_egp <= 0 then return jsonb_build_object('ok', false, 'reason', 'invalid_amount'); end if;
  perform 1 from public.affiliates where id = p_affiliate for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  -- all-time view: the payable figure the admin sees is never above what the refund window has released
  v_stats := public.affiliate_stats(p_affiliate, null, null);
  if p_amount_egp > (v_stats ->> 'payable_now_egp')::numeric then
    return jsonb_build_object('ok', false, 'reason', 'exceeds_payable', 'payable_now_egp', v_stats -> 'payable_now_egp');
  end if;
  insert into public.affiliate_payouts (affiliate_id, amount_egp, method, reference, period_start, period_end, created_by)
  values (p_affiliate, p_amount_egp, nullif(p_method, ''), nullif(p_reference, ''), p_from, p_to, p_admin) returning id into v_id;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'affiliate.payout', 'affiliate', p_affiliate::text, jsonb_build_object('amount_egp', p_amount_egp, 'reference', p_reference));
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.admin_record_payout(uuid, uuid, numeric, text, text, date, date) from public, anon, authenticated;
grant execute on function public.admin_record_payout(uuid, uuid, numeric, text, text, date, date) to service_role;

-- ---------------------------------------------------------------------------
-- 5. manual refund
-- ---------------------------------------------------------------------------
create or replace function public.admin_mark_refunded(p_admin uuid, p_order uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_order public.orders%rowtype; v_result jsonb;
begin
  if not public.assert_admin(p_admin) then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if p_note is null or btrim(p_note) = '' then return jsonb_build_object('ok', false, 'reason', 'note_required'); end if;
  select * into v_order from public.orders where id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_order.status = 'refunded' then return jsonb_build_object('ok', true, 'already', true); end if;
  if v_order.status <> 'paid' then return jsonb_build_object('ok', false, 'reason', 'not_refundable', 'status', v_order.status); end if;
  v_result := public.refund_order(p_order);
  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    raise exception 'refund_order failed: %', v_result::text;
  end if;
  update public.orders set refunded_at = now() where id = p_order and refunded_at is null;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_admin, 'order.refund_manual', 'order', p_order::text, jsonb_build_object('note', p_note, 'amount_minor', coalesce(v_order.paid_amount_minor, v_order.amount_minor)));
  return jsonb_build_object('ok', true, 'already', false);
end $$;
revoke all on function public.admin_mark_refunded(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_mark_refunded(uuid, uuid, text) to service_role;
