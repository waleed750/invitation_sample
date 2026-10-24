#!/usr/bin/env bash
# T13 race tests against a throwaway database (needs a superuser URL in DEV_ADMIN_URL):
#   1. two parallel purchases when the balance covers only one -> exactly one succeeds, never negative
#   2. two parallel confirmations of the same top-up -> credited once
# Run after `npm ci`; no API needed.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
db="invitations_credit_race"
url="${server_url%/*}/$db"
cleanup() { psql "$server_url" -X -q -c "drop database if exists $db with (force)" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup
psql "$server_url" -X -q -c "create database $db" >/dev/null
DATABASE_URL_ADMIN="$url" "$root/scripts/db-apply.sh" >/dev/null 2>&1

q() { psql "$url" -X -qtA -v ON_ERROR_STOP=1 "$@"; }
ADMIN=f3000000-0000-4000-8000-000000000001

q <<SQL >/dev/null
insert into auth.users (id, aud, role, email) values ('$ADMIN', 'authenticated', 'authenticated', 'race-admin@example.test');
update public.profiles set role = 'admin' where id = '$ADMIN';
SQL

fail=0
for round in $(seq 1 15); do
  user="f4000000-0000-4000-8000-$(printf '%012d' "$round")"
  o1="f5000000-0000-4000-8000-$(printf '%012d' "$((round * 2))")"
  o2="f5000000-0000-4000-8000-$(printf '%012d' "$((round * 2 + 1))")"
  q <<SQL >/dev/null
insert into auth.users (id, aud, role, email) values ('$user', 'authenticated', 'authenticated', 'race-$round@example.test');
insert into public.orders (id, user_id, tier, kind, amount_minor, currency, provider, status) values
  ('$o1', '$user', 'classic', 'new', 100000, 'EGP', 'manual', 'pending'),
  ('$o2', '$user', 'classic', 'new', 100000, 'EGP', 'manual', 'pending');
insert into public.credit_ledger (user_id, kind, amount_minor, note, created_by) values ('$user', 'admin', 100000, 'race fixture', '$ADMIN');
SQL
  ( q -c "select public.purchase_with_credit('$user', '$o1')->>'ok'" > "/tmp/race-a-$round.out" 2>&1 ) &
  ( q -c "select public.purchase_with_credit('$user', '$o2')->>'ok'" > "/tmp/race-b-$round.out" 2>&1 ) &
  wait
  ok="$(cat /tmp/race-a-$round.out /tmp/race-b-$round.out | grep -c '^true$' || true)"
  paid="$(q -c "select count(*) from public.orders where user_id = '$user' and status = 'paid'")"
  balance="$(q -c "select credit_balance_minor from public.profiles where id = '$user'")"
  ledger="$(q -c "select coalesce(sum(amount_minor), 0) from public.credit_ledger where user_id = '$user'")"
  rm -f "/tmp/race-a-$round.out" "/tmp/race-b-$round.out"
  if [ "$ok" != "1" ] || [ "$paid" != "1" ] || [ "$balance" != "0" ] || [ "$ledger" != "0" ]; then
    echo "FAIL round $round: ok=$ok paid=$paid balance=$balance ledger=$ledger" >&2
    fail=1
  fi
done
[ "$fail" = "0" ] || exit 1
echo "ok: 15 rounds of two parallel purchases -> exactly one paid, balance never negative"

# Two parallel confirmations of the same top-up credit once.
user="f4000000-0000-4000-8000-000000000999"
q <<SQL >/dev/null
insert into auth.users (id, aud, role, email) values ('$user', 'authenticated', 'authenticated', 'race-topup@example.test');
SQL
topup="$(q -c "select public.create_topup('$user', 100000)->>'id'")"
expected="$(q -c "select amount_minor + extra_minor from public.credit_topups where id = '$topup'")"
( q -c "select public.confirm_topup('$ADMIN', '$topup', $expected, 'A', null, false)->>'ok'" > /tmp/race-t1.out 2>&1 ) &
( q -c "select public.confirm_topup('$ADMIN', '$topup', $expected, 'B', null, false)->>'ok'" > /tmp/race-t2.out 2>&1 ) &
wait
credits="$(q -c "select count(*) from public.credit_ledger where topup_id = '$topup' and kind = 'topup'")"
balance="$(q -c "select credit_balance_minor from public.profiles where id = '$user'")"
rm -f /tmp/race-t1.out /tmp/race-t2.out
[ "$credits" = "1" ] && [ "$balance" = "$expected" ] || { echo "FAIL: double confirm credits=$credits balance=$balance expected=$expected" >&2; exit 1; }
echo "ok: parallel confirmations of one top-up credit once"
