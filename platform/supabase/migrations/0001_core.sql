-- 0001_core.sql — core tables, enums, indexes, updated_at triggers.
-- Applies on Supabase (Postgres 15). Assumes the `auth` schema with
-- `auth.users(id uuid)` exists (managed by Supabase Auth) and the
-- `anon` / `authenticated` / `service_role` roles exist (Supabase defaults).
-- Run order: 0001_core.sql -> 0002_functions.sql -> 0003_rls.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  phone           text unique,                       -- E.164, e.g. +2010...
  email           text unique,
  name            text,
  preferred_locale text not null default 'ar' check (preferred_locale in ('ar', 'en')),
  role            text not null default 'customer' check (role in ('customer', 'admin')),
  level           text not null default 'member' check (level in ('member', 'silver', 'gold')),
  purchases_count integer not null default 0 check (purchases_count >= 0),
  points_balance  integer not null default 0,        -- cached; may go negative after refunds
  signup_method   text,                              -- whatsapp | email | google | password | manual | link
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- templates + template_assets
-- ---------------------------------------------------------------------------

create table public.templates (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name_ar          text not null,
  name_en          text not null,
  tier             text not null default 'classic'
                   check (tier in ('save_the_date', 'classic', 'premium')),
  category         text,
  event_type       text,
  theme_spec       jsonb not null default '{}'::jsonb,
  sample_data_ar   jsonb not null default '{}'::jsonb,
  sample_data_en   jsonb not null default '{}'::jsonb,
  status           text not null default 'draft' check (status in ('draft', 'live', 'retired')),
  preview_media    jsonb not null default '{}'::jsonb,
  sort_order       integer not null default 0,
  featured         boolean not null default false,
  license_complete boolean not null default false,   -- license gate: publish only when true
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_templates_updated_at
  before update on public.templates
  for each row execute function public.handle_updated_at();

create index idx_templates_status_sort on public.templates (status, sort_order);
create index idx_templates_tier on public.templates (tier);

create table public.template_assets (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  r2_key      text not null,
  kind        text,                                   -- video | image | music | font | other
  size_bytes  bigint check (size_bytes is null or size_bytes >= 0),
  source      text,                                   -- where the asset came from (license gate)
  license     text,                                   -- license name / terms (license gate)
  license_url text,
  created_at  timestamptz not null default now()
);

create index idx_template_assets_template on public.template_assets (template_id);

-- ---------------------------------------------------------------------------
-- affiliates + clicks + payouts
-- ---------------------------------------------------------------------------

create table public.affiliates (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  phone                 text,
  ref_code              text not null unique check (ref_code = lower(ref_code)),
  commission_pct        numeric(5, 2) not null default 0 check (commission_pct >= 0),
  customer_discount_pct numeric(5, 2) not null default 0 check (customer_discount_pct >= 0),
  payout_method         text,
  payout_details        jsonb not null default '{}'::jsonb,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger trg_affiliates_updated_at
  before update on public.affiliates
  for each row execute function public.handle_updated_at();

create table public.affiliate_clicks (
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  day          date not null,
  landing_path text not null default '/',
  count        integer not null default 0 check (count >= 0),
  primary key (affiliate_id, day, landing_path)
);

create table public.affiliate_payouts (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete restrict,
  amount_egp   numeric(12, 2) not null check (amount_egp >= 0),
  method       text,
  reference    text,
  period_start date,
  period_end   date,
  paid_at      timestamptz not null default now(),
  created_by   uuid references public.profiles (id) on delete set null
);

create index idx_affiliate_payouts_affiliate on public.affiliate_payouts (affiliate_id, paid_at desc);

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------

create table public.coupons (
  code           text primary key check (code = lower(code)),
  percent_off    numeric(5, 2) check (percent_off is null or (percent_off >= 0 and percent_off <= 100)),
  amount_off_egp numeric(12, 2) check (amount_off_egp is null or amount_off_egp >= 0),
  max_uses       integer check (max_uses is null or max_uses > 0),
  used_count     integer not null default 0 check (used_count >= 0),
  expires_at     timestamptz,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles (id) on delete set null,
  template_id     uuid references public.templates (id) on delete set null,
  tier            text not null default 'classic'
                  check (tier in ('save_the_date', 'classic', 'premium')),
  kind            text not null default 'new' check (kind in ('new', 'extension', 'edits', 'addon')),
  amount_egp      numeric(12, 2) not null check (amount_egp >= 0),
  currency        text not null default 'EGP',
  provider        text not null check (provider in ('fawry', 'kashier', 'manual')),
  provider_ref    text,
  idempotency_key text unique,
  status          text not null default 'pending'
                  check (status in ('pending', 'paid', 'refunded', 'failed')),
  affiliate_id    uuid references public.affiliates (id) on delete set null,
  attribution     text check (attribution is null or attribution in ('link', 'code')),
  coupon_code     text references public.coupons (code) on delete set null,
  discount_total  numeric(12, 2) not null default 0 check (discount_total >= 0),
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  points_earned   integer not null default 0 check (points_earned >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  paid_at         timestamptz,
  refunded_at     timestamptz
);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create index idx_orders_user on public.orders (user_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_provider_ref on public.orders (provider_ref);
create index idx_orders_affiliate_created on public.orders (affiliate_id, created_at desc);

-- ---------------------------------------------------------------------------
-- invitations + entitlements + publishes + access links + views
-- ---------------------------------------------------------------------------

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references public.profiles (id) on delete set null,
  template_id  uuid references public.templates (id) on delete set null,
  order_id     uuid references public.orders (id) on delete set null,
  slug         text not null unique
               check (char_length(slug) between 3 and 60
                      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  data         jsonb not null default '{}'::jsonb,   -- Zod-validated InvitationData
  locale       text not null default 'ar' check (locale in ('ar', 'en')),
  status       text not null default 'draft'
               check (status in ('draft', 'published', 'ended', 'archived')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_invitations_updated_at
  before update on public.invitations
  for each row execute function public.handle_updated_at();

create index idx_invitations_owner on public.invitations (owner_id);
create index idx_invitations_status on public.invitations (status);
create index idx_invitations_slug on public.invitations (slug);

create table public.invitation_entitlements (
  invitation_id          uuid primary key references public.invitations (id) on delete cascade,
  order_id               uuid references public.orders (id) on delete set null,
  tier                   text not null default 'classic'
                         check (tier in ('save_the_date', 'classic', 'premium')),
  edits_allowed          integer not null default 0 check (edits_allowed >= 0),
  edits_used             integer not null default 0 check (edits_used >= 0),
  template_switches_left integer check (template_switches_left is null or template_switches_left >= 0), -- null = unlimited
  online_until           timestamptz,
  min_online_until       timestamptz,                 -- event_date + grace; never ends before this
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger trg_entitlements_updated_at
  before update on public.invitation_entitlements
  for each row execute function public.handle_updated_at();

create index idx_entitlements_online_until on public.invitation_entitlements (online_until);

create table public.invitation_publishes (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  published_by  uuid references public.profiles (id) on delete set null,
  published_at  timestamptz not null default now(),
  snapshot      jsonb not null default '{}'::jsonb    -- data snapshot for undo/history
);

create index idx_publishes_invitation on public.invitation_publishes (invitation_id, published_at desc);

-- Private edit links: the raw token is NEVER stored, only its SHA-256 hash.
create table public.invitation_access_links (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  token_hash    text not null unique,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  last_used_at  timestamptz
);

create index idx_access_links_invitation on public.invitation_access_links (invitation_id);

create table public.invitation_views (
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  day           date not null,
  count         integer not null default 0 check (count >= 0),
  primary key (invitation_id, day)
);

-- ---------------------------------------------------------------------------
-- rsvps + messages (guests never sign in; server-only inserts)
-- ---------------------------------------------------------------------------

create table public.rsvps (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name          text not null,
  phone         text not null,
  guests_count  integer not null default 1 check (guests_count between 1 and 20),
  attending     boolean not null default true,
  note          text,
  ip_hash       text,
  created_at    timestamptz not null default now(),
  unique (invitation_id, phone)                           -- 1 RSVP per phone per invitation (upsert)
);

create index idx_rsvps_invitation on public.rsvps (invitation_id);

create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name          text not null,
  body          text not null,
  approved      boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_messages_invitation on public.messages (invitation_id);

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------

create table public.media (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references public.profiles (id) on delete set null,
  r2_key     text not null,
  kind       text,                                       -- image | video | music | other
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status     text not null default 'processing' check (status in ('processing', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_media_updated_at
  before update on public.media
  for each row execute function public.handle_updated_at();

create index idx_media_owner on public.media (owner_id);

-- ---------------------------------------------------------------------------
-- points ledger (append-only; balance is derived, cached on profiles)
-- ---------------------------------------------------------------------------

create table public.points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  order_id   uuid references public.orders (id) on delete set null,
  delta      integer not null,                            -- signed; negative for redeem/refund
  reason     text not null check (reason in ('purchase', 'bonus', 'redeem', 'refund', 'admin', 'expire')),
  expires_at timestamptz,                                 -- null = never expires
  created_at timestamptz not null default now()
);

create index idx_points_ledger_user on public.points_ledger (user_id, created_at desc);
create index idx_points_ledger_order on public.points_ledger (order_id);

-- ---------------------------------------------------------------------------
-- audit log + anonymous drafts
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index idx_audit_log_actor on public.audit_log (actor_id, created_at desc);

-- Pre-checkout drafts: cookie-held, claimed at checkout, auto-expire in 7 days.
create table public.anonymous_drafts (
  id          uuid primary key default gen_random_uuid(),
  cookie_id   text not null unique,
  template_id uuid references public.templates (id) on delete set null,
  data        jsonb not null default '{}'::jsonb,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

create index idx_anonymous_drafts_expires on public.anonymous_drafts (expires_at);
