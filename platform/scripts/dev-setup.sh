#!/usr/bin/env bash
# One-time (and safe to re-run) local setup: creates the dev database, sets the
# app_api password, applies every migration and loads the dev seed.
#
#   scripts/dev-setup.sh
#
# Environment (all optional):
#   DEV_DB_NAME        database name                (default invitations_dev)
#   DEV_ADMIN_URL      superuser URL to the *server* (default postgresql://postgres:postgres@127.0.0.1:5432/postgres)
#   DEV_APP_PASSWORD   password for the app_api role (default dev-app-api-password)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
db="${DEV_DB_NAME:-invitations_dev}"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
app_password="${DEV_APP_PASSWORD:-dev-app-api-password}"

case "$db" in
  *[!a-zA-Z0-9_]*|"") echo "DEV_DB_NAME may only contain letters, digits and underscores" >&2; exit 1 ;;
esac
case "$app_password" in
  *\'*) echo "DEV_APP_PASSWORD must not contain a single quote" >&2; exit 1 ;;
esac

command -v node >/dev/null || { echo "Node.js 22 is required" >&2; exit 1; }
command -v psql >/dev/null || { echo "psql (PostgreSQL client) is required" >&2; exit 1; }
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 22 ] || { echo "Node 22+ required (found $(node -v))" >&2; exit 1; }

if ! psql "$server_url" -X -qtAc 'select 1' >/dev/null 2>&1; then
  echo "Cannot reach PostgreSQL at the DEV_ADMIN_URL. Start it first:" >&2
  echo "  docker compose -f infra/docker-compose.dev.yml up -d   (or: sudo service postgresql start)" >&2
  exit 1
fi

if [ "$(psql "$server_url" -X -qtAc "select count(*) from pg_database where datname = '$db'")" = "0" ]; then
  echo "creating database $db"
  psql "$server_url" -X -q -v ON_ERROR_STOP=1 -c "create database $db"
fi

# Swap only the database name in the URL (everything before the last "/").
admin_url="${server_url%/*}/$db"
export DATABASE_URL_ADMIN="$admin_url"

"$root/scripts/db-apply.sh"

# app_api exists after migration 0000; give it a password for local use.
psql "$admin_url" -X -q -v ON_ERROR_STOP=1 -c "alter role app_api with password '$app_password'"

echo "loading seed"
psql "$admin_url" -X -q -v ON_ERROR_STOP=1 -f "$root/scripts/seed-dev.sql"

rest="${server_url#*@}"
hostport="${rest%/*}"

cat <<MSG

Ready. Database: $db
  API DATABASE_URL: ${server_url%%://*}://app_api:$app_password@${hostport}/$db
Next:  npm run dev:full      (then sign in as admin@example.test, see README)
MSG
