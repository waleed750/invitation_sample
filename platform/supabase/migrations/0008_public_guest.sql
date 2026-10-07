-- 0008_public_guest.sql — guest RSVP writes without a phone number.
--
-- NOT EXECUTED (no Postgres available locally). Review + apply via Supabase.
--
-- Why: 0001_core.sql declares `rsvps.phone text NOT NULL` and
-- `guests_count ... check (guests_count between 1 and 20)`, but the public
-- RSVP contract (B2) makes phone optional and allows `guests` 0–10
-- (0 = "attending, bringing no extra guests").
-- The API already enforces the rest (tier limits, honeypot, throttles,
-- phone normalisation, ip_hash) in code; RLS stays unchanged — guests still
-- have NO anon policies, all writes go through the service-role API route.
--
-- Postgres treats NULLs as distinct in a UNIQUE constraint, so phoneless
-- RSVPs simply bypass the (invitation_id, phone) upsert key and insert.

alter table public.rsvps alter column phone drop not null;

alter table public.rsvps drop constraint if exists rsvps_guests_count_check;

alter table public.rsvps
  add constraint rsvps_guests_count_check check (guests_count between 0 and 10);
