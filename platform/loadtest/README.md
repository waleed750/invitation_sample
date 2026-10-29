# Load tests (k6) — T43

Three k6 scripts that put the guest-facing paths under real pressure and record
p50/p95/p99, the error rate and the first bottleneck:

| Script | What it hammers | Default load |
|---|---|---|
| `rsvp-burst.js` | `POST /v1/public/invitations/:slug/rsvp` on **one** published invitation | ramps to 200 req/s, holds 30s |
| `public-reads.js` | `GET /v1/public/invitations/:slug` + the page `/{locale}/i/:slug` | 250 + 250 req/s for 60s |
| `checkout.js` | `POST /v1/checkout` as a signed-in customer (email-code login) | 20 orders/s for 60s, 20 users |

`lib/env.js` holds the base URLs and every shared helper, `lib/auth.js` the
email-code sign-in. There is **no package.json and no npm dependency**: k6 runs
these files with its own JavaScript engine. Nothing here runs in CI, and nothing
here is imported by the app.

Results go into [`../docs/LOAD_TEST_REPORT.md`](../docs/LOAD_TEST_REPORT.md) —
copy the empty tables and fill them in after a run.

> ⚠️ **Never point these scripts at production.** `checkout.js` creates orders and
> `rsvp-burst.js` writes RSVPs; both are meant for a disposable database.

---

## 1. Install k6

The binary is **not** part of this repo. Pick one:

```sh
# macOS
brew install k6

# Debian/Ubuntu
sudo gpg -k && \
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
    --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && \
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
    | sudo tee /etc/apt/sources.list.d/k6.list && \
  sudo apt-get update && sudo apt-get install k6

# no binary? use the Docker image (mount this folder)
docker run --rm -i -v "$PWD":/scripts -w /scripts grafana/k6 run rsvp-burst.js
# on Linux you may also add --network host; on macOS address the host as
# host.docker.internal instead of localhost, e.g.
#   -e API_URL=http://host.docker.internal:3001
#   -e WEB_URL=http://host.docker.internal:3000
```

Sanity check a script without generating load:

```sh
k6 inspect rsvp-burst.js
```

---

## 2. Start the stack

```sh
cd platform
npm ci
bash scripts/dev-setup.sh        # invitations_dev + every migration + the seed
npm run build -w @platform/shared
npm run build:api
```

The seed (`scripts/seed-dev.sql`) publishes the invitation used by default:
**`demo-nour-omar`** (classic tier, `mashrabiya`, 10 RSVPs) owned by
`customer1@example.test`. `demo-hoda-tarek` is published but **ended** (30 days
past) — never use it for a burst.

### 2a. API (port 3001)

`.env.example` is dev-ready; the three flags that matter for load tests are
`DATABASE_URL`, `TRUST_PROXY` and `E2E_CAPTURE_EMAILS`:

```sh
cd platform/apps/api
set -a; . ./.env.example; set +a
export DATABASE_URL="postgresql://app_api:dev-app-api-password@127.0.0.1:5432/invitations_dev"
export TRUST_PROXY=loopback        # honour X-Forwarded-For from a local k6 run (see §3)
export E2E_CAPTURE_EMAILS=1        # lets checkout.js read the 6-digit code (refused in production)
export PAYMENTS_PROVIDER=manual    # production order path; mock also works
node dist/main.js
```

`scripts/e2e-serve.sh api` does most of this (it sets `E2E_CAPTURE_EMAILS=1` and
`THROTTLE_LIMIT=2000`, but not `TRUST_PROXY`), and `npm run dev:full` starts both
apps in watch mode. Either is fine as long as the exports above are set.

### 2b. Web (port 3000)

```sh
cd platform/apps/web
set -a; . ./.env.example; set +a
export API_BASE_URL=http://localhost:3001
export NEXT_PUBLIC_API_URL=http://localhost:3001
export GUEST_MODE=api              # otherwise the page reads a local demo file and never calls the API
npx next dev -p 3000
```

Measure the production build (`npm run build` then `npx next start -p 3000`) if
you want numbers you can compare with a deployment: `next dev` recompiles routes
and is 2-5× slower per render.

---

## 3. Rate limits: the one thing that makes a load test lie

Every public route is throttled **per client IP** (`apps/api/src/security/README.md`):

| Route | Limit |
|---|---|
| `POST /v1/public/invitations/:slug/rsvp` | **5 / minute** |
| `GET /v1/public/invitations/:slug` | **60 / minute** |
| `POST /v1/checkout` | **10 / minute** |
| everything else | `THROTTLE_LIMIT` (default 100) / `THROTTLE_TTL_MS` (60s) |

`THROTTLE_LIMIT` only changes the **global default**; the per-route `@Throttle()`
overrides are compiled in, so raising it does **not** lift the 5/60/10 limits.
Do not change application code to run a load test. Instead:

