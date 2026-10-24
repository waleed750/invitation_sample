-- T21: upgrades target an existing invitation; account export is own-data only; deletion anonymises and blocks sign-in.
begin;
select set_config('request.jwt.claims', '', true);

insert into auth.users (id, aud, role, email) values
  ('e1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 't21-a@example.test'),
  ('e1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 't21-b@example.test'),
  ('e1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 't21-admin@example.test');
update public.profiles set role = 'admin' where id = 'e1000000-0000-4000-8000-000000000003';
update public.profiles set name = 'Sara', phone = '+201000000001' where id = 'e1000000-0000-4000-8000-000000000001';

insert into public.templates (id, slug, name_ar, name_en, name, tagline, tier, status, license_complete)
values ('e3000000-0000-4000-8000-000000000001', 't21-template', 'قالب', 'Template', '{"ar":"قالب","en":"Template"}'::jsonb, '{"ar":"","en":""}'::jsonb, 'classic', 'live', true);

do $$
declare
  A constant uuid := 'e1000000-0000-4000-8000-000000000001';
  B constant uuid := 'e1000000-0000-4000-8000-000000000002';
  ADMIN constant uuid := 'e1000000-0000-4000-8000-000000000003';
  T constant uuid := 'e3000000-0000-4000-8000-000000000001';
  O_NEW constant uuid := 'e2000000-0000-4000-8000-000000000001';
  O_EXT constant uuid := 'e2000000-0000-4000-8000-000000000002';
  O_EDT constant uuid := 'e2000000-0000-4000-8000-000000000003';
  O_BAD constant uuid := 'e2000000-0000-4000-8000-000000000004';
  r jsonb;
  v_inv uuid;
  v_before timestamptz;
  v_after timestamptz;
  v_edits_before integer;
  v_edits_after integer;
  v_export jsonb;
  v_n integer;
begin
  -- ---- a normal order creates the invitation and its entitlement
  r := public.create_pending_checkout(O_NEW, A, T, 'classic', 'new', 129900, 'EGP', 'manual', null, null, 0, 0, 't21-a-slug', '{"couple":{"first":"A","second":"B"},"eventDate":"2030-06-15"}'::jsonb, null);
  assert r ? 'order_id', 'new order created: ' || r::text;
  r := public.fulfill_paid_order(O_NEW);
  assert (r->>'ok')::boolean, 'fulfilled: ' || r::text;
  select id into v_inv from public.invitations where owner_id = A;
  assert v_inv is not null, 'invitation exists';

  -- ---- an upgrade needs a target the buyer owns
  r := public.create_pending_checkout(O_BAD, A, T, 'classic', 'extension', 50000, 'EGP', 'manual', null, null, 0, 0, 'x', '{}'::jsonb, null);
  assert r->>'reason' = 'target_not_found', 'an extension without a target is refused: ' || r::text;
  r := public.create_pending_checkout(O_BAD, B, T, 'classic', 'extension', 50000, 'EGP', 'manual', null, null, 0, 0, 'x', '{}'::jsonb, v_inv);
  assert r->>'reason' = 'target_not_found', 'someone else''s invitation cannot be upgraded: ' || r::text;
  r := public.create_pending_checkout(O_BAD, A, T, 'classic', 'new', 50000, 'EGP', 'manual', null, null, 0, 0, 'x', '{}'::jsonb, v_inv);
  assert r->>'reason' = 'target_not_allowed', 'a new order has no target: ' || r::text;
  assert not exists (select 1 from public.orders where id = O_BAD), 'refused orders leave no row';

  -- ---- extension pushes the window out on the same invitation
  select online_until, edits_allowed into v_before, v_edits_before from public.invitation_entitlements where invitation_id = v_inv;
  r := public.create_pending_checkout(O_EXT, A, T, 'premium', 'extension', 50000, 'EGP', 'manual', null, null, 0, 0, 'x', '{}'::jsonb, v_inv);
  assert (r->>'existing')::boolean is false, 'extension order created: ' || r::text;
  r := public.fulfill_paid_order(O_EXT);
  assert (r->>'ok')::boolean and (r->>'invitation_id')::uuid = v_inv, 'extension applied to the target: ' || r::text;
  assert (select tier from public.orders where id = O_EXT) = 'classic', 'the order takes the invitation''s plan, not the client''s';
  select online_until into v_after from public.invitation_entitlements where invitation_id = v_inv;
  assert v_after > v_before, 'online period was extended';
  select count(*) into v_n from public.invitations where owner_id = A;
  assert v_n = 1, 'an upgrade never creates another invitation';

  -- ---- edits pack adds 10 edits
  r := public.create_pending_checkout(O_EDT, A, T, 'classic', 'edits', 30000, 'EGP', 'manual', null, null, 0, 0, 'x', '{}'::jsonb, v_inv);
  r := public.fulfill_paid_order(O_EDT);
  select edits_allowed into v_edits_after from public.invitation_entitlements where invitation_id = v_inv;
  assert v_edits_after = v_edits_before + 10, 'edits pack adds 10: ' || v_edits_before || ' -> ' || v_edits_after;

  -- ---- export: own data only
  insert into public.rsvps (invitation_id, name, phone, attending, guests_count) values (v_inv, 'Guest Name', '+201111111111', true, 1);
  v_export := public.export_account_data(A);
  assert v_export->'profile'->>'email' is not null or v_export->'profile'->>'name' = 'Sara', 'profile included';
  assert jsonb_array_length(v_export->'orders') = 3, 'own orders included';
  assert jsonb_array_length(v_export->'invitations') = 1, 'own invitation included';
  assert position('Guest Name' in v_export::text) = 0, 'guest RSVP names are never exported';
  assert position('+201111111111' in v_export::text) = 0, 'guest phones are never exported';
  assert position('t21-b@example.test' in v_export::text) = 0, 'another account''s data is absent';
  v_export := public.export_account_data(B);
  assert jsonb_array_length(v_export->'orders') = 0 and jsonb_array_length(v_export->'invitations') = 0, 'B sees nothing of A';

  -- ---- deletion
  r := public.anonymize_account(ADMIN);
  assert r->>'reason' = 'admin_account', 'an admin account is not self-deletable: ' || r::text;
  r := public.anonymize_account(A);
  assert (r->>'ok')::boolean, 'anonymised: ' || r::text;
  assert (select name is null and phone is null and email is null from public.profiles where id = A), 'profile emptied';
  assert not exists (select 1 from public.invitations where owner_id = A), 'invitations removed';
  assert not exists (select 1 from public.rsvps where invitation_id = v_inv), 'guest data removed with the invitation';
  select count(*) into v_n from public.orders where user_id = A and status = 'paid';
  assert v_n = 3, 'paid orders are kept: ' || v_n;
  assert (select email from auth.users where id = A) like 'deleted-%@deleted.invalid', 'login email released';
  assert not exists (select 1 from better_auth.session where "userId" = A), 'sessions removed';
  assert exists (select 1 from public.audit_log where target_id = A::text and action = 'account_deleted'), 'deletion is audited';
  r := public.anonymize_account('e1000000-0000-4000-8000-0000000000ff');
  assert r->>'reason' = 'not_found', 'unknown user';
end $$;

rollback;
