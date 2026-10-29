/* global __ENV, __VU, __ITER */
/**
 * T43 · Scenario 3 — checkout creation (signed in).
 *
 * Runs at `CHECKOUT_RPS` (default 20) for `CHECKOUT_DURATION` (default 60s):
 *   setup()     signs in `LOADTEST_USERS` (default 20) throw-away customers with
 *               the real email-code flow — see lib/auth.js and the README
 *               ("Run it locally" for the dev code; the API must run with
 *               E2E_CAPTURE_EMAILS=1 so the script can read the 6 digits)
 *   default()   POST /v1/checkout {kind:'new'} with a fresh Idempotency-Key,
 *               exactly like the web checkout form
 *
 * Every accepted request creates a row in `orders` (plus an invitation, a
 * points/entitlement side in the RPC) — that is the point: this is the write
 * path a marketing push hits. Reset the dev database afterwards:
 * `scripts/dev-reset.sh` (refuses any database name not ending in _dev/_test).
 *
 * Rate limit: POST /v1/checkout is 10/minute per client IP. Use
 * `LOADTEST_SPREAD_IPS=1` with the API started on `TRUST_PROXY=loopback` for a
 * capacity run; without it the run measures the limiter (429s).
 *
 * Payment provider: the script accepts both answer shapes, so it works with
 * `PAYMENTS_PROVIDER=mock` (default in .env.example) and with
 * `PAYMENTS_PROVIDER=manual` (production mode: the answer carries a `payment`
 * block with a unique amount to transfer). Manual mode allocates a unique
 * amount per order; when the amount slots run out the API falls back to the
 * plain amount and logs a warning — that is expected under 1,200 orders.
 */

import http from 'k6/http';
import {check} from 'k6';
import {Counter, Rate, Trend} from 'k6/metrics';
import {authHeaders, loadTestEmail, signIn} from './lib/auth.js';
import {
  apiPath,
  banner,
  env,
  isoEventDate,
  logUnexpected,
  positiveNumber,
  randomHex,
  randomInt,
  syntheticIp
} from './lib/env.js';

const checkoutRate = Math.round(positiveNumber(__ENV.CHECKOUT_RPS, 20));
const duration = __ENV.CHECKOUT_DURATION || '60s';
const users = Math.round(positiveNumber(__ENV.LOADTEST_USERS, 20));
const templateSlug = __ENV.TEMPLATE_SLUG || 'mashrabiya';
const tier = __ENV.TIER || 'classic';

const checkoutCreated = new Counter('checkout_created');
const checkoutThrottled = new Counter('checkout_throttled');
const checkoutRejected = new Counter('checkout_rejected');
/** Real failures only: 5xx, 401 (the session broke), unexpected 4xx, network errors. */
const checkoutErrors = new Rate('checkout_errors');
const checkoutMs = new Trend('checkout_ms', true);

export const options = {
  scenarios: {
    checkout: {
      executor: 'constant-arrival-rate',
      rate: checkoutRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: Math.round(positiveNumber(__ENV.CHECKOUT_PRE_VUS, 30)),
      maxVUs: Math.round(positiveNumber(__ENV.CHECKOUT_MAX_VUS, 100)),
      tags: {scenario: 'checkout'}
    }
  },
  thresholds: {
    checkout_errors: ['rate<0.01'],
    checks: ['rate>0.99'],
    'checkout_ms': ['p(95)<1200'],
    'http_req_duration{endpoint:checkout}': ['p(95)<1200'],
    // Proves the run created orders instead of quietly being throttled away.
    checkout_created: ['count>0']
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  discardResponseBodies: false
};

export function setup() {
  banner('T43 · checkout creation', {
    API: env.apiUrl,
    Template: `${templateSlug} / ${tier} / kind=new`,
    Load: `${checkoutRate} orders/s for ${duration}`,
    'Signed-in users': `${users} (email-code sign-in during setup)`
  });

  const sessions = [];
  for (let index = 1; index <= users; index += 1) {
    sessions.push(signIn(loadTestEmail(index)));
  }
  console.log(`signed in ${sessions.length} load-test customers`);
  return {sessions, startedAt: new Date().toISOString()};
}

export default function (data) {
  const sessions = data.sessions;
  const session = sessions[(__VU - 1) % sessions.length];
  const vu = __VU;
  const iteration = __ITER;

  const body = {
    templateSlug,
    tier,
    kind: 'new',
    method: 'card',
    couple: {first: 'Load', second: `Test ${vu}-${iteration}`},
    eventDate: isoEventDate(randomInt(120, 400))
  };

  const headers = authHeaders(session, {
    // The web checkout sends one per purchase so a retry cannot double-charge.
    'Idempotency-Key': `loadtest-${vu}-${iteration}-${randomHex(16)}`
  });
  if (env.spreadIps) headers['X-Forwarded-For'] = syntheticIp(vu, iteration);

  const response = http.post(apiPath('/v1/checkout'), JSON.stringify(body), {
    headers,
    tags: {endpoint: 'checkout'}
  });
  const status = response.status;
  let orderId = null;
  if (status === 200 || status === 201) {
    try {
      orderId = response.json('orderId');
    } catch {
      orderId = null;
    }
  }

  check(response, {
    'checkout: 2xx or a documented 409/422/429': (r) => r.status === 200 || r.status === 201 || r.status === 409 || r.status === 422 || r.status === 429,
    'checkout: an order id comes back': () => !(status === 200 || status === 201) || typeof orderId === 'string'
  });

  if (status === 200 || status === 201) {
    checkoutCreated.add(1);
    checkoutMs.add(response.timings.duration);
    checkoutErrors.add(false);
    return;
  }
  if (status === 429) {
    checkoutThrottled.add(1);
    checkoutErrors.add(false);
    return;
  }
  if (status === 409 || status === 422) {
    // insufficient_points / invitation_not_found / price_not_found: a real answer, not an outage.
    checkoutRejected.add(1);
    checkoutErrors.add(false);
    logUnexpected('checkout rejected', response);
    return;
  }
  checkoutErrors.add(true);
  logUnexpected('checkout unexpected', response);
}

export function teardown(data) {
  console.log(`Checkout window: ${data.startedAt} → ${new Date().toISOString()}`);
  console.log("Orders written in the window: select count(*) from public.orders where created_at >= '<startedAt>';");
  console.log('Reset the dev database: bash scripts/dev-reset.sh (dev-only, refuses production names)');
}
