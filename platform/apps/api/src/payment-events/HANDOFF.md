# L3 payment auto-confirm — handoff

Implemented within the lane's ownership. No dependencies installed and no commits created by this run. Orchestrator commit `a6679e0` was preserved. Checkout, payments, orders, admin-payments, auth, and other repositories were not modified.

## Done

- Migration 0016: private service-role-only events and allocations; RLS and explicit grants; three security-definer functions with `search_path = public`.
- Allocation chooses the smallest free 1–99 piastres across active totals in the same currency, including overlapping base amounts. Active means the order is pending; changing status releases the slot without deleting historical allocation rows. A transaction advisory lock serializes allocation and inbound matching.
- Exact-amount/currency confirmation, order/event locks, event reuse prevention, 72-hour checks, idempotent paid-order retries, fulfillment and audit in one transaction. SQL raises on a failed fulfillment result, rolling back bookkeeping.
- HMAC verification, five-minute replay window, constant-time comparison, exact decimal parsing, configurable provisional EasyConfirm adapter.
- Reference-first pure matcher; ambiguous/unmatched queue; no amount fallback when an explicit reference is unknown or mismatched.
- Insert, match and confirmation share one service-role transaction. Exceptions roll back insertion so a provider retry is not incorrectly treated as an already-stored duplicate.
- Public throttled webhook, role-protected admin list/assignment, exported unique-amount service, config and module registration.
- SQL fixtures/assertions and 102 Jest tests, including full Nest/Express HTTP integration without listening sockets.

## Changes after the WIP commit

- Successful confirmation now replaces an obsolete queue `match_reason`; admin assignment uses `admin_assignment`. SQL regression assertion added.
- Numeric JSON amount tokens are preserved using the Node 22+ JSON reviver source, preventing JSON parsing from silently rounding a large amount before decimal conversion. Five regression cases added.
- L3 HTTP integration uses real request/response streams and the real Nest/Express application with an in-memory transport. This exercises raw-body parsing, guards, DTOs, routes and exception filtering without the sandbox's prohibited socket binding. The database boundary and role lookup are stubbed, as in the existing admin integration tests.

## Files

- `platform/supabase/migrations/0016_payment_events.sql`
- `platform/supabase/tests/payments.sql`
- `platform/apps/api/src/payment-events/`:
  - `payment-event-provider.ts`: provider port and parsed event type.
  - `generic-hmac.provider.ts`, `easyconfirm.provider.ts`: verification and field mapping.
  - `payment-event.matcher.ts`: pure matching.
  - `payment-events.repository.ts`: tagged-template service-role transactions only.
  - `payment-events.service.ts`, `unique-amount.service.ts`: orchestration and exported allocation API.
  - `payment-events.controller.ts`, `payment-events.module.ts`: routes and module.
  - `providers.spec.ts`, `payment-event.matcher.spec.ts`, `payment-events.repository.spec.ts`, `payment-events.service.spec.ts`, `payment-events.controller.spec.ts`, `payment-events.e2e.spec.ts`: Jest coverage.
  - `HANDOFF.md`: this report.
- Clearly marked append-only blocks in API `.env.example`, `src/config/env.schema.ts`, `src/config/app-config.service.ts`, `src/testing/env.ts`, and `src/openapi/generate-openapi.ts`.
- One import expression beneath the lane marker in `src/app.module.ts`. It resolves a Nest dynamic-module object, keeping module registration to the authorized single appended line.

## SQL contracts

All three functions are executable by service_role only (and the database owner). Both tables revoke PUBLIC/anon/authenticated privileges. Refused operations return without changing order/event/audit data.

| Function | Success | Refusal reasons |
| --- | --- | --- |
| `allocate_unique_amount(p_order_id uuid)` | `{amount_minor, extra_minor}`; repeat while pending returns the same allocation | `{ok:false,reason}`: `not_found`, `not_manual`, `not_pending` (also stale pending), `no_slot` |
| `system_confirm_payment(p_event_id uuid, p_order_id uuid, p_provider text)` | `{ok:true,already:false}` or paid-order no-op `{ok:true,already:true}` | `not_found`, `provider_mismatch`, `event_already_matched`, `event_not_available`, `not_manual`, `not_pending`, `outside_window`, `amount_mismatch` |
| `admin_assign_payment_event(p_admin_id uuid, p_event_id uuid, p_order_id uuid, p_note text)` | Same confirmation result; verified admin actor and note recorded | Same applicable confirmation reasons, plus `not_admin`, `note_required`; no provider argument, so no `provider_mismatch` |

