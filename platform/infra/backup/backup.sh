#!/usr/bin/env bash
# Nightly encrypted Postgres backup: pg_dump (custom format) -> gzip -> age
# encrypt -> rclone upload to S3-compatible storage -> retention prune ->
# Uptime Kuma push ping (success ONLY; failures exit non-zero with NO ping).
#
# Required env (or platform/infra/.env.prod, auto-sourced — see below):
#   POSTGRES_CONTAINER  container name, e.g. invitation-platform-prod-postgres-1
#   POSTGRES_USER / POSTGRES_DB
#   BACKUP_DIR            local retention dir, e.g. /var/backups/invitation-platform
#   AGE_PUBLIC_KEY        age recipient, e.g. age1abc... (age-keygen -o key.txt)
#   RCLONE_REMOTE         e.g. b2:bucket/invitation-backups (see `rclone config`)
#   KUMA_PUSH_URL         Uptime Kuma push-monitor URL (may be empty to skip)
# Optional: INFRA_ENV_FILE to override the .env.prod path.
set -euo pipefail

log() { echo "[backup $(date -u +%FT%TZ)] $*"; }

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${INFRA_ENV_FILE:-$SCRIPT_DIR/../.env.prod}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  log "sourced $ENV_FILE"
fi

: "${POSTGRES_CONTAINER:?set POSTGRES_CONTAINER}"
: "${POSTGRES_USER:?set POSTGRES_USER}"
: "${POSTGRES_DB:?set POSTGRES_DB}"
: "${BACKUP_DIR:?set BACKUP_DIR}"
: "${AGE_PUBLIC_KEY:?set AGE_PUBLIC_KEY}"
: "${RCLONE_REMOTE:?set RCLONE_REMOTE}"
KUMA_PUSH_URL="${KUMA_PUSH_URL:-}"

command -v docker >/dev/null || { log "ERROR: docker not found"; exit 1; }
command -v age >/dev/null || { log "ERROR: age not found (apt install age)"; exit 1; }
command -v rclone >/dev/null || { log "ERROR: rclone not found"; exit 1; }

mkdir -p "$BACKUP_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/app-$TS.dump.gz.age"

log "dumping database '$POSTGRES_DB' from container '$POSTGRES_CONTAINER'"
# Unix-socket connection inside the container needs no password (local trust
# in the official postgres image); nothing secret appears in `docker inspect`.
docker exec "$POSTGRES_CONTAINER" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  | gzip -9 \
  | age -r "$AGE_PUBLIC_KEY" -o "$OUT"
log "wrote $(du -h "$OUT" | cut -f1) to $OUT"

# --- Retention: 7 daily / 4 weekly (Sunday) / 3 monthly (1st), by filename date.
# Classification: a backup dated the 1st is a monthly keeper; dated a Sunday
# is a weekly keeper; anything < 7 days old is kept regardless.
prune_dir() {
  local dir="$1" delete_cmd="$2" now
  now="$(date +%s)"
  local f base dstr fdate age_days dow dom keep
  shopt -s nullglob
  local candidates=("$dir"/app-*.dump.gz.age)
  [[ ${#candidates[@]} -eq 0 ]] && return 0
  while IFS= read -r f; do
    base="$(basename "$f")"
    dstr="${base#app-}"; dstr="${dstr:0:8}" # YYYYMMDD
    fdate="$(date -d "${dstr:0:4}-${dstr:4:2}-${dstr:6:2}" +%s)"
    age_days=$(( (now - fdate) / 86400 ))
    dow="$(date -d "@$fdate" +%u)" # 7 = Sunday
    dom="${dstr:6:2}"
    keep=0
    if (( age_days < 7 )); then keep=1
    elif [[ "$dom" == "01" ]] && (( age_days < 93 )); then keep=1   # ~3 monthly
    elif [[ "$dow" == "7" ]] && (( age_days < 28 )); then keep=1    # 4 weekly
    fi
    if (( keep == 0 )); then
      log "retention: removing old backup $base"
      # shellcheck disable=SC2086
      $delete_cmd "$f"
    fi
  done < <(printf '%s\n' "${candidates[@]}" | sort)
  shopt -u nullglob
}
prune_dir "$BACKUP_DIR" "rm -f"

# --- Upload: mirror the pruned local dir so remote retention matches local.
# Guard: never sync an (almost) empty dir — that would wipe remote history
# after a misconfiguration.
shopt -s nullglob
present=("$BACKUP_DIR"/app-*.dump.gz.age)
shopt -u nullglob
count=${#present[@]}
if (( count < 1 )); then
  log "ERROR: no local backups found — refusing to sync (remote history kept)"
  exit 1
fi
log "uploading to $RCLONE_REMOTE ($count local backups, sync mirrors retention)"
rclone sync "$BACKUP_DIR/" "$RCLONE_REMOTE/" --include 'app-*.dump.gz.age'

if [[ -n "$KUMA_PUSH_URL" ]]; then
  log "pinging Uptime Kuma push monitor"
  curl -fsS --retry 3 --max-time 20 "$KUMA_PUSH_URL" >/dev/null
else
  log "KUMA_PUSH_URL empty — skipping push ping"
fi
log "backup OK: $(basename "$OUT")"
