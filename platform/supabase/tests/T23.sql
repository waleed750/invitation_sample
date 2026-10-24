-- T23: private edit links. Hashed, one invitation, revocable, expiring, claimable.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('c4000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't23-admin@example.test'),
  ('c4000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 't23-owner@example.test'),
  ('c4000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 't23-customer@example.test');
update public.profiles set role = 'admin' where id = 'c4000000-0000-4000-8000-000000000001';

insert into public.invitations (id, owner_id, slug, data, status) values
  ('c5000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000002', 't23-one', '{}', 'draft'),
  ('c5000000-0000-4000-8000-000000000002', 'c4000000-0000-4000-8000-000000000002', 't23-two', '{}', 'draft');

do $$
declare
  ADMIN constant uuid := 'c4000000-0000-4000-8000-000000000001';
  OWNER constant uuid := 'c4000000-0000-4000-8000-000000000002';
  CUSTOMER constant uuid := 'c4000000-0000-4000-8000-000000000003';
  INV1 constant uuid := 'c5000000-0000-4000-8000-000000000001';
  INV2 constant uuid := 'c5000000-0000-4000-8000-000000000002';
  H1 constant text := repeat('a', 64);
  H2 constant text := repeat('b', 64);
  r jsonb; v_link uuid;
begin
  assert (public.admin_issue_edit_link(OWNER, INV1, H1, 'x')->>'reason') = 'not_admin', 'only an admin issues links';
  assert (public.admin_issue_edit_link(ADMIN, INV1, 'plaintext-token', 'x')->>'reason') = 'invalid_token', 'only a sha-256 hex digest is stored';
  assert (public.admin_issue_edit_link(ADMIN, 'c5000000-0000-4000-8000-0000000000ff', H1, 'x')->>'reason') = 'not_found', 'unknown invitation';
  r := public.admin_issue_edit_link(ADMIN, INV1, H1, 'for Sara');
  assert (r->>'ok')::boolean, 'issued: ' || r::text;
  v_link := (r->>'id')::uuid;
  assert (select token_hash from public.invitation_access_links where id = v_link) = H1, 'the hash is stored';
  assert exists (select 1 from public.audit_log where action = 'edit_link.issue' and target_id = INV1::text), 'issue is audited';
  assert position(H1 in (select details::text from public.audit_log where action = 'edit_link.issue' order by created_at desc limit 1)) = 0, 'the token hash never reaches the audit log';

  -- the link opens exactly the invitation it was issued for
  r := public.resolve_edit_link(H1);
  assert (r->>'found')::boolean and (r->>'invitation_id')::uuid = INV1 and (r->>'owner_id')::uuid = OWNER, 'resolves to its invitation: ' || r::text;
  assert (select last_used_at from public.invitation_access_links where id = v_link) is not null, 'use is recorded';
  assert (public.resolve_edit_link(H2)->>'found')::boolean is false, 'an unknown token resolves to nothing';
  assert (public.resolve_edit_link('')->>'found')::boolean is false, 'empty token';

  -- revoke is instant and idempotent
  assert (public.admin_revoke_edit_link(OWNER, v_link)->>'reason') = 'not_admin', 'only an admin revokes';
  assert (public.admin_revoke_edit_link(ADMIN, v_link)->>'ok')::boolean, 'revoked';
  assert (public.resolve_edit_link(H1)->>'found')::boolean is false, 'a revoked link stops working at once';
  assert (public.admin_revoke_edit_link(ADMIN, v_link)->>'already')::boolean, 'revoking twice is fine';
  assert (public.admin_revoke_edit_link(ADMIN, 'c6000000-0000-4000-8000-000000000000')->>'reason') = 'not_found', 'unknown link';

  -- expiry
  r := public.admin_issue_edit_link(ADMIN, INV2, H2, null);
  update public.invitation_access_links set expires_at = now() - interval '1 second' where token_hash = H2;
  assert (public.resolve_edit_link(H2)->>'found')::boolean is false, 'an expired link does not resolve';
  update public.invitation_access_links set expires_at = now() + interval '1 day' where token_hash = H2;
  assert (public.resolve_edit_link(H2)->>'found')::boolean, 'valid again with time left';

  -- claim: ownership moves, all links of the invitation stop
  assert (public.claim_invitation(CUSTOMER, repeat('c', 64))->>'reason') = 'invalid_link', 'a wrong token claims nothing';
  r := public.admin_issue_edit_link(ADMIN, INV2, repeat('d', 64), 'second link');
  r := public.claim_invitation(CUSTOMER, H2);
  assert (r->>'ok')::boolean and (r->>'invitation_id')::uuid = INV2, 'claimed: ' || r::text;
  assert (select owner_id from public.invitations where id = INV2) = CUSTOMER, 'the customer owns it now';
  assert (select owner_id from public.invitations where id = INV1) = OWNER, 'the other invitation is untouched';
  assert (public.resolve_edit_link(H2)->>'found')::boolean is false and (public.resolve_edit_link(repeat('d', 64))->>'found')::boolean is false, 'every link of the claimed invitation is dead';
  assert (select claimed_by from public.invitation_access_links where token_hash = H2) = CUSTOMER, 'who claimed it is recorded';
  assert (public.claim_invitation(CUSTOMER, H2)->>'reason') = 'invalid_link', 'a claim link works once';
  assert exists (select 1 from public.audit_log where action = 'invitation.claim' and actor_id = CUSTOMER), 'claim is audited';
end $$;

rollback;
