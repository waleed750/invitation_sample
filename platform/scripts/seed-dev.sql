-- Development seed. DEV ONLY: never run against production.
-- Idempotent: fixed ids + "if not exists" guards, so it can run any number of times.
-- Run through scripts/dev-setup.sh (needs the admin/superuser connection).
--
--   admin@example.test      admin
--   customer1@example.test  owns the paid, published invitation (10 RSVPs)
--   customer2@example.test  has one pending manual order
\set ON_ERROR_STOP on
begin;

-- ---------------------------------------------------------------------------
-- Users. Better Auth owns sign-in (better_auth."user"); auth.users mirrors it
-- and its trigger creates the matching profiles row.
-- ---------------------------------------------------------------------------
insert into better_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
values
  ('00000000-0000-4000-8000-000000000001', 'Dev Admin',  'admin@example.test',     true, now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'Dev Nour',   'customer1@example.test', true, now(), now()),
  ('00000000-0000-4000-8000-000000000003', 'Dev Sara',   'customer2@example.test', true, now(), now())
on conflict (id) do nothing;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
select u.id, 'authenticated', 'authenticated', u.email, now(),
       jsonb_build_object('name', u.name), jsonb_build_object('provider', 'email')
from better_auth."user" u
where u.email in ('admin@example.test', 'customer1@example.test', 'customer2@example.test')
on conflict (id) do nothing;

do $c$ begin perform set_config('request.jwt.claims', '', true); end $c$;
update public.profiles set role = 'admin', name = 'Dev Admin'
where id = '00000000-0000-4000-8000-000000000001' and role <> 'admin';

-- ---------------------------------------------------------------------------
-- Sellable templates live (the third-party-derived drafts stay draft/absent).
-- ---------------------------------------------------------------------------
insert into public.templates (slug, name_ar, name_en, name, tagline, tier, category, event_type, status, sort_order, featured, license_complete)
values
  ('diwan',      'ديوان',  'Diwan',      '{"ar":"ديوان","en":"Diwan"}',           '{"ar":"أمسية أنيقة بخطوط الأمل والذهب","en":"An elegant evening in calligraphy and gold"}', 'classic', 'wedding', 'wedding', 'live',  5, true,  true),
  ('mashrabiya', 'مشربية', 'Mashrabiya', '{"ar":"مشربية","en":"Mashrabiya"}',     '{"ar":"أمسية قاهرية ساحرة","en":"A Cairo rooftop evening"}',                              'classic', 'wedding', 'wedding', 'live', 10, false, true),
  ('bustan',     'بستان',  'Bustan',     '{"ar":"بستان","en":"Bustan"}',          '{"ar":"بوابة حديقة وممشى الورد","en":"A garden gate and a rose walk"}',                    'classic', 'wedding', 'wedding', 'live', 20, false, true),
  ('rawda',      'روضة',   'Rawda',      '{"ar":"روضة","en":"Rawda"}',            '{"ar":"حديقة ورد أبيض وشموع","en":"White roses and candlelight"}',                         'classic', 'wedding', 'wedding', 'live', 30, false, true),
  ('riwaq',      'رواق',   'Riwaq',      '{"ar":"رواق","en":"Riwaq"}',            '{"ar":"رواق من الأعمدة والستائر","en":"Columns, curtains and candlelight"}',               'classic', 'wedding', 'wedding', 'live', 40, false, true)
on conflict (slug) do update
  set status = 'live', license_complete = true;

-- Tier default prices (0006 already inserts them; this only fills gaps).
insert into public.prices (template_id, tier, currency, amount_minor)
select null, v.tier, 'EGP', v.amount_minor
from (values ('save_the_date', 49900::bigint), ('classic', 129900::bigint), ('premium', 249900::bigint)) as v(tier, amount_minor)
where not exists (
  select 1 from public.prices p
  where p.template_id is null and p.tier = v.tier and p.currency = 'EGP' and p.active
);

