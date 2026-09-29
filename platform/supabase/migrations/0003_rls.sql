-- 0003_rls.sql — Row Level Security on EVERY table.
--
-- Model (§8.4, §16.8):
--   * Public (anon + authenticated): invitations only where status='published',
--     templates only where status='live' (+ their assets).
--   * Owners: read/write their own drafts via invitations (but status flips,
--     published_at, order_id and slug-after-publish go ONLY through the
--     publish_invitation() RPC — enforced by trigger below, not just by
--     policy); read their entitlements, orders, points, RSVPs, messages,
--     media, publish history, view stats.
--   * Guests (RSVP / messages / view + click counters): NO anon insert
--     policies at all. All guest writes go through rate-limited Next.js
--     routes using the service role (Turnstile + Upstash enforced there).
--   * invitation_access_links, audit_log, affiliate_payouts: admin/service only.
--   * Admins (is_admin()): select everything; writes only on catalog/
--     marketing tables (templates, template_assets, affiliates, coupons)
--     plus affiliate_payouts. Everything else admin-side goes through the
--     service role in server code and is recorded in audit_log.

-- ---------------------------------------------------------------------------
-- 1. Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.profiles                 enable row level security;
alter table public.templates                enable row level security;
alter table public.template_assets          enable row level security;
alter table public.affiliates               enable row level security;
alter table public.affiliate_clicks         enable row level security;
alter table public.affiliate_payouts        enable row level security;
alter table public.coupons                  enable row level security;
alter table public.orders                   enable row level security;
alter table public.invitations              enable row level security;
alter table public.invitation_entitlements  enable row level security;
alter table public.invitation_publishes     enable row level security;
alter table public.invitation_access_links  enable row level security;
alter table public.invitation_views         enable row level security;
alter table public.rsvps                    enable row level security;
alter table public.messages                 enable row level security;
alter table public.media                     enable row level security;
alter table public.points_ledger            enable row level security;
alter table public.audit_log                enable row level security;
alter table public.anonymous_drafts         enable row level security;

-- The balance view must respect the caller's RLS on points_ledger
-- (owner sees own balance, admins see all, anon sees nothing).
alter view public.points_balance_v set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 2. Column-guard triggers (server-enforced, bypass-proof)
--
-- RLS policies below grant owners UPDATE on their invitations / profiles;
-- these triggers narrow that to the safe columns. Bypass conditions:
--   * current_user <> session_user: the write runs inside a SECURITY DEFINER
--     RPC (e.g. publish_invitation(), fulfill_paid_order()) whose owner is
--     `postgres`. Direct client writes always have current_user =
--     session_user, so this cannot be forged from SQL.
--   * auth.uid() IS NULL: the service role / server with no JWT.
-- Direct owner writes with a JWT fall through to the column checks below.
-- ---------------------------------------------------------------------------

create or replace function public.invitations_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Inside a SECURITY DEFINER RPC (owner `postgres`) or service-role
  -- server code: unrestricted. publish_invitation() flips status through
  -- this path; direct owner writes never take it.
  if current_user <> session_user then
    return new;
  end if;
  if auth.uid() is null then
    return new;
  end if;

  -- Publishes, expiry moves and order links go ONLY through RPCs / server.
  if new.status is distinct from old.status then
    raise exception 'invitations: status changes are allowed only via publish_invitation()';
  end if;
  if new.published_at is distinct from old.published_at then
    raise exception 'invitations: published_at is managed by the server';
  end if;
  if new.order_id is distinct from old.order_id then
    raise exception 'invitations: order_id is managed by the server';
  end if;
  -- A public slug is a stable share link: frozen once published.
  if old.status = 'published' and new.slug is distinct from old.slug then
    raise exception 'invitations: slug cannot change after publishing';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_invitations_guard on public.invitations;
create trigger trg_invitations_guard
  before update on public.invitations
  for each row execute function public.invitations_guard();

