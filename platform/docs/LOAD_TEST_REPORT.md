# Load test report (T43)

> **Status:** not run yet — this is the empty template.
> Fill it in after running the k6 scripts in [`platform/loadtest/`](../loadtest/README.md)
> and keep the raw `--summary-export` JSON files next to it (do not commit them).
> (T43 in `docs/REMAINING_TASKS_ANTIGRAVITY.md` names this deliverable
> `docs/LOAD_TEST.md`; this file is the same report, under the name the task
> brief gives it.)
>
> | | |
> |---|---|
> | Run date | `<YYYY-MM-DD>` |
> | Run by | `<name>` |
> | Branch / commit | `<branch>` @ `<commit sha>` |
> | Machine | `<laptop / CI runner / staging host>` |

---

## 1. Environment

Record exactly what was under test. Numbers are only comparable within one row
of this table.

| Item | Value |
|---|---|
| Host / machine | `<e.g. MacBook Pro M3 Pro, 12 cores, 18 GB>` |
| OS / kernel | `<macOS 15.1 / Ubuntu 24.04>` |
| Docker or native Postgres | `<docker compose -f infra/docker-compose.dev.yml / local psql>` |
| PostgreSQL version | `<select version();>` |
| `max_connections` | `<show max_connections;>` |
| API | `<node dist/main.js of commit …>` |
| `DATABASE_POOL_MAX` | `<10 (default)>` |
| `DATABASE_STATEMENT_TIMEOUT_MS` | `<5000 (default)>` |
| `THROTTLE_LIMIT` / `THROTTLE_TTL_MS` | `<100 / 60000>` |
| `TRUST_PROXY` | `<empty / loopback>` |
| `LOADTEST_SPREAD_IPS` | `<1 / unset>` |
| `PAYMENTS_PROVIDER` / `PURCHASES_VIA_BALANCE` | `<manual / false>` |
| Web build | `<next dev / next start>` |
| `GUEST_MODE` | `<api / demo>` |
| k6 version | `<k6 version>` |
| Seed state | `<fresh scripts/dev-setup.sh / re-seeded before each script>` |

Notes about the environment (other processes, browser open, thermal throttling…):

`<…>`

---

## 2. Results

Copy the k6 console summary and the `--summary-export` JSON into these tables.
`p50` is `med` in the k6 output. Rate = configured arrival rate, achieved RPS =
`http_reqs / duration`.

### 2.1 `rsvp-burst.js` — `POST /v1/public/invitations/demo-nour-omar/rsvp`

Mode: `<capacity (LOADTEST_SPREAD_IPS=1) / limiter (single IP)>` ·
Target: `<200>` req/s for `<30s>` hold · VUs: `<pre / max>`

| Metric | Value |
|---|---|
| Total requests | `<…>` |
| Achieved RPS | `<…>` |
| Latency p50 / p90 / p95 / p99 / max | `<…> / <…> / <…> / <…> / <…>` ms (`rsvp_write_ms`, accepted writes only) |
| `2xx` accepted (`201`) | `<…>` |
| `429` throttled | `<…>` |
| `403 rsvp_limit_reached` | `<…>` |
| `403 rsvp_disabled` | `<…>` |
| `410 invitation_ended` | `<…>` |
| Real errors (`rsvp_errors`) | `<…> %` |
| Thresholds passed | `<yes / no — which>` |
| Rows written (`select count(*) from public.rsvps …`) | `<…>` |

First thing that broke / looked suspicious:

`<…>`

### 2.2 `public-reads.js` — `GET /v1/public/invitations/:slug` + `/{locale}/i/:slug`

Mode: `<capacity / limiter>` · Target: `<250>` API + `<250>` page req/s for `<60s>`

| Metric | API read | Web page |
|---|---|---|
| Total requests | `<…>` | `<…>` |
| Achieved RPS | `<…>` | `<…>` |
| Latency p50 | `<…>` ms | `<…>` ms |
| Latency p90 | `<…>` ms | `<…>` ms |
| Latency p95 | `<…>` ms | `<…>` ms |
| Latency p99 | `<…>` ms | `<…>` ms |
| Max | `<…>` ms | `<…>` ms |
| `200` | `<…>` | `<…>` |
| `429` | `<…>` | `<…>` |
| `5xx` | `<…>` | `<…>` |
| Real error rate | `<…> %` | `<…> %` |
| Thresholds passed | `<yes / no>` | `<yes / no>` |

Secondary observations:

- API request rate seen while only the page scenario ran (two reads per view?): `<…>`
- Connection pool high-water mark (`pg_stat_activity`): `<…> of <max_connections>`
- API CPU peak: `<…> %` of one core · Postgres CPU peak: `<…> %`

### 2.3 `checkout.js` — `POST /v1/checkout` (signed in)

Mode: `<capacity / limiter>` · Target: `<20>` orders/s for `<60s>` · Users: `<20>`

| Metric | Value |
|---|---|
| Signed-in users | `<…>` |
| Total requests | `<…>` |
| Achieved RPS | `<…>` |
| Latency p50 / p90 / p95 / p99 / max | `<…> / <…> / <…> / <…> / <…>` ms |
| `2xx` orders created | `<…>` |
| `429` throttled | `<…>` |
| `409` / `422` rejected | `<…>` |
| Real errors (`checkout_errors`) | `<…> %` |
| Thresholds passed | `<yes / no — which>` |
| Orders in DB for the window | `<…>` |
| Sign-in failures during setup | `<…>` |

