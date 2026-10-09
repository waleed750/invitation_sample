#!/usr/bin/env bash
# Monthly restore drill: restore the LATEST backup into a THROWAWAY database,
# run sanity row-counts, drop it, print PASS/FAIL. The live DB is never touched.
# Run monthly (see OPERATIONS.md) and keep the output as your restore proof.
#
# Required env: same as restore.sh (POSTGRES_CONTAINER/USER/DB, BACKUP_DIR,
# AGE_IDENTITY_FILE). BACKUP_DIR defaults to the script's ../../.env.prod value.
set -euo pipefail

log() { echo "[drill $(date -u +%FT%TZ)] $*"; }

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${INFRA_ENV_FILE:-$SCRIPT_DIR/../.env.prod}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${POSTGRES_CONTAINER:?set POSTGRES_CONTAINER}"
: "${POSTGRES_USER:?set POSTGRES_USER}"
: "${POSTGRES_DB:?set POSTGRES_DB}"
: "${BACKUP_DIR:?set BACKUP_DIR}"
: "${AGE_IDENTITY_FILE:?set AGE_IDENTITY_FILE}"

# Newest backup by mtime (GNU find on the Ubuntu server; no `ls` parsing).
LATEST="$(find "$BACKUP_DIR" -maxdepth 1 -name 'app-*.dump.gz.age' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -n1 | cut -d' ' -f2-)"
[[ -n "$LATEST" ]] || { log "FAIL: no backups in $BACKUP_DIR"; exit 1; }
log "latest backup: $(basename "$LATEST") ($(du -h "$LATEST" | cut -f1))"

DRILL_DB="drill_$(date +%Y%m%d%H%M%S)"
export AGE_IDENTITY_FILE
if ! "$SCRIPT_DIR/restore.sh" "$LATEST" "$DRILL_DB"; then
  log "FAIL: restore.sh failed"
  exit 1
fi

PASS=1
query() { docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$DRILL_DB" -tAc "$1"; }
check_table() {
  local table="$1" n
  if ! n="$(query "SELECT count(*) FROM \"$table\";" 2>&1)"; then
    log "FAIL: table '$table' missing or unreadable: $n"
    PASS=0
  else
    log "table '$table': $n rows"
  fi
}
check_table profiles
check_table orders
check_table invitations

log "dropping throwaway database '$DRILL_DB'"
docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres \
  -c "DROP DATABASE \"$DRILL_DB\";"

if (( PASS == 1 )); then
  log "PASS: latest backup restores cleanly and core tables are readable"
else
  log "FAIL: backup restored but sanity queries failed — investigate before relying on it"
  exit 1
fi
