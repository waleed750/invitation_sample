#!/usr/bin/env bash
# Ubuntu 24.04 server hardening for the single-VPS deployment. IDEMPOTENT and
# safe to re-run: every step checks current state first and prints what it does.
#
# Run as root on a FRESH server, BEFORE deploying anything:
#   NEW_USER=owner SSH_PUBKEY="$(cat ~/.ssh/id_ed25519.pub)" ./harden.sh
#
# Env knobs (all optional except the key source on first run):
#   NEW_USER         sudo user to create/use                    (default: deploy)
#   SSH_PUBKEY       public key string installed for NEW_USER
#   SSH_PUBKEY_FILE  path to a public key file (alternative to SSH_PUBKEY)
#   SSH_PORT         sshd port; 22 = keep default                (default: 22)
#   ADMIN_IP         if set, SSH is allowed ONLY from this IP/CIDR
#   CLOUDFLARE_ONLY  1 = allow 80/443 ONLY from Cloudflare ranges (default: 0)
#                    set to 1 AFTER Cloudflare proxy + Full (strict) SSL work.
#
# LOCKOUT SAFETY:
# - Password auth / root login are disabled ONLY if NEW_USER already has a
#   non-empty authorized_keys (existing or installed by this run). Otherwise
#   the script aborts that step with an error instead of locking you out.
# - When SSH_PORT != 22, BOTH ports stay open in the firewall; close 22 only
#   after you have logged in on the new port (command printed at the end).
set -euo pipefail

say()  { echo "[harden] $*"; }
warn() { echo "[harden] WARNING: $*" >&2; }
die()  { echo "[harden] ERROR: $*" >&2; exit 1; }

NEW_USER="${NEW_USER:-deploy}"
SSH_PORT="${SSH_PORT:-22}"
ADMIN_IP="${ADMIN_IP:-}"
CLOUDFLARE_ONLY="${CLOUDFLARE_ONLY:-0}"

[[ "$(id -u)" == "0" ]] || die "run as root (sudo ./harden.sh)"
[[ "$NEW_USER" != "root" ]] || die "NEW_USER must not be root"

# Fallback Cloudflare ranges (fetched live 2026-10-09; harden.sh re-fetches
# and uses these only if the download fails).
CF_V4_FALLBACK="173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22"
CF_V6_FALLBACK="2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32"

say "== 1/8 packages (ufw, fail2ban, unattended-upgrades) =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ufw fail2ban unattended-upgrades curl ca-certificates python3
say "packages present"

say "== 2/8 sudo user '$NEW_USER' =="
if id "$NEW_USER" >/dev/null 2>&1; then
  say "user exists, skipping creation"
else
  adduser --disabled-password --gecos "" "$NEW_USER"
  say "created user $NEW_USER (no password)"
fi
usermod -aG sudo "$NEW_USER"
say "ensured $NEW_USER is in sudo group"
HOME_DIR="$(eval echo "~$NEW_USER")"
install -d -m 700 -o "$NEW_USER" -g "$NEW_USER" "$HOME_DIR/.ssh"
if [[ -n "${SSH_PUBKEY:-}" ]]; then
  echo "$SSH_PUBKEY" > "$HOME_DIR/.ssh/authorized_keys"
  say "installed key from \$SSH_PUBKEY"
elif [[ -n "${SSH_PUBKEY_FILE:-}" ]]; then
  [[ -f "$SSH_PUBKEY_FILE" ]] || die "SSH_PUBKEY_FILE not found: $SSH_PUBKEY_FILE"
  cp "$SSH_PUBKEY_FILE" "$HOME_DIR/.ssh/authorized_keys"
  say "installed key from $SSH_PUBKEY_FILE"
else
  say "no key provided; keeping existing authorized_keys (if any)"
fi
chown "$NEW_USER:$NEW_USER" "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null || true
chmod 600 "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null || true
HAS_KEY=0
[[ -s "$HOME_DIR/.ssh/authorized_keys" ]] && HAS_KEY=1
say "authorized_keys for $NEW_USER: $([[ $HAS_KEY == 1 ]] && echo 'present' || echo 'MISSING')"

say "== 3/8 sshd (key-only, no root, port $SSH_PORT) =="
if [[ "$HAS_KEY" != "1" ]]; then
  die "no authorized_keys for $NEW_USER — refusing to disable password auth (you would be locked out). Re-run with SSH_PUBKEY=... or SSH_PUBKEY_FILE=..."
fi
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/60-harden.conf <<EOF
# Written by platform/infra/server/harden.sh (idempotent — re-run to re-apply).
Port $SSH_PORT
PermitRootLogin no
PasswordAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
EOF
say "wrote /etc/ssh/sshd_config.d/60-harden.conf"
sshd -t || die "sshd config test failed — not restarting"
systemctl restart ssh
say "sshd restarted on port $SSH_PORT (key-only, root login disabled)"
warn "keep THIS session open; verify a NEW login works before disconnecting"

