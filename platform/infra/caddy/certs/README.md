# Cloudflare Origin CA certificate directory (host side)

This directory is mounted **read-only** into Caddy at `/etc/caddy/certs`
(see `docker-compose.prod.yml`). It is only read when
`CADDY_TLS_MODE=cloudflare-origin` in `.env.prod`.

## What goes here (on the server only, never in git)

- `origin.pem` — the Cloudflare Origin Certificate (PEM, covers
  `example.com` + `*.example.com`)
- `origin-key.pem` — its private key (PEM)

```bash
# on the server, after downloading both files from the Cloudflare dashboard
cp ~/origin.pem ~/origin-key.pem /opt/invitation-platform/platform/infra/caddy/certs/
chmod 600 /opt/invitation-platform/platform/infra/caddy/certs/*.pem
```

`*.pem` / `*.key` are git-ignored — a `git status` must never show them.
Full steps: `platform/docs/OPERATIONS.md` (Cloudflare section) and the
first-deploy walkthrough in `platform/docs/DEPLOYMENT.md`.
