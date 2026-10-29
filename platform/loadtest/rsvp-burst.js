/* global __ENV, __VU, __ITER */
/**
 * T43 · Scenario 1 — RSVP burst.
 *
 * Ramps to `RSVP_RPS` (default 200) POSTs/second on ONE published invitation and
 * holds it for `RSVP_HOLD` (default 30s). Bodies vary (names, Egyptian phones,
 * attending/not attending, guest counts, notes) and the phone is upserted per
 * (invitation, phone), so this writes a new row nearly every time.
 *
 * Rate limits first: `POST /v1/public/invitations/:slug/rsvp` is throttled at
 * 5 requests/minute per client IP (apps/api/src/security/README.md). Two runs:
 *
 *   limiter run   (no LOADTEST_SPREAD_IPS) → the API answers 429 after the first
 *                 5 requests; every 429 is counted in `rsvp_throttled`, not in
 *                 `rsvp_errors`. Use it to prove the limiter works.
 *   capacity run  (LOADTEST_SPREAD_IPS=1 + API started with TRUST_PROXY=loopback)
 *                 → each request carries its own X-Forwarded-For, so the limiter
 *                 sees a crowd of distinct guests and the write path is measured.
 *
 * Expected non-2xx answers, all counted separately:
 *   429 too_many_requests        the per-IP limiter (see above)
 *   403 rsvp_limit_reached       the classic tier caps attending guests at 300;
 *                                the seed invitation already has 10 RSVPs, so a
 *                                long run on a classic invitation WILL hit it
 *   403 rsvp_disabled            save-the-date tier (rsvpLimit 0)
 *   410 invitation_ended         wrong slug/tier for a burst run (counted as an error)
 */

import http from 'k6/http';
import {check} from 'k6';
import {Counter, Rate, Trend} from 'k6/metrics';
import {
  apiPath,
  banner,
  env,
  errorCode,
  egyptianPhone,
  guestName,
  invitationApiPath,
  jsonHeaders,
  logUnexpected,
  nonNegativeNumber,
  positiveNumber,
  randomFrom,
  randomInt,
  rsvpApiPath
} from './lib/env.js';

const targetRate = Math.round(positiveNumber(__ENV.RSVP_RPS, 200));
const hold = __ENV.RSVP_HOLD || '30s';
const rampSeconds = __ENV.RSVP_RAMP || '10s';
/** Share of guests who say yes. Only "yes" RSVPs count against the tier cap. */
const attendingRatio = nonNegativeNumber(__ENV.RSVP_ATTENDING_RATIO, 0.2);

const rsvpOk = new Counter('rsvp_ok');
const rsvpThrottled = new Counter('rsvp_throttled');
const rsvpRefused = new Counter('rsvp_refused');
const rsvpLimitReached = new Counter('rsvp_limit_reached');
const rsvpEnded = new Counter('rsvp_ended');
/** Real failures only: 5xx, network errors, 4xx we do not expect (400/404/410/…). */
const rsvpErrors = new Rate('rsvp_errors');
/** Latency of accepted writes only (429s are fast and would drag the percentile down). */
const rsvpWriteMs = new Trend('rsvp_write_ms', true);

export const options = {
  scenarios: {
    rsvp_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: Math.round(positiveNumber(__ENV.RSVP_PRE_VUS, 100)),
      maxVUs: Math.round(positiveNumber(__ENV.RSVP_MAX_VUS, 400)),
      stages: [
        {target: Math.max(1, Math.round(targetRate / 4)), duration: rampSeconds},
        {target: targetRate, duration: rampSeconds},
        {target: targetRate, duration: hold},
        {target: 0, duration: rampSeconds}
      ],
      gracefulStop: '30s',
      tags: {scenario: 'rsvp_burst'}
    }
  },
  thresholds: {
    // The SLO: under 1% real errors and a fast accepted write.
    rsvp_errors: ['rate<0.01'],
    checks: ['rate>0.99'],
    'rsvp_write_ms': ['p(95)<600'],
    'http_req_duration{endpoint:rsvp}': ['p(95)<800']
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  // Bodies are tiny and we read `error.code` on refusals, so keep them.
  discardResponseBodies: false
};

const NOTES = [
  'لا أستطيع الحضور، أعتذر',
  'سأكون هناك بإذن الله',
  'مبارك للعروسين',
  'أتمنى لكم حياة سعيدة',
  'Coming with the family',
  'Cannot make it, so sorry'
];

/** Varied but always schema-valid body (`.strict()`: no extra keys). */
function rsvpBody(vu, iteration) {
  const attending = Math.random() < attendingRatio;
  const body = {
    name: guestName(vu, iteration),
    attending,
    guests: attending ? randomInt(0, 2) : 0
  };
  if (Math.random() < 0.8) body.phone = egyptianPhone(vu, iteration);
  if (Math.random() < 0.25) body.note = randomFrom(NOTES);
  return body;
}

export function setup() {
  banner('T43 · RSVP burst', {
    API: env.apiUrl,
    Invitation: env.slug,
    Load: `up to ${targetRate} RSVP POSTs/s, ${hold} at peak`,
    'Attending share': `${Math.round(attendingRatio * 100)}%`
  });

  const probe = http.get(apiPath(invitationApiPath()), {
    headers: {'Accept': 'application/json'},
    tags: {endpoint: 'probe'}
  });
  if (probe.status !== 200) {
    throw new Error(`GET ${invitationApiPath()} answered ${probe.status}; check SLUG and that the seed is loaded`);
  }
  const state = probe.json('state');
  if (state !== 'live') {
    throw new Error(`invitation "${env.slug}" is "${state}", not "live"; use a published seed invitation (demo-nour-omar)`);
  }
  return {startedAt: new Date().toISOString()};
}

export default function () {
  const vu = __VU;
  const iteration = __ITER;
  const response = http.post(apiPath(rsvpApiPath()), JSON.stringify(rsvpBody(vu, iteration)), {
    headers: jsonHeaders(vu, iteration),
    tags: {endpoint: 'rsvp'}
  });
  const status = response.status;

  check(response, {
    'rsvp: 2xx or a documented 403/410/429': (r) =>
      r.status === 200 || r.status === 201 || r.status === 403 || r.status === 410 || r.status === 429
  });

  if (status === 200 || status === 201) {
    // Nest answers 201 for a POST; the body is an empty ack.
    rsvpOk.add(1);
    rsvpWriteMs.add(response.timings.duration);
    rsvpErrors.add(false);
    return;
  }
  if (status === 429) {
    rsvpThrottled.add(1);
    rsvpErrors.add(false);
    return;
  }
  if (status === 403) {
    rsvpRefused.add(1);
    if (errorCode(response) === 'rsvp_limit_reached') rsvpLimitReached.add(1);
    rsvpErrors.add(false);
    return;
  }
  if (status === 410) {
    // An ended invitation accepts nothing: the run is measuring the wrong thing.
    rsvpEnded.add(1);
    rsvpErrors.add(true);
    logUnexpected('rsvp 410', response);
    return;
  }
  rsvpErrors.add(true);
  logUnexpected('rsvp unexpected', response);
}

export function teardown(data) {
  console.log(`RSVP burst window: ${data.startedAt} → ${new Date().toISOString()}`);
  console.log('Count what was written during the window with:');
  console.log("  select count(*) from public.rsvps where created_at >= '<startedAt>';");
}
