-- T10: document_version column is lossless for existing rows and constrained.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email)
values ('d1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't10-owner@example.test');

insert into public.invitations (id, owner_id, slug, data)
values ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 't10-legacy-row',
        '{"couple":{"first":"A","second":"B"}}'::jsonb);

do $$
declare
  v_version smallint;
  v_data jsonb;
begin
  -- a row written before/without the column is legacy and keeps its data byte for byte
  select document_version, data into v_version, v_data
  from public.invitations where id = 'd2000000-0000-4000-8000-000000000001';
  assert v_version = 0, 'rows default to the legacy version';
  assert v_data = '{"couple":{"first":"A","second":"B"}}'::jsonb, 'legacy data is untouched';

  -- the owner (through RLS) can save a v1 document
  perform set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  set local role authenticated;
  update public.invitations
     set data = '{"schemaVersion":1}'::jsonb, document_version = 1
   where id = 'd2000000-0000-4000-8000-000000000001';
  assert found, 'owner can update data and document_version';
  reset role;
  perform set_config('request.jwt.claims', '', true);

  select document_version into v_version from public.invitations where id = 'd2000000-0000-4000-8000-000000000001';
  assert v_version = 1, 'version 1 stored';

  -- unknown versions are rejected
  begin
    update public.invitations set document_version = 2 where id = 'd2000000-0000-4000-8000-000000000001';
    assert false, 'version 2 must be rejected';
  exception when check_violation then
    null;
  end;
end $$;

rollback;
