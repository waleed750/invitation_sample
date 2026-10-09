#!/usr/bin/env bash
# Apply supabase/migrations/*.sql in filename order against $DATABASE_URL_ADMIN
# (owner / superuser connection). Applied files are recorded in
# public.schema_migrations so re-runs skip them.
set -euo pipefail

: "${DATABASE_URL_ADMIN:?DATABASE_URL_ADMIN must be set (owner/superuser connection string)}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dir="${MIGRATIONS_DIR:-$root/supabase/migrations}"

psql_run() {
  psql "$DATABASE_URL_ADMIN" -X -v ON_ERROR_STOP=1 -q "$@"
}

# Created BEFORE 0000 installs default privileges, then locked down, so the
# API roles never see it.
psql_run <<'SQL'
create table if not exists public.schema_migrations (
  filename   text primary key,
  applied_at timestamptz not null default now()
);
revoke all on table public.schema_migrations from public;
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table public.schema_migrations from %I', r);
    end if;
  end loop;
end;
$$;
SQL

applied=0
skipped=0
while IFS= read -r file; do
  name="$(basename "$file")"
  done_flag="$(psql_run -tA -v "fname=$name" <<'SQL'
select count(*) from public.schema_migrations where filename = :'fname';
SQL
)"
  if [ "$done_flag" != "0" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  echo "applying $name"
  # One transaction per file: the file and its bookkeeping row commit together.
  {
    echo "begin;"
    cat "$file"
    echo
    # Migration filenames are repo-controlled; reject anything with a quote.
    case "$name" in *\'*) echo "bad migration filename: $name" >&2; exit 1 ;; esac
    echo "insert into public.schema_migrations (filename) values ('$name');"
    echo "commit;"
  } | psql_run
  applied=$((applied + 1))
done < <(find "$dir" -maxdepth 1 -type f -name '*.sql' | LC_ALL=C sort)

echo "migrations: $applied applied, $skipped already applied"