`amount_mismatch` also returns `expected_minor` and `received_minor`. Currency mismatch uses this same reason. Orders past 72 hours cannot be auto-confirmed even before the expiry cron changes their status. Event receipt must fall within the order window and cannot be in the future.

System audit: actor null, action `order.auto_confirm`, target type `order`. Admin audit: actor admin ID, action `order.assign_payment_event`. Both include provider, event ID, external transaction ID, base/expected/received amounts, currency and note. Paid amount includes the extra piastres; the order's base `amount_minor` remains unchanged.

## HTTP and service contracts

- `POST /v1/payment-events/:provider`, where provider is `generic-hmac` or `easyconfirm`: public, 60/minute; success `200 {ok:true}`, duplicate `200 {ok:true,duplicate:true}`. Invalid signature/replay/configuration/payload produces the same generic 401. DB failures produce a generic 503 and are retryable.
- `GET /v1/admin/payment-events?status=unmatched|ambiguous|matched&limit=50`: admin only; defaults unmatched/50, limit 1–100. Returns metadata rows, excluding `raw`. `amount_minor` is a decimal integer string to avoid bigint serialization/precision loss.
- `POST /v1/admin/payment-events/:id/assign` with `{orderId,note}`: admin only; UUIDs required, trimmed note 1–500 chars. Success `200 {ok:true,already:boolean}`. `not_found` → 404; amount/status/availability/window conflicts → 409; SQL admin denial → 403. DTO errors → 400.
- `UniqueAmountService.allocate(orderId)` is exported by `PaymentEventsModule` and returns `{amountMinor,extraMinor}`. `no_slot` becomes 409. Integration must import the module, call this after creating the pending manual order, and display/collect the resulting total.

Generic wire contract: `x-signature` is hex HMAC-SHA256 over timestamp ASCII, a dot, then the exact body bytes. `x-timestamp` is Unix seconds with absolute skew at most 300 seconds. Payload: `{id,amount,currency,sender?,note?,received_at}`. Amount accepts fixed-decimal major units (including correctly grouped commas in strings); currency is three uppercase letters; received_at is an ISO timestamp with timezone. Strings are parsed with bigint arithmetic, not floating-point multiplication. Numeric JSON tokens use the runtime's original source text; runtimes without that support fail closed for numeric amounts.

## EasyConfirm inputs still required

The adapter is provisional, not verified against vendor documentation. It requires BOTH `EASYCONFIRM_API_KEY` and `PAYMENT_EVENTS_SECRET` (at least 32 characters). The API key is an enablement prerequisite, not a substitute for HMAC verification. Header names come from `EASYCONFIRM_SIGNATURE_HEADER` and `EASYCONFIRM_TIMESTAMP_HEADER`. All provisional payload mappings are in `EASYCONFIRM_FIELDS`.

Owner/vendor must supply:

1. Actual webhook docs and signed sample payloads: signature algorithm/encoding, signed bytes, timestamp header/units, key/secret roles.
2. Event ID uniqueness and retry semantics, field names, amount units/currencies, successful-transfer status, sender/note fields and receipt-time semantics.
3. Webhook registration procedure and API credentials; whether a reconciliation/list API exists.
4. A real transfer confirming InstaPay/wallet support for extra piastres.

## Left for integration / CI

- Execute the SQL migration and tests on PostgreSQL 17 in CI; no PostgreSQL server is available here. SQL was reviewed against existing migrations, but is NOT claimed runtime-verified.
- Run the complete existing test suite in a socket-capable environment. Existing unrelated Supertest/HTTP-timeout suites cannot bind sockets in this sandbox. They remain unchanged.
- Wire unique amounts into checkout and the customer payment instructions (explicitly outside L3 ownership).
- Replace/validate the provisional EasyConfirm contract when vendor docs arrive. Polling/reconciliation and the web admin queue are not implemented in this lane.