Manual-payment specifics (unique amount allocation, fallbacks logged):

`<…>`

---

## 3. Bottlenecks

Ordered by what limited the run first. "Evidence" must be a number from §2 or a
query, not an impression.

| # | Symptom | Evidence | Cause | Proposed fix | Size / risk |
|---|---|---|---|---|---|
| 1 | `<p95 climbs / 429 storm / 500s>` | `<metric: value>` | `<pool / limiter / render / lock>` | `<…>` | `<S/M/L>` |
| 2 | `<…>` | `<…>` | `<…>` | `<…>` | `<…>` |
| 3 | `<…>` | `<…>` | `<…>` | `<…>` | `<…>` |

Known candidates to check first (see `loadtest/README.md` §6):

- [ ] Per-route rate limits (RSVP 5/min, read 60/min, checkout 10/min per IP) —
      does a guest crowd behind one NAT get throttled?
- [ ] Database pool (`DATABASE_POOL_MAX=10`) — sessions waiting, p95 rising
      without CPU rising.
- [ ] Public page render — two public reads per view from one server IP,
      `force-dynamic`, no cache.
- [ ] RSVP tier cap (classic = 300 attending guests) — `403` volume.
- [ ] Manual unique-amount allocation — fallbacks in the API log.
- [ ] Single-process in-memory rate-limit storage — limits multiply per instance.

---

## 4. Recommendations

Fixes that are small and safe are done on the branch; anything bigger is listed
here with a size and an owner.

| # | Recommendation | Where | Expected effect | Done? |
|---|---|---|---|---|
| 1 | `<e.g. raise DATABASE_POOL_MAX to 20 and keep max_connections ≥ 4×pool>` | `infra/`, `apps/api/.env` | `<…>` | `<no — config only>` |
| 2 | `<e.g. memoise the public snapshot per request with React cache()>` | `apps/web/src/app/[locale]/i/[slug]/page.tsx`, `guest/api-store.ts` | `<halves the API reads per page view>` | `<no>` |
| 3 | `<e.g. cache the public read for 60s (ISR / CDN)` | `<…>` | `<…>` | `<no>` |
| 4 | `<e.g. per-route throttle for public reads keyed by route+slug>` | `apps/api/src/public-invitations/` | `<…>` | `<no>` |

Proposed production settings after this run:

| Setting | Current | Proposed | Why |
|---|---|---|---|
| `DATABASE_POOL_MAX` | `10` | `<…>` | `<…>` |
| Postgres `max_connections` | `<…>` | `<…>` | `<…>` |
| `THROTTLE_LIMIT` / `THROTTLE_TTL_MS` | `100` / `60000` | `<…>` | `<…>` |
| RSVP route limit | `5/min` | `<…>` | `<…>` |
| Public read route limit | `60/min` | `<…>` | `<…>` |
| Cache for `/{locale}/i/:slug` | none | `<…>` | `<…>` |
| API instances | `1` | `<…>` | `<…>` (needs a shared rate-limit store first) |

---

## 5. Follow-ups

| Item | Owner | Task id | Status |
|---|---|---|---|
| `<…>` | `<…>` | `<T43 / new>` | `<open>` |

---

## 6. Appendix — exact commands and artifacts

```sh
# API (load-test flags)
cd platform/apps/api && set -a; . ./.env.example; set +a
export DATABASE_URL="postgresql://app_api:dev-app-api-password@127.0.0.1:5432/invitations_dev"
export TRUST_PROXY=loopback E2E_CAPTURE_EMAILS=1 PAYMENTS_PROVIDER=manual
node dist/main.js

# Web
cd platform/apps/web && set -a; . ./.env.example; set +a
export API_BASE_URL=http://localhost:3001 NEXT_PUBLIC_API_URL=http://localhost:3001 GUEST_MODE=api
npx next start -p 3000     # or: npx next dev -p 3000

# k6
cd platform/loadtest
k6 run -e LOADTEST_SPREAD_IPS=1 --summary-export=results/rsvp-burst.json rsvp-burst.js
k6 run -e LOADTEST_SPREAD_IPS=1 --summary-export=results/public-reads.json public-reads.js
k6 run -e LOADTEST_SPREAD_IPS=1 --summary-export=results/checkout.json checkout.js
```

Artifacts kept outside git (paths, not contents):

| Artifact | Path | Notes |
|---|---|---|
| RSVP summary | `platform/loadtest/results/rsvp-burst.json` | `<commit / date>` |
| Public-reads summary | `platform/loadtest/results/public-reads.json` | `<…>` |
| Checkout summary | `platform/loadtest/results/checkout.json` | `<…>` |
| API log excerpt (429/503 lines) | `<path>` | `<…>` |
| Postgres sample of `pg_stat_activity` | `<path>` | `<…>` |

Post-run checks:

```sql
select count(*) from public.rsvps  where created_at >= '<start>';   -- RSVP burst
select count(*) from public.orders where created_at >= '<start>';   -- checkout
select state, count(*) from pg_stat_activity where datname = 'invitations_dev' group by state;
```

Cleanup after a destructive run:

```sh
bash platform/scripts/dev-reset.sh    # dev-only; refuses names not ending in _dev/_test
```