create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Same bypass as invitations_guard: SECURITY DEFINER RPCs and the
  -- service role (fulfillment, refunds, admin tools) are unrestricted.
  if current_user <> session_user then
    return new;
  end if;
  if auth.uid() is null then
    return new;
  end if;

  -- Users may edit name/phone/email/locale — never their own privilege,
  -- loyalty or money fields.
  if new.role is distinct from old.role then
    raise exception 'profiles: role is managed by the server';
  end if;
  if new.level is distinct from old.level then
    raise exception 'profiles: level is managed by the server';
  end if;
  if new.purchases_count is distinct from old.purchases_count then
    raise exception 'profiles: purchases_count is managed by the server';
  end if;
  if new.points_balance is distinct from old.points_balance then
    raise exception 'profiles: points_balance is managed by the server';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- 3. Policies
-- ---------------------------------------------------------------------------

-- ---- profiles ---------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- NOTE: no INSERT policy — rows are created server-side on signup
-- (service role). No DELETE policy.

-- ---- templates (public catalog) ----------------------------------------------
create policy "templates_select_live"
  on public.templates for select to anon, authenticated
  using (status = 'live');

create policy "templates_admin_select"
  on public.templates for select to authenticated
  using (public.is_admin());

create policy "templates_admin_insert"
  on public.templates for insert to authenticated
  with check (public.is_admin());

create policy "templates_admin_update"
  on public.templates for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "templates_admin_delete"
  on public.templates for delete to authenticated
  using (public.is_admin());

-- ---- template_assets -----------------------------------------------------------
create policy "template_assets_select_live"
  on public.template_assets for select to anon, authenticated
  using (exists (
    select 1 from public.templates t
    where t.id = template_assets.template_id
      and t.status = 'live'
  ));

create policy "template_assets_admin_all"
  on public.template_assets for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- invitations -----------------------------------------------------------------
create policy "invitations_select_published"
  on public.invitations for select to anon, authenticated
  using (status = 'published');

create policy "invitations_select_own"
  on public.invitations for select to authenticated
  using (owner_id = auth.uid());

create policy "invitations_insert_own"
  on public.invitations for insert to authenticated
  with check (owner_id = auth.uid());

create policy "invitations_update_own"
  on public.invitations for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
-- NOTE: invitations_guard() narrows this to non-privileged columns.

create policy "invitations_select_admin"
  on public.invitations for select to authenticated
  using (public.is_admin());
-- NOTE: no DELETE policy for owners (archive instead); no admin write
-- policy — admin edits go through the service role + audit_log.

-- ---- invitation_entitlements (read-only for owners) --------------------------------
create policy "entitlements_select_own"
  on public.invitation_entitlements for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_entitlements.invitation_id
      and i.owner_id = auth.uid()
  ));

create policy "entitlements_select_admin"
  on public.invitation_entitlements for select to authenticated
  using (public.is_admin());
-- NOTE: no insert/update/delete policies — service role only
-- (fulfill_paid_order, admin tools).

-- ---- invitation_publishes (history; written by the RPC) ------------------------------
create policy "publishes_select_own"
  on public.invitation_publishes for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_publishes.invitation_id
      and i.owner_id = auth.uid()
  ));

create policy "publishes_select_admin"
  on public.invitation_publishes for select to authenticated
  using (public.is_admin());

-- ---- invitation_access_links (admin/service only) --------------------------------------
-- Link holders authenticate with the raw token to a server route, which
-- compares hashes with the service role. No client-side access at all.
create policy "access_links_admin_select"
  on public.invitation_access_links for select to authenticated
  using (public.is_admin());

-- ---- invitation_views (owner stats; increments are server-only) --------------------------
create policy "views_select_own"
  on public.invitation_views for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_views.invitation_id
      and i.owner_id = auth.uid()
  ));

create policy "views_select_admin"
  on public.invitation_views for select to authenticated
  using (public.is_admin());
-- NOTE: deliberately NO anon insert policy — counters are incremented by
-- server routes with the service role (avoids fake-view inflation).

-- ---- rsvps (owner + admin read; server-only writes) ---------------------------------------
create policy "rsvps_select_own"
  on public.rsvps for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = rsvps.invitation_id
      and i.owner_id = auth.uid()
  ));

create policy "rsvps_select_admin"
  on public.rsvps for select to authenticated
  using (public.is_admin());
