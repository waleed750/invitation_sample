-- T12: media rows are readable by their owner only, and writable only by the server.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('e1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't12-a@example.test'),
  ('e1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 't12-b@example.test');

insert into public.media (id, owner_id, r2_key, kind, size_bytes, status) values
  ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'media/a/1/w480.webp', 'image', 1000, 'ready'),
  ('e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'media/b/1/w480.webp', 'image', 1000, 'ready');

do $$
declare
  v_count integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  select count(*) into v_count from public.media;
  assert v_count = 1, 'an owner sees only their own media, saw ' || v_count;

  begin
    insert into public.media (owner_id, r2_key, kind) values ('e1000000-0000-4000-8000-000000000001', 'x', 'image');
    assert false, 'authenticated must not insert media directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.media set status = 'ready';
    assert false, 'authenticated must not update media';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.media;
    assert false, 'authenticated must not delete media';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- statuses and kinds are constrained
  begin
    update public.media set status = 'weird' where id = 'e2000000-0000-4000-8000-000000000001';
    assert false, 'unknown status must be rejected';
  exception when check_violation then null;
  end;
  update public.media set status = 'rejected', reason = 'unsupported_type' where id = 'e2000000-0000-4000-8000-000000000001';
  assert found, 'the server can mark a row rejected';
end $$;

rollback;
