#!/usr/bin/env bash
# Start the API (3001) and the web app (3000) together for local development.
# Run scripts/dev-setup.sh once first (database + seed).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

for app in api web; do
  env_file="apps/$app/.env.development"
  if [ ! -f "$env_file" ]; then
    cp "apps/$app/.env.development.example" "$env_file"
    echo "created $env_file from the example"
  fi
done


echo "building shared package"
npm run build --workspace @platform/shared >/dev/null

pids=()
cleanup() { trap - INT TERM EXIT; kill "${pids[@]}" 2>/dev/null || true; wait 2>/dev/null || true; }
trap cleanup INT TERM EXIT

(
  set -a; . apps/api/.env.development; set +a
  exec npm run dev --workspace @platform/api
) &
pids+=($!)

(
  set -a; . apps/web/.env.development; set +a
  exec npm run dev --workspace @platform/web
) &
pids+=($!)

echo "API http://localhost:3001  |  web http://localhost:3000/ar"
echo "Sign-in codes are printed in this console as: [DEV ONLY] sign-in code for <email>: <code>"
wait -n