1. start the API with `TRUST_PROXY=loopback` (the loopback peer is trusted, so
   the last untrusted `X-Forwarded-For` entry becomes the client IP), and
2. run k6 with `LOADTEST_SPREAD_IPS=1`: every request carries its own synthetic
   client address (`10.<vu>.<hi>.<lo>`), so the limiter sees a crowd of distinct
   guests and you measure the write/read path instead of the limiter.

Both modes are useful:

| Mode | Command | What it measures |
|---|---|---|
| **Limiter run** | no `LOADTEST_SPREAD_IPS` (default) | the throttle works: almost everything is `429`, real errors stay at 0 |
| **Capacity run** | `LOADTEST_SPREAD_IPS=1` + `TRUST_PROXY=loopback` | database, pool, render and CPU under load |

The custom `*_errors` rates count only *real* failures (5xx, network, unexpected
4xx). A `429` is a documented answer and is counted separately
(`rsvp_throttled`, `checkout_throttled`), so a limiter run can still be green.

`TRUST_PROXY=loopback` on a laptop is safe (only a local process can reach the
API), but **never** use it on an internet-facing host: anyone could then forge
their rate-limit identity. Remove it after the run.

---

## 4. Run the scripts

All flags are optional; the defaults match T43.

```sh
cd platform/loadtest
mkdir -p results

# 1 · RSVP burst — capacity run
k6 run -e LOADTEST_SPREAD_IPS=1 \
  --summary-export=results/rsvp-burst.json rsvp-burst.js

# 1b · RSVP burst — prove the 5/min limiter is alive (expect ~100% 429)
k6 run --summary-export=results/rsvp-burst-limiter.json rsvp-burst.js

# 2 · public reads — API 250/s + web page 250/s
k6 run -e LOADTEST_SPREAD_IPS=1 \
  --summary-export=results/public-reads.json public-reads.js

# 2b · public reads — API only (no page, no Next render)
k6 run -e LOADTEST_SPREAD_IPS=1 -e PUBLIC_WEB_RPS=0 \
  --summary-export=results/public-reads-api.json public-reads.js

# 3 · checkout creation — 20 signed-in orders/s
k6 run -e LOADTEST_SPREAD_IPS=1 \
  --summary-export=results/checkout.json checkout.js

# smoke (1 VU, 10 iterations) before a real run
k6 run --vus 1 --iterations 10 rsvp-burst.js
```

### `rsvp-burst.js`

| Env | Default | Meaning |
|---|---|---|
| `SLUG` | `demo-nour-omar` | the invitation under test |
| `RSVP_RPS` | `200` | peak requests/second |
| `RSVP_HOLD` | `30s` | how long the peak is held |
| `RSVP_RAMP` | `10s` | ramp-up/ramp-down per step |
| `RSVP_ATTENDING_RATIO` | `0.2` | share of "yes" answers (only those count against the tier cap) |
| `RSVP_PRE_VUS` / `RSVP_MAX_VUS` | `100` / `400` | VU pool |

Expected non-2xx, all counted: `429` (limiter), `403 rsvp_limit_reached`
(classic tier caps **attending** guests at 300 and the seed already has 10),
`403 rsvp_disabled` (save-the-date tier), `410 invitation_ended`. Only those last
two plus 5xx count as errors. Accepted writes are `201` (Nest answers 201 for a
POST; the body is an empty ack).

### `public-reads.js`

| Env | Default | Meaning |
|---|---|---|
| `SLUG`, `LOCALE` | `demo-nour-omar`, `ar` | page and API target |
| `PUBLIC_API_RPS` | `250` | JSON reads/second (`0` disables the scenario) |
| `PUBLIC_WEB_RPS` | `250` | page views/second (`0` disables the scenario) |
| `PUBLIC_DURATION` | `60s` | hold time |
| `PUBLIC_*_PRE_VUS` / `PUBLIC_*_MAX_VUS` | 50/200 and 100/400 | VU pools |

### `checkout.js`

| Env | Default | Meaning |
|---|---|---|
| `CHECKOUT_RPS` | `20` | orders/second |
| `CHECKOUT_DURATION` | `60s` | hold time |
| `LOADTEST_USERS` | `20` | throw-away customers signed in during `setup()` (`loadtest-<n>@example.test`) |
| `TEMPLATE_SLUG` / `TIER` | `mashrabiya` / `classic` | what is bought |
| `CHECKOUT_PRE_VUS` / `CHECKOUT_MAX_VUS` | `30` / `100` | VU pool |

