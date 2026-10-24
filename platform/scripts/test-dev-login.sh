#!/usr/bin/env bash
# End-to-end check of the local stack: boots the built API against a throwaway
# seeded database, signs in as the seeded admin with the code printed to the API
# console, and confirms the admin can see the seeded pending payment.
# Needs: a superuser URL (DEV_ADMIN_URL) and a built API (npm run build:api).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server_url="${DEV_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
export DEV_DB_NAME="invitations_login_test"
port=3101
base="http://127.0.0.1:$port"
log="$(mktemp)"; jar="$(mktemp)"
api_pid=""

cleanup() {
  [ -n "$api_pid" ] && kill "$api_pid" 2>/dev/null || true
  psql "$server_url" -X -q -c "drop database if exists $DEV_DB_NAME with (force)" >/dev/null 2>&1 || true
  rm -f "$log" "$jar"
}
trap cleanup EXIT

[ -f "$root/apps/api/dist/main.js" ] || { echo "build the API first: npm run build:api" >&2; exit 1; }
psql "$server_url" -X -q -c "drop database if exists $DEV_DB_NAME with (force)" >/dev/null
"$root/scripts/dev-setup.sh" >/dev/null

(
  cd "$root/apps/api"
  set -a; . ./.env.development.example; set +a
  export PORT="$port" BETTER_AUTH_URL="$base"
  export DATABASE_URL="${server_url%%://*}://app_api:dev-app-api-password@${server_url#*@}"
  export DATABASE_URL="${DATABASE_URL%/*}/$DEV_DB_NAME"
  exec node dist/main.js
) >"$log" 2>&1 &
api_pid=$!

for _ in $(seq 1 30); do curl -sf "$base/v1/health" >/dev/null && break; sleep 1; done
curl -sf "$base/v1/health" >/dev/null || { echo "FAIL: API did not start"; tail -20 "$log"; exit 1; }

hdr=(-H 'content-type: application/json' -H 'origin: http://localhost:3000')
curl -sf -X POST "$base/v1/auth/email-otp/send-verification-otp" "${hdr[@]}" \
  -d '{"email":"admin@example.test","type":"sign-in"}' >/dev/null
code="$(grep -a 'DEV ONLY' "$log" | tail -1 | sed 's/.*: //')"
[ -n "$code" ] || { echo "FAIL: no sign-in code printed to the API console"; exit 1; }

curl -sf -c "$jar" -X POST "$base/v1/auth/sign-in/email-otp" "${hdr[@]}" \
  -d "{\"email\":\"admin@example.test\",\"otp\":\"$code\"}" >/dev/null

role="$(curl -sf -b "$jar" "$base/v1/me" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).role')"
[ "$role" = "admin" ] || { echo "FAIL: expected role admin, got '$role'"; exit 1; }

pending="$(curl -sf -b "$jar" "$base/v1/admin/payments/pending" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).length')"
[ "$pending" = "1" ] || { echo "FAIL: expected 1 pending payment, got $pending"; exit 1; }

echo "ok: admin signed in with the printed code and sees the seeded pending payment"
