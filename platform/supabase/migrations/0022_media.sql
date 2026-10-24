-- T12: customer media uploads. The 0001 table is extended in place; `r2_key` keeps meaning
-- "storage key" (local disk or S3-compatible, whichever adapter is configured).
alter table public.media
  add column if not exists invitation_id uuid references public.invitations (id) on delete set null,
  add column if not exists original_name text,
  add column if not exists content_type  text,
  add column if not exists width         integer check (width is null or width > 0),
  add column if not exists height        integer check (height is null or height > 0),
  add column if not exists variants      jsonb not null default '[]'::jsonb,
  add column if not exists reason        text;

alter table public.media drop constraint if exists media_status_check;
alter table public.media add constraint media_status_check
  check (status in ('processing', 'ready', 'rejected'));

alter table public.media drop constraint if exists media_kind_check;
alter table public.media add constraint media_kind_check
  check (kind is null or kind in ('image', 'video', 'audio', 'music', 'other'));

create index if not exists idx_media_owner_created on public.media (owner_id, created_at desc);
create index if not exists idx_media_invitation on public.media (invitation_id);

-- Owners read their own rows (policy from 0003). Writes (insert, status, delete) are server-side only:
-- the API validates the file, quotas and ownership, then writes as service_role.
drop policy if exists "media_insert_own" on public.media;
revoke insert, update, delete on table public.media from authenticated, anon;
grant select on table public.media to authenticated;