-- NOTE: deliberately NO anon/authenticated insert policy — RSVPs are
-- written only by the rate-limited, Turnstile-protected API route
-- (service role), which also enforces the 1-per-phone upsert.

-- ---- messages (owner moderation queue; server-only writes) ----------------------------------
create policy "messages_select_own"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = messages.invitation_id
      and i.owner_id = auth.uid()
  ));

create policy "messages_select_admin"
  on public.messages for select to authenticated
  using (public.is_admin());
-- NOTE: deliberately NO anon insert policy — same server-route rule as RSVPs.

-- ---- media -----------------------------------------------------------------------
create policy "media_select_own"
  on public.media for select to authenticated
  using (owner_id = auth.uid());

create policy "media_insert_own"
  on public.media for insert to authenticated
  with check (owner_id = auth.uid());

create policy "media_select_admin"
  on public.media for select to authenticated
  using (public.is_admin());

-- ---- orders ------------------------------------------------------------------------
create policy "orders_select_own"
  on public.orders for select to authenticated
  using (user_id = auth.uid());

create policy "orders_select_admin"
  on public.orders for select to authenticated
  using (public.is_admin());
-- NOTE: no client insert/update — checkout + webhooks are server-side.

-- ---- points_ledger (read-only for owners) ----------------------------------------------------
create policy "points_select_own"
  on public.points_ledger for select to authenticated
  using (user_id = auth.uid());

create policy "points_select_admin"
  on public.points_ledger for select to authenticated
  using (public.is_admin());

-- ---- affiliates (admin only; attribution is server-side) ---------------------------------------
create policy "affiliates_admin_all"
  on public.affiliates for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- affiliate_clicks (admin stats; increments are server-only) ----------------------------------
create policy "clicks_select_admin"
  on public.affiliate_clicks for select to authenticated
  using (public.is_admin());
-- NOTE: deliberately NO anon insert policy — counted by server routes.

-- ---- affiliate_payouts (admin/service only) ------------------------------------------------------
create policy "payouts_admin_all"
  on public.affiliate_payouts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- coupons (admin only; checkout validates server-side) ------------------------------------------
-- Public coupon checks would leak every active code, so there is no public
-- select policy: the checkout route validates with the service role.
create policy "coupons_admin_all"
  on public.coupons for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- audit_log (admin read only) -------------------------------------------------------------------
create policy "audit_log_admin_select"
  on public.audit_log for select to authenticated
  using (public.is_admin());
-- NOTE: writes are service-role only from admin server actions.

-- ---- anonymous_drafts (service only) -----------------------------------------------------------------
-- Drafts are keyed by an HttpOnly cookie and touched only by server routes
-- (create/update/claim/purge). No client policies at all.

-- ---------------------------------------------------------------------------
-- 4. Revoke default privileges from anon on sensitive tables, then grant
-- back exactly the public reads the policies allow (RLS still filters the
-- rows: anon sees only published invitations / live templates + assets).
-- Without the GRANTs below, even policy-allowed reads would fail with
-- "permission denied", since Supabase requires both grant AND policy.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles                 from anon;
revoke all on table public.orders                   from anon;
revoke all on table public.invitations              from anon;
revoke all on table public.invitation_entitlements  from anon;
revoke all on table public.invitation_publishes     from anon;
revoke all on table public.invitation_access_links  from anon;
revoke all on table public.invitation_views         from anon;
revoke all on table public.rsvps                    from anon;
revoke all on table public.messages                 from anon;
revoke all on table public.media                     from anon;
revoke all on table public.points_ledger            from anon;
revoke all on table public.affiliates               from anon;
revoke all on table public.affiliate_clicks         from anon;
revoke all on table public.affiliate_payouts        from anon;
revoke all on table public.coupons                  from anon;
revoke all on table public.audit_log                from anon;
revoke all on table public.anonymous_drafts         from anon;

-- Public reads the policies above explicitly allow. Everything not listed
-- here stays denied for anon (no grant + no policy = no access).
grant select on table public.templates       to anon;  -- status = 'live' only (policy)
grant select on table public.template_assets to anon;  -- of live templates only (policy)
grant select on table public.invitations     to anon;  -- status = 'published' only (policy)