Sign-in is the real email-code flow (`lib/auth.js`): `POST
/v1/auth/email-otp/send-verification-otp` → the code is read from
`GET /v1/__e2e/last-code` (only mounted with `E2E_CAPTURE_EMAILS=1`) → `POST
/v1/auth/sign-in/email-otp`. The session token is sent as a bearer token. In
development the same code is also printed in the API console as
`[DEV ONLY] sign-in code for …` (README "Run it locally").

Every accepted request writes an order. Afterwards:

```sh
bash scripts/dev-reset.sh     # drops invitations_dev and re-seeds (refuses names not ending in _dev/_test)
```

---

## 5. What to watch during a run

| Signal | Where | Why it matters |
|---|---|---|
| API CPU | `top -o cpu`, or `docker stats` | one Node process = one core; ~100% CPU means the API is the ceiling, not Postgres |
| Postgres connections | `select count(*), state from pg_stat_activity where datname = 'invitations_dev' group by state;` | `DATABASE_POOL_MAX` is **10** per API process; `max_connections` defaults to 100. Saturation shows up as p95 rising with no CPU rise |
| API 5xx | k6 `*_errors` rate + `503` bodies | `ServiceUnavailableException` almost always means pool timeout or `DATABASE_STATEMENT_TIMEOUT_MS` (5s) |
| 429 vs real errors | `rsvp_throttled`, `checkout_throttled`, `http_req_failed` | `429` = the limiter working; anything else red is a real bug |
| Next render | `web_page_ms` vs `api_read_ms` | the page should cost a few ms more than the JSON read; much more means the render is the bottleneck |
| API read rate while the page scenario runs | API logs / `pg_stat_activity` | each page view makes **two** API reads (`generateMetadata` + page body) when `GUEST_MODE=api` |
| Memory | `ps -o rss` / `docker stats` | k6 at 500 rps plus Next plus the API needs headroom; a swapping laptop gives meaningless p99 |

Handy SQL while a run is in flight:

```sql
-- connections by state
select state, count(*) from pg_stat_activity where datname = 'invitations_dev' group by state;
-- sessions waiting on the DB (pool exhaustion / locks)
select pid, wait_event_type, wait_event, now() - query_start as running
from pg_stat_activity where datname = 'invitations_dev' and state <> 'idle' order by running desc limit 10;
-- rows written by the run (use the timestamp k6 printed in teardown)
select count(*) from public.rsvps  where created_at >= now() - interval '10 minutes';
select count(*) from public.orders where created_at >= now() - interval '10 minutes';
```

---

## 6. Expected findings (read before blaming the script)

These are real properties of the current stack. Expect to meet them, and write
them down in the report instead of "fixing" the script.

1. **Rate limiter, per client IP, hard-coded per route.** Without
   `LOADTEST_SPREAD_IPS=1` every script mostly collects `429`s. Even with it,
   the limiter is the first thing that breaks a *real* crowd behind one NAT:
   200 guests on the same Wi-Fi share 5 RSVPs/minute.
2. **Database pool = 10 connections per API process.** At ~500 reads/s expect
   p95 to climb once the pool is saturated; `DATABASE_POOL_MAX` is the first
   knob to try (watch `max_connections` and Postgres CPU before raising it).
3. **The public page re-reads the API on every render.** The route is
   `force-dynamic`, and with `GUEST_MODE=api` the server does **two** public
   reads per view (metadata + body) from the Next server's single IP. The 60/min
   read limit therefore caps the page at roughly **30 views/minute** before the
   API answers 429 to Next and the page returns 500. Options: memoise the read
   per request (`cache()`), give the page an ISR/CDN cache, or give the web a
   dedicated read credential/limit.
4. **Classic tier RSVP cap.** 300 attending guests; a 30s burst at 200/s writes
   ~6,000 RSVPs, so `403 rsvp_limit_reached` is expected on `demo-nour-omar`.
   Use a premium invitation (no cap) to measure pure write throughput.
5. **Manual checkout allocates a unique amount per order.** The allocator has a
   finite slot pool; when it runs out the API logs a warning and falls back to
   the plain amount. That is a deliberate graceful degradation, not a failure.
6. **The rate-limit store is in-memory.** Counters live in one process
   (`InMemoryRateLimitStorage`): with N API instances the effective limit is N×,
   and a restart resets it. Do not scale horizontally before moving counters to
   a shared store.

---

## 7. Interpreting the run

- k6 prints thresholds at the end; the process exits non-zero when one fails.
  A failing limiter run is expected; a failing capacity run is the result you
  came for — copy the numbers into the report before changing anything.
- `--summary-export=results/<name>.json` writes the full metric set (p50 is
  `med`, plus p90/p95/p99 and every counter) for the report tables.
- Compare runs only on the same machine and the same build (`next start`, not
  `next dev`), and re-seed between runs so the RSVP cap and the order volume do
  not drift.
