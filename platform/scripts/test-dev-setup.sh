#!/usr/bin/env bash
# Proves dev-setup.sh is idempotent: runs it twice against a throwaway database
# and compares the seeded row counts. Needs a reachable superuser URL.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
export DEV_DB_NAME="invitations_setup_test"
db_url="${server_url%/*}/$DEV_DB_NAME"

cleanup() { psql "$server_url" -X -q -c "drop database if exists $DEV_DB_NAME with (force)" >/dev/null; }
trap cleanup EXIT
cleanup

counts() {
  psql "$db_url" -X -qtAc "select (select count(*) from profiles), (select count(*) from profiles where role='admin'),
    (select count(*) from orders), (select count(*) from invitations where status='published'),
    (select count(*) from rsvps), (select count(*) from payment_events), (select count(*) from templates where status='live')"
}

"$root/scripts/dev-setup.sh" >/dev/null
first="$(counts)"
"$root/scripts/dev-setup.sh" >/dev/null
second="$(counts)"

[ "$first" = "$second" ] || { echo "FAIL: counts changed between runs: [$first] vs [$second]" >&2; exit 1; }
[ "$first" = "3|1|2|1|10|1|5" ] || { echo "FAIL: unexpected seed counts: [$first]" >&2; exit 1; }
echo "ok: dev-setup.sh is idempotent ($first)"