OpenWolf files were not edited because the later lane ownership instruction only authorizes the paths above; session findings and verification evidence are recorded here instead.

## Verification (real local runs)

| Area | Before L3 | Final |
| --- | --- | --- |
| API Jest | 256 total: 224 passed, 32 failed; 41 suites | 358 total: 326 passed, 32 failed; 47 suites |
| L3 alone | absent | 102 passed, 6 suites passed (96 unit + 6 full-app HTTP) |
| Web | 185 passed | 185 passed |
| Shared | 155 passed | 155 passed |

The 32 baseline failures are in seven existing suites: admin-customers, admin-payments, rate-limit/throttle, app, auth/roles, auth/auth, and supabase-timeout. Supertest cannot bind a socket (null server address); the timeout suite explicitly reports `listen EPERM: operation not permitted 127.0.0.1`. No tests were skipped, and no existing tests were modified.

The requested `&&` gate chain ran and stopped at `npm test` (exit 1). `npm run build:api` was then run separately and passed. The suite is **not all green in this environment**; all new L3 tests pass.

Actual output tails follow.

### npm run build --workspace @platform/shared (exit 0)

```text
ESM dist/index.js 22.92 KB
ESM ⚡️ Build success in 92ms
CJS dist/index.cjs 24.43 KB
CJS ⚡️ Build success in 92ms
DTS Build start
DTS ⚡️ Build success in 881ms
DTS dist/index.d.cts 98.65 KB
DTS dist/index.d.ts  98.65 KB
```

### npm run typecheck (exit 0)

```text
> npm run typecheck --workspaces --if-present


> @platform/api@0.1.0 typecheck
> tsc --noEmit


> @platform/web@0.1.0 typecheck
> tsc --noEmit


> @platform/api-client@0.1.0 typecheck
> tsc --noEmit


> @platform/shared@0.1.0 typecheck
> tsc --noEmit

```

### npm run lint (exit 0)

```text

> invitation-platform@0.1.0 lint
> npm run lint --workspace @platform/web && npm run lint --workspace @platform/api


> @platform/web@0.1.0 lint
> eslint . --max-warnings=0


> @platform/api@0.1.0 lint
> eslint . --max-warnings=0

```

### npm test (exit 1) — API and workspace summaries

```text
    listen EPERM: operation not permitted 127.0.0.1
    listen EPERM: operation not permitted 127.0.0.1
Test Suites: 7 failed, 40 passed, 47 total
Tests:       32 failed, 326 passed, 358 total
      Tests  185 passed (185)
      Tests  155 passed (155)
```

Final workspace tail:

```text
 ✓ src/__tests__/contracts.test.ts (90 tests) 21ms

 Test Files  7 passed (7)
      Tests  155 passed (155)
   Start at  19:37:51
   Duration  288ms (transform 129ms, setup 0ms, collect 473ms, tests 42ms, environment 1ms, prepare 314ms)

```

### npm run build:api (exit 0)

```text
ESM dist/index.js 22.92 KB
ESM ⚡️ Build success in 71ms
DTS Build start
DTS ⚡️ Build success in 756ms
DTS dist/index.d.cts 98.65 KB
DTS dist/index.d.ts  98.65 KB

> @platform/api@0.1.0 build
> rm -rf dist tsconfig.build.tsbuildinfo && nest build

```

### L3-only Jest output

```text

PASS src/payment-events/payment-events.e2e.spec.ts
PASS src/payment-events/payment-events.controller.spec.ts
PASS src/payment-events/payment-events.service.spec.ts
PASS src/payment-events/providers.spec.ts
PASS src/payment-events/payment-events.repository.spec.ts
PASS src/payment-events/payment-event.matcher.spec.ts

Test Suites: 6 passed, 6 total
Tests:       102 passed, 102 total
Snapshots:   0 total
Time:        1.145 s
Ran all test suites matching /payment-events/i.
```
