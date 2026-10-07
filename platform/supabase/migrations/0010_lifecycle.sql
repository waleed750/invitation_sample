-- 0010_lifecycle.sql — daily lifecycle job helpers (B4, PLATFORM_PLAN §16.3).
--
-- NOT EXECUTED (no Postgres available locally). Review + apply via Supabase.
--
-- Timeline implemented here (the NestJS `LifecycleService` calls these in order):
--   1. `lifecycle_due_reminders` lists published invitations whose
--      `online_until` falls 6–7 days after `p_now` and that were never
--      reminded; the service notifies, then `lifecycle_mark_reminded` stamps
--      `invitations.end_reminder_sent_at` (added below).
--   2. `lifecycle_end_expired` flips published invitations whose entitlement
--      `online_until` already passed to `ended`.
--   3. `lifecycle_purge_and_archive` nulls guest phones (privacy, §8.4) and
--      flips to `archived` for invitations ended more than 30 days ago.
--   4. `lifecycle_expire_points` refreshes the cached `profiles.points_balance`
--      for users who hold rows past `expires_at` (expiry itself is already
--      applied by the balance definition, see points_balance_v in 0002).
--
-- Every function is idempotent: running it twice changes nothing the second
-- time (status filters, `phone is not null`, `end_reminder_sent_at is null`,
-- and `is distinct from` on the cached balance exclude already-processed rows).
--
-- Status flips go through SECURITY DEFINER functions, which is exactly the
-- context `invitations_guard` (0003_rls.sql) lets through: direct owner
-- writes always have `current_user = session_user` with a JWT, while these
-- RPCs run as their owner (or are called with the service role and no JWT).
--
-- Privilege model: service_role ONLY. Revoked from public / anon /
-- authenticated, like `fulfill_paid_order` in 0002_functions.sql.

-- ---------------------------------------------------------------------------
-- 1. Reminder stamp (new column)
-- ---------------------------------------------------------------------------

alter table public.invitations
  add column if not exists end_reminder_sent_at timestamptz;


-- ---------------------------------------------------------------------------
-- lifecycle_end_expired(p_now): published -> ended once online_until passed.
-- Returns the number of invitations flipped (0 on a re-run).
-- ---------------------------------------------------------------------------

create or replace function public.lifecycle_end_expired(p_now timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.invitations i
  set status = 'ended'
  from public.invitation_entitlements e
  where e.invitation_id = i.id
    and i.status = 'published'
    and e.online_until is not null
    and e.online_until < p_now;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.lifecycle_end_expired(timestamptz) from public, anon, authenticated;
grant execute on function public.lifecycle_end_expired(timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- lifecycle_purge_and_archive(p_now): 30 days after ending, purge guest
-- phones (0008 made `rsvps.phone` nullable) and flip ended -> archived.
-- Returns {purged, archived} (both 0 on a re-run).
-- ---------------------------------------------------------------------------

create or replace function public.lifecycle_purge_and_archive(p_now timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purged   integer := 0;
  v_archived integer := 0;
begin
  update public.rsvps r
  set phone = null
  from public.invitations i
  join public.invitation_entitlements e on e.invitation_id = i.id
  where r.invitation_id = i.id
    and i.status = 'ended'
    and e.online_until is not null
    and e.online_until < p_now - interval '30 days'
    and r.phone is not null;
  get diagnostics v_purged = row_count;

  update public.invitations i
  set status = 'archived'
  from public.invitation_entitlements e
  where e.invitation_id = i.id
    and i.status = 'ended'
    and e.online_until is not null
    and e.online_until < p_now - interval '30 days';
  get diagnostics v_archived = row_count;

  return jsonb_build_object('purged', v_purged, 'archived', v_archived);
end;
$$;

revoke all on function public.lifecycle_purge_and_archive(timestamptz) from public, anon, authenticated;
grant execute on function public.lifecycle_purge_and_archive(timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- lifecycle_due_reminders(p_now): published invitations ending in 6–7 days
-- that were never reminded. The service notifies each row, then stamps it
-- via lifecycle_mark_reminded (mark-after-notify, never before).
-- ---------------------------------------------------------------------------

create or replace function public.lifecycle_due_reminders(p_now timestamptz)
returns table(invitation_id uuid, owner_id uuid, online_until timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select
    i.id as invitation_id,
    i.owner_id as owner_id,
    e.online_until as online_until
  from public.invitations i
  join public.invitation_entitlements e on e.invitation_id = i.id
  where i.status = 'published'
    and i.end_reminder_sent_at is null
    and i.owner_id is not null
    and e.online_until is not null
    and e.online_until >= p_now + interval '6 days'
    and e.online_until <= p_now + interval '7 days'
  order by e.online_until;
$$;

revoke all on function public.lifecycle_due_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.lifecycle_due_reminders(timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- lifecycle_mark_reminded(p_invitation_id, p_now): stamp the reminder.
-- The `is null` guard makes re-marking a no-op (notify-then-mark stays safe
-- under retries: a crash between notify and mark just re-sends once).
-- ---------------------------------------------------------------------------

create or replace function public.lifecycle_mark_reminded(p_invitation_id uuid, p_now timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  update public.invitations
  set end_reminder_sent_at = p_now
  where id = p_invitation_id
    and end_reminder_sent_at is null;
$$;

revoke all on function public.lifecycle_mark_reminded(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.lifecycle_mark_reminded(uuid, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- lifecycle_expire_points(p_now): keep the cached balance honest after expiry.
-- Returns the number of profiles whose cached balance changed (0 on a re-run).
--
-- EXPIRY RULE: the balance is defined as the sum of ledger deltas whose
-- `expires_at` is null or still in the future (points_balance_v, 0002). So an
-- earned row stops counting by itself once `expires_at` passes; no extra
-- `expire` row is written (writing one would subtract the same points twice
-- and eat points that have NOT expired). `profiles.points_balance` is only a
-- cache, recomputed at write time by fulfill_paid_order / refund_order, so it
-- goes stale when rows expire between writes. This function recomputes it,
-- against `p_now`, for every user who holds at least one expired row.
-- ---------------------------------------------------------------------------

create or replace function public.lifecycle_expire_points(p_now timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with affected as (
    select distinct e.user_id
    from public.points_ledger e
    where e.expires_at is not null
      and e.expires_at <= p_now
  ),
  balances as (
    select a.user_id,
           coalesce(sum(l.delta) filter (where l.expires_at is null or l.expires_at > p_now), 0)::integer as balance
    from affected a
    left join public.points_ledger l on l.user_id = a.user_id
    group by a.user_id
  )
  update public.profiles p
  set points_balance = b.balance
  from balances b
  where p.id = b.user_id
    and p.points_balance is distinct from b.balance;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.lifecycle_expire_points(timestamptz) from public, anon, authenticated;
grant execute on function public.lifecycle_expire_points(timestamptz) to service_role;
