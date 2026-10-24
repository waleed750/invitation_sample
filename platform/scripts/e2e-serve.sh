#!/usr/bin/env bash
# Starts one server for the Playwright e2e run (used by e2e/playwright.config.ts).
#   scripts/e2e-serve.sh api   built API with test email capture on
#   scripts/e2e-serve.sh web   `next start` when a build exists (CI), else `next dev`
# Expects a seeded database: scripts/dev-setup.sh (DEV_DB_NAME defaults to invitations_dev).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
db="${DEV_DB_NAME:-invitations_dev}"
app_password="${DEV_APP_PASSWORD:-dev-app-api-password}"

case "${1:-}" in
  api)
    cd "$root/apps/api"
    [ -f dist/main.js ] || { echo "build the API first: npm run build:api" >&2; exit 1; }
    set -a; . ./.env.development.example; set +a
    export E2E_CAPTURE_EMAILS=1 THROTTLE_LIMIT=2000
    export DATABASE_URL="${server_url%%://*}://app_api:${app_password}@${server_url#*@}"
    export DATABASE_URL="${DATABASE_URL%/*}/$db"
    exec node dist/main.js
    ;;
  web)
    cd "$root/apps/web"
    set -a; . ./.env.development.example; set +a
    if [ -d .next ] && [ -f .next/BUILD_ID ]; then exec npx next start -p 3000; fi
    exec npx next dev -p 3000
    ;;
  *) echo "usage: e2e-serve.sh api|web" >&2; exit 2 ;;
esac
