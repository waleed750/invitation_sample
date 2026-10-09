#!/usr/bin/env bash
# Restore ONE backup into a NEW database. The live DB is NEVER touched unless
# you pass --force explicitly.
#
# Usage:
#   AGE_IDENTITY_FILE=~/.age-key.txt restore.sh <backup> [target-db] [--force]
#   <backup> is a local app-*.dump.gz.age file, or (with rclone configured) a
#   remote path like "$RCLONE_REMOTE/app-20260101-023000.dump.gz.age".
#   Default target: <live-db>_restored_<timestamp>. With --force, target may be
#   the live DB itself (connections are terminated, DB dropped + recreated).
set -euo pipefail

log() { echo "[restore $(date -u +%FT%TZ)] $*"; }
die() { log "ERROR: $*"; exit 1; }

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
: "${AGE_IDENTITY_FILE:?set AGE_IDENTITY_FILE to the age private-key file}"
[[ -f "$AGE_IDENTITY_FILE" ]] || die "identity file not found: $AGE_IDENTITY_FILE"

SRC="${1:?usage: restore.sh <backup-file|remote-path> [target-db] [--force]}"
TARGET="${2:-${POSTGRES_DB}_restored_$(date +%Y%m%d%H%M%S)}"
FORCE=0
[[ "${2:-}" == "--force" || "${3:-}" == "--force" ]] && FORCE=1
if [[ "$TARGET" == "--force" ]]; then
  TARGET="${POSTGRES_DB}_restored_$(date +%Y%m%d%H%M%S)"; FORCE=1
fi

if [[ "$TARGET" == "$POSTGRES_DB" && "$FORCE" != "1" ]]; then
  die "refusing to overwrite live database '$POSTGRES_DB' without --force"
fi

command -v docker >/dev/null || die "docker not found"
command -v age >/dev/null || die "age not found"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [[ -f "$SRC" ]]; then
  ENC="$SRC"
elif [[ "$SRC" == *:* ]]; then
  command -v rclone >/dev/null || die "rclone not found (needed for remote path)"
  ENC="$WORK/$(basename "$SRC")"
  log "downloading $SRC"
  rclone copyto "$SRC" "$ENC"
else
  die "backup not found: $SRC"
fi

log "decrypting $(basename "$ENC")"
age -d -i "$AGE_IDENTITY_FILE" -o "$WORK/restore.dump.gz" "$ENC"
gunzip -f "$WORK/restore.dump.gz"

psql_in() { docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 "$@"; }

if [[ "$TARGET" == "$POSTGRES_DB" ]]; then
  log "FORCE: terminating connections and recreating live database '$TARGET'"
  psql_in -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$TARGET' AND pid <> pg_backend_pid();"
  psql_in -c "DROP DATABASE IF EXISTS \"$TARGET\";"
  psql_in -c "CREATE DATABASE \"$TARGET\";"
else
  if psql_in -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET';" | grep -q 1; then
    die "target database '$TARGET' already exists — pick another name"
  fi
  log "creating target database '$TARGET'"
  psql_in -c "CREATE DATABASE \"$TARGET\";"
fi

log "restoring into '$TARGET' (pg_restore, custom format)"
docker exec -i "$POSTGRES_CONTAINER" pg_restore -U "$POSTGRES_USER" -d "$TARGET" --no-owner < "$WORK/restore.dump"
log "restore OK: database '$TARGET' ready"
