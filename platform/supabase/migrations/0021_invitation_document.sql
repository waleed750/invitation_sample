-- T10: the editor's document model. `invitations.data` now holds either the legacy
-- InvitationData (document_version 0) or a v1 document (document_version 1). Existing rows
-- are untouched (they default to 0) and the API upgrades them on the owner's first save, so the
-- migration is lossless and needs no data rewrite.
alter table public.invitations
  add column if not exists document_version smallint not null default 0;

alter table public.invitations
  drop constraint if exists invitations_document_version_check;
alter table public.invitations
  add constraint invitations_document_version_check check (document_version in (0, 1));

comment on column public.invitations.document_version is
  '0 = legacy InvitationData, 1 = editor document (packages/shared/src/document). Set by the API.';
