# API security notes

Wiring: `applySecurity()` (trust proxy, helmet, CORS, `x-powered-by` off) and the
body-parser limits are applied by `setupApp()`, so production and e2e tests run
the same code. Specs: `security.e2e.spec.ts`.

## Real client IP (`TRUST_PROXY`)

Rate limits key on `clientIp(req)` via `ClientIpThrottlerGuard`. Without a trust
setting every request would look like it came from the reverse proxy.

| `TRUST_PROXY` | Meaning |
| --- | --- |
| empty / `false` | Trust nothing; use the socket address. Use only when the API is exposed directly. `X-Forwarded-For` is ignored. |
| `1` (hop count) | Caddy on the same host is the only hop. |
| `loopback`, `10.0.0.0/8`, ... | Comma list of `loopback`/`linklocal`/`uniquelocal`/IPs/CIDRs. |
| `cloudflare` | Cloudflare -> Caddy -> API. Trusts private hops plus Cloudflare edge ranges and reads `CF-Connecting-IP`, but only when the TCP peer is itself a trusted hop. Firewall the origin to Cloudflare/localhost, or the header is forgeable by anyone who can reach it. |
| `true` | Rejected at boot (any client could spoof `X-Forwarded-For`). |

The Cloudflare CIDR list lives in `client-ip.ts` and should be refreshed from
https://www.cloudflare.com/ips/ now and then.

## Headers, body, CORS

- helmet: `default-src 'none'; frame-ancestors 'none'`, HSTS 2y + includeSubDomains, `nosniff`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-site`, `X-Frame-Options: DENY`. `/docs` (only when `SWAGGER_ENABLED=true`) drops the CSP because Swagger UI needs inline scripts.
- JSON and urlencoded bodies are capped by `BODY_LIMIT_KB` (default 100). Oversize returns `413 payload_too_large`, malformed JSON `400`, both in the standard error envelope.
- CORS: only `WEB_ORIGINS`; the origin is reflected (with credentials) solely for listed origins.
- 429: `{error:{code:'too_many_requests',message,requestId}}` plus `Retry-After`.

## Rate-limit policy

Global default: `THROTTLE_LIMIT` (100) per `THROTTLE_TTL_MS` (60s) per client IP,
applied before auth (so unauthenticated floods are shed too). Counters are per
route handler. Overrides:

| Route | Limit | Why |
| --- | --- | --- |
| `GET /v1/health` | none (`@SkipThrottle`) | Orchestrator probe |
| `GET /v1/health/ping` | 5/min | Example of a tight limit |
| `GET /v1/public/invitations/:slug` | 60/min | Public, cacheable read |
| `POST /v1/public/invitations/:slug/rsvp` | 5/min | Public write, abuse magnet |
| `POST /v1/public/invitations/:slug/messages` | 3 / 10 min | Public guest-book spam |
| `GET /v1/slugs/:slug/availability` | 30/min | Enumeration guard |
| `GET /v1/templates` | 60/min | Public catalogue |
| `POST /v1/checkout` | 10/min | Order creation |
| `POST /v1/payments/:provider/webhook` | 20/min | Provider callbacks (HMAC verified) |
| `PATCH /v1/invitations/:id` | 60/min | Autosave |
| `PATCH /v1/invitations/:id/slug`, `POST .../publish`, `.../undo-publish`, `.../switch-template` | 20/min | Expensive mutations (revalidation) |
| Everything else (me, orders, points, guests, entitlements, admin/*, dev/payments) | global default (100/min) | Authenticated |

## Scaling note (storage port)

Counters live in `InMemoryRateLimitStorage` behind the `RATE_LIMIT_STORAGE`
token (`rate-limit-storage.ts`). That is correct for ONE API process only: with
N instances the effective limit is N times higher and a restart resets counters.
Before running more than one instance, implement `ThrottlerStorage` on a shared
store (Redis via `@nest-lab/throttler-storage-redis`, or a Postgres table) and
swap the provider in `RateLimitStorageModule`. No guard or controller changes
are needed. Redis is intentionally not a dependency today.

## Lint guards

API ESLint forbids `eval`, `new Function`, implied eval, and building variables
named `sql`/`query` by template interpolation or `+`/`+=` concatenation
(`no-restricted-syntax`). It is a name-based heuristic, not a taint analysis.
