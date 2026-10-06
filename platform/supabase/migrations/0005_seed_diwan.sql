insert into public.templates (
  slug, name_ar, name_en, name, tagline, tier, category, event_type,
  status, sort_order, featured, license_complete
) values (
  'diwan',
  'ديوان',
  'Diwan',
  '{"ar":"ديوان","en":"Diwan"}'::jsonb,
  '{"ar":"أمسية أنيقة بخطوط الأمل والذهب","en":"An elegant evening in green and gold"}'::jsonb,
  'classic',
  'wedding',
  'wedding',
  'live',
  5,
  true,
  true
)
on conflict (slug) do nothing;

update public.templates
set featured = false
where slug = 'mashrabiya';
