#!/usr/bin/env bash
# Run every supabase/tests/*.sql (each is its own rolled-back transaction)
# against $DATABASE_URL_ADMIN. Apply migrations first (scripts/db-apply.sh).
set -euo pipefail

: "${DATABASE_URL_ADMIN:?DATABASE_URL_ADMIN must be set (owner/superuser connection string)}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dir="${TESTS_DIR:-$root/supabase/tests}"

count=0
while IFS= read -r file; do
  echo "== $(basename "$file")"
  psql "$DATABASE_URL_ADMIN" -X -v ON_ERROR_STOP=1 -f "$file"
  count=$((count + 1))
done < <(find "$dir" -maxdepth 1 -type f -name '*.sql' | LC_ALL=C sort)

if [ "$count" -eq 0 ]; then
  echo "no SQL tests found in $dir" >&2
  exit 1
fi
echo "sql tests: $count file(s) passed"
