-- 0004_mock_provider_and_seed.sql — mock commerce support + first live template.
-- Safe to re-run: DDL uses IF EXISTS/IF NOT EXISTS and the seed never replaces
-- an operator-edited catalog row.

alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check
  check (provider in ('fawry', 'kashier', 'manual', 'mock'));

-- Idempotency is scoped to the authenticated customer, not globally.
alter table public.orders drop constraint if exists orders_idempotency_key_key;
create unique index if not exists idx_orders_user_idempotency
  on public.orders (user_id, idempotency_key)
  where idempotency_key is not null;

-- The original table predates the shared CatalogEntry contract. Keep its
-- bilingual legacy columns for admin compatibility and add the JSONB contract
-- fields consumed by the API.
alter table public.templates add column if not exists name jsonb;
alter table public.templates add column if not exists tagline jsonb;
alter table public.templates add column if not exists price_override_egp numeric(12, 2)
  check (price_override_egp is null or price_override_egp > 0);

update public.templates
set name = jsonb_build_object('ar', name_ar, 'en', name_en)
where name is null;
update public.templates
set tagline = jsonb_build_object('ar', '', 'en', '')
where tagline is null;

alter table public.templates alter column name set not null;
alter table public.templates alter column tagline set not null;

insert into public.templates (
  slug, name_ar, name_en, name, tagline, tier, category, event_type,
  status, sort_order, featured, license_complete
) values (
  'mashrabiya',
  'مشربية',
  'Mashrabiya',
  '{"ar":"مشربية","en":"Mashrabiya"}'::jsonb,
  '{"ar":"أمسية قاهرية ساحرة تحت ضوء القمر بشبابيك مشربية أصيلة","en":"A Cairo rooftop evening under the moon with authentic mashrabiya shutters"}'::jsonb,
  'classic',
  'wedding',
  'wedding',
  'live',
  10,
  true,
  true
)
on conflict (slug) do nothing;

-- One transaction creates the pending order and its draft invitation. Only
-- the API service role may call this; browsers retain no INSERT policy.
create or replace function public.create_pending_checkout(
  p_order_id uuid,
  p_user_id uuid,
  p_template_id uuid,
  p_tier text,
  p_kind text,
  p_amount_egp numeric,
  p_provider text,
  p_idempotency_key text,
  p_coupon_code text,
  p_discount_total numeric,
  p_points_redeemed integer,
  p_invitation_slug text,
  p_invitation_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_idempotency_key, 0));
    select * into v_order
    from public.orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('order_id', v_order.id, 'amount_egp', v_order.amount_egp, 'existing', true);
    end if;
  end if;

  insert into public.orders (
    id, user_id, template_id, tier, kind, amount_egp, provider,
    idempotency_key, status, coupon_code, discount_total, points_redeemed
  ) values (
    p_order_id, p_user_id, p_template_id, p_tier, p_kind, p_amount_egp, p_provider,
    p_idempotency_key, 'pending', p_coupon_code, p_discount_total, p_points_redeemed
  ) returning * into v_order;

  if p_kind = 'new' then
    insert into public.invitations (owner_id, template_id, order_id, slug, data, status)
    values (p_user_id, p_template_id, v_order.id, p_invitation_slug, p_invitation_data, 'draft');
  end if;

  return jsonb_build_object('order_id', v_order.id, 'amount_egp', v_order.amount_egp, 'existing', false);
end;
$$;

revoke all on function public.create_pending_checkout(uuid, uuid, uuid, text, text, numeric, text, text, text, numeric, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_pending_checkout(uuid, uuid, uuid, text, text, numeric, text, text, text, numeric, integer, text, jsonb)
  to service_role;