say "== 4/8 firewall (ufw) =="
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
say "defaults: deny incoming, allow outgoing"
if [[ -n "$ADMIN_IP" ]]; then
  ufw allow from "$ADMIN_IP" to any port "$SSH_PORT" proto tcp >/dev/null
  say "SSH port $SSH_PORT allowed ONLY from $ADMIN_IP"
else
  ufw allow "$SSH_PORT"/tcp >/dev/null
  warn "SSH port $SSH_PORT allowed from EVERYWHERE — set ADMIN_IP= to restrict"
fi
if [[ "$SSH_PORT" != "22" ]]; then
  ufw allow 22/tcp >/dev/null
  say "port 22 ALSO left open until you confirm the new port (see end)"
fi
if [[ "$CLOUDFLARE_ONLY" == "1" ]]; then
  CF_V4="$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v4 2>/dev/null || echo "$CF_V4_FALLBACK")"
  CF_V6="$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v6 2>/dev/null || echo "$CF_V6_FALLBACK")"
  # shellcheck disable=SC2086
  for net in $CF_V4 $CF_V6; do
    ufw allow from "$net" to any port 80,443 proto tcp >/dev/null
  done
  say "80/443 allowed ONLY from Cloudflare ranges (CLOUDFLARE_ONLY=1)"
  warn "direct-to-origin traffic is now dropped — confirm the site loads via Cloudflare"
else
  ufw allow 80,443/tcp >/dev/null
  say "80/443 allowed from everywhere (set CLOUDFLARE_ONLY=1 after Cloudflare is on)"
fi
ufw --force enable >/dev/null
say "ufw enabled:"
ufw status numbered | sed 's/^/[harden]   /'

say "== 5/8 fail2ban (sshd) =="
mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
# Written by platform/infra/server/harden.sh.
[sshd]
enabled = true
maxretry = 5
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban >/dev/null
say "fail2ban active: $(fail2ban-client ping 2>/dev/null || echo STARTING)"
fail2ban-client status sshd 2>/dev/null | sed 's/^/[harden]   /' || true

say "== 6/8 unattended security upgrades =="
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
// Written by platform/infra/server/harden.sh.
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true
say "unattended-upgrades enabled (security updates applied automatically)"

say "== 7/8 swap (2 GB if none) =="
if swapon --show=NAME --noheadings | grep -q .; then
  say "swap already present, skipping: $(swapon --show=NAME --noheadings | tr '\n' ' ')"
else
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10 >/dev/null
  grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
  say "created + enabled 2 GB /swapfile (swappiness=10: emergency use, not routine)"
fi

say "== 8/8 docker log rotation + time sync =="
mkdir -p /etc/docker
if python3 -c "import json; json.load(open('/etc/docker/daemon.json'))" 2>/dev/null; then
  cp /etc/docker/daemon.json "/etc/docker/daemon.json.bak-$(date +%Y%m%d%H%M%S)"
  say "backed up existing daemon.json"
  HAS_DAEMON=1
else
  HAS_DAEMON=0
fi
python3 - "$HAS_DAEMON" <<'EOF'
import json, sys
path = '/etc/docker/daemon.json'
cfg = {}
if sys.argv[1] == '1':
    cfg = json.load(open(path))
log_opts = cfg.setdefault('log-opts', {})
changed = (log_opts.get('max-size') != '10m' or log_opts.get('max-file') != '3')
log_opts['max-size'] = '10m'
log_opts['max-file'] = '3'
if 'log-driver' not in cfg:
    cfg['log-driver'] = 'json-file'
json.dump(cfg, open(path, 'w'), indent=2)
print('CHANGED' if changed else 'UNCHANGED')
EOF
if command -v docker >/dev/null && systemctl is-active --quiet docker; then
  systemctl restart docker
  say "docker restarted to apply log rotation (10 MB x 3 files per container)"
else
  say "docker not running — rotation will apply when docker starts"
fi
timedatectl set-timezone Africa/Cairo
systemctl enable --now systemd-timesyncd >/dev/null 2>&1 || true
say "timezone: $(timedatectl show -p Timezone --value); clock synced via systemd-timesyncd"

say "DONE. Follow-ups:"
echo "  1. Open a SECOND terminal and test: ssh -p $SSH_PORT $NEW_USER@<server-ip>"
if [[ "$SSH_PORT" != "22" ]]; then
  echo "  2. Only then close port 22: ufw delete allow 22/tcp"
fi
echo "  3. When Cloudflare proxy + Full (strict) SSL are verified: CLOUDFLARE_ONLY=1 ./harden.sh"
echo "  4. Enable 2FA on Coolify, Cloudflare and GitHub (cannot be scripted)."
