#!/usr/bin/env bash
# Drop and recreate the dev database, then set it up again. DEV ONLY.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
db="${DEV_DB_NAME:-invitations_dev}"
case "$db" in
  invitations_dev*|*_dev|*_test) ;;
  *) echo "refusing to drop '$db': only databases ending in _dev/_test (or named invitations_dev*) can be reset" >&2; exit 1 ;;
esac
case "$db" in *[!a-zA-Z0-9_]*) echo "bad database name" >&2; exit 1 ;; esac
psql "$server_url" -X -q -v ON_ERROR_STOP=1 -c "drop database if exists $db with (force)"
exec "$root/scripts/dev-setup.sh"
