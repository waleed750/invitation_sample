#!/usr/bin/env bash
# Re-load the dev seed (idempotent). DEV ONLY.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
db="${DEV_DB_NAME:-invitations_dev}"
psql "${server_url%/*}/$db" -X -q -v ON_ERROR_STOP=1 -f "$root/scripts/seed-dev.sql"
echo "seed loaded into $db"