-- ---------------------------------------------------------------------------
-- Customer 1: paid order -> entitlement -> published invitation -> 10 RSVPs.
-- ---------------------------------------------------------------------------
do $seed$
declare
  v_order   constant uuid := '00000000-0000-4000-8000-0000000000a1';
  v_inv_id  uuid;
  v_data    jsonb;
begin
  if exists (select 1 from public.orders where id = v_order) then
    return;
  end if;

  v_data := jsonb_build_object(
    'template', jsonb_build_object('eventType', 'wedding', 'siteType', 'full-invitation',
      'experienceType', 'scroll-only', 'introType', 'none', 'layoutFamily', 'classic'),
    'theme', jsonb_build_object('background', '#fbf6ee', 'foreground', '#2a2118', 'muted', '#7a6a58', 'ivory', '#fffdf8'),
    'couple', jsonb_build_object('firstName', jsonb_build_object('ar', 'نور', 'en', 'Nour'),
                                  'secondName', jsonb_build_object('ar', 'عمر', 'en', 'Omar')),
    'event', jsonb_build_object('date', jsonb_build_object('ar', '2027-03-20', 'en', '2027-03-20')),
    'media', '{}'::jsonb,
    'copy', '{}'::jsonb,
    'sections', jsonb_build_array(
      jsonb_build_object('type', 'hero', 'id', 'hero', 'props', jsonb_build_object(
        'firstName', jsonb_build_object('ar', 'نور', 'en', 'Nour'),
        'secondName', jsonb_build_object('ar', 'عمر', 'en', 'Omar'),
        'displayDate', jsonb_build_object('ar', '٢٠ مارس ٢٠٢٧', 'en', '20 March 2027')))
    )
  );

  perform public.create_pending_checkout(
    v_order, '00000000-0000-4000-8000-000000000002',
    (select id from public.templates where slug = 'mashrabiya'),
    'classic', 'new', 129900, 'EGP', 'manual', 'seed-paid-order', null, 0, 0,
    'demo-nour-omar', v_data);

  perform public.admin_confirm_manual_payment(
    v_order, '00000000-0000-4000-8000-000000000001', 129900, 'SEED-PAID-1', null, false);

  select id into v_inv_id from public.invitations where order_id = v_order;

  -- Publish as the owner (auth.uid() reads the claims).
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
  perform public.publish_invitation(v_inv_id, v_data);
  perform set_config('request.jwt.claims', '', true);

  insert into public.rsvps (invitation_id, name, phone, guests_count, attending, note)
  select v_inv_id,
         (array['أحمد','منى','يوسف','ليلى','كريم','هدى','طارق','سلمى','عادل','دينا'])[n],
         '+2010000000' || lpad(n::text, 2, '0'),
         1 + (n % 3), n % 4 <> 0,
         case when n % 4 = 0 then 'للأسف مسافر' end
  from generate_series(1, 10) n
  on conflict (invitation_id, phone) do nothing;
end
$seed$;

-- ---------------------------------------------------------------------------
-- Customer 2: one pending manual order (shows in the admin queue), plus one
-- unmatched payment event for the admin to assign.
-- ---------------------------------------------------------------------------
do $seed$
declare
  v_order constant uuid := '00000000-0000-4000-8000-0000000000a2';
begin
  if exists (select 1 from public.orders where id = v_order) then
    return;
  end if;
  perform public.create_pending_checkout(
    v_order, '00000000-0000-4000-8000-000000000003',
    (select id from public.templates where slug = 'diwan'),
    'classic', 'new', 129900, 'EGP', 'manual', 'seed-pending-order', null, 0, 0,
    'demo-sara-ali', '{}'::jsonb);
  perform public.allocate_unique_amount(v_order);
end
$seed$;

insert into public.payment_events (provider, external_id, amount_minor, currency, sender, reference_text, received_at, raw, status, match_reason)
values ('easyconfirm', 'seed-event-1', 129977, 'EGP', 'Unknown sender', 'تحويل', now() - interval '1 hour',
        '{"seed":true}'::jsonb, 'unmatched', 'no order with this amount')
on conflict (provider, external_id) do nothing;

commit;
