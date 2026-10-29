/* global __ENV, __VU, __ITER */
/**
 * T43 · Scenario 2 — public reads.
 *
 * Two arrival-rate scenarios run together, `PUBLIC_API_RPS + PUBLIC_WEB_RPS`
 * (default 250 + 250 = 500 requests/second, the number T43 asks for):
 *
 *   api_reads  GET /v1/public/invitations/:slug   JSON: invitation row + snapshot
 *   web_pages  GET /{locale}/i/:slug              Next.js server render
 *
 * Both are throttled per client IP (60/minute for the public read route). A
 * 500 rps run therefore needs `LOADTEST_SPREAD_IPS=1` and the API started with
 * `TRUST_PROXY=loopback`; without it you are measuring the limiter, and every
 * answer is a 429.
 *
 * IMPORTANT — the web page calls the API itself when `GUEST_MODE=api`, and Next
 * does not forward the guest's X-Forwarded-For: every page view arrives at the
 * API from the Next server's single IP, twice (generateMetadata + the page
 * body), so page views above ~30/minute exhaust the 60/min read limit and the
 * page starts answering 500. That is a finding, not a bug in this script — see
 * `loadtest/README.md` ("Expected findings") and record it in
 * `docs/LOAD_TEST_REPORT.md`. To measure the Next render alone, set
 * `PUBLIC_WEB_RPS=0` (or run the web app against a cached/demo public store).
 */

import http from 'k6/http';
import {check} from 'k6';
import {Rate, Trend} from 'k6/metrics';
import {
  apiPath,
  banner,
  browserHeaders,
  env,
  invitationApiPath,
  invitationWebPath,
  jsonHeaders,
  nonNegativeNumber,
  positiveNumber,
  webPath
} from './lib/env.js';

const apiRate = Math.round(nonNegativeNumber(__ENV.PUBLIC_API_RPS, 250));
const webRate = Math.round(nonNegativeNumber(__ENV.PUBLIC_WEB_RPS, 250));
const duration = __ENV.PUBLIC_DURATION || '60s';

/** Real failures only (5xx / connection errors); 429 is visible in `checks` and the counters. */
const apiReadErrors = new Rate('api_read_errors');
const webPageErrors = new Rate('web_page_errors');
const apiReadMs = new Trend('api_read_ms', true);
const webPageMs = new Trend('web_page_ms', true);

function buildScenarios() {
  const scenarios = {};
  if (apiRate > 0) {
    scenarios.api_reads = {
      executor: 'constant-arrival-rate',
      exec: 'apiRead',
      rate: apiRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: Math.round(positiveNumber(__ENV.PUBLIC_API_PRE_VUS, 50)),
      maxVUs: Math.round(positiveNumber(__ENV.PUBLIC_API_MAX_VUS, 200)),
      tags: {scenario: 'api_reads'}
    };
  }
  if (webRate > 0) {
    scenarios.web_pages = {
      executor: 'constant-arrival-rate',
      exec: 'webPage',
      rate: webRate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: Math.round(positiveNumber(__ENV.PUBLIC_WEB_PRE_VUS, 100)),
      maxVUs: Math.round(positiveNumber(__ENV.PUBLIC_WEB_MAX_VUS, 400)),
      tags: {scenario: 'web_pages'}
    };
  }
  if (apiRate === 0 && webRate === 0) {
    throw new Error('PUBLIC_API_RPS and PUBLIC_WEB_RPS are both 0; enable at least one scenario');
  }
  return scenarios;
}

function buildThresholds() {
  const thresholds = {
    // The SLO: under 1% real errors and a fast accepted read.
    checks: ['rate>0.99']
  };
  if (apiRate > 0) {
    thresholds.api_read_ms = ['p(95)<250', 'p(99)<800'];
    thresholds.api_read_errors = ['rate<0.01'];
    thresholds['http_req_duration{endpoint:api_read}'] = ['p(95)<250'];
  }
  if (webRate > 0) {
    // A full server render is slower than the JSON read; 1.5s p95 is the guest-facing budget.
    thresholds.web_page_ms = ['p(95)<1500', 'p(99)<3000'];
    thresholds.web_page_errors = ['rate<0.01'];
    thresholds['http_req_duration{endpoint:web_page}'] = ['p(95)<1500'];
  }
  return thresholds;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: buildThresholds(),
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  // The bodies are large HTML/JSON with nothing worth asserting on at 500 rps.
  discardResponseBodies: true
};

export function setup() {
  banner('T43 · public reads', {
    API: env.apiUrl,
    Web: env.webUrl,
    Invitation: env.slug,
    Load: `${apiRate}/s API read + ${webRate}/s web page = ${apiRate + webRate} req/s for ${duration}`
  });

  if (apiRate > 0) {
    const probe = http.get(apiPath(invitationApiPath()), {tags: {endpoint: 'probe'}});
    if (probe.status !== 200) {
      throw new Error(`GET ${invitationApiPath()} answered ${probe.status}; check SLUG and that the seed is loaded`);
    }
  }
  if (webRate > 0) {
    const page = http.get(webPath(invitationWebPath()), {tags: {endpoint: 'probe'}});
    if (page.status !== 200) {
      throw new Error(
        `GET ${invitationWebPath()} answered ${page.status}; check WEB_URL and that the web app is running ` +
          '(with GUEST_MODE=api it must be able to reach API_BASE_URL)'
      );
    }
  }
  return {startedAt: new Date().toISOString()};
}

/** JSON read of the published snapshot. */
export function apiRead() {
  const vu = __VU;
  const iteration = __ITER;
  const response = http.get(apiPath(invitationApiPath()), {
    headers: jsonHeaders(vu, iteration),
    tags: {endpoint: 'api_read'}
  });

  const contentType = String(response.headers['Content-Type'] || '');
  check(response, {
    'api read: 200 JSON': (r) => r.status === 200 && contentType.indexOf('json') !== -1
  });
  apiReadMs.add(response.timings.duration);
  apiReadErrors.add(response.status !== 200);
}

/** The server-rendered page a guest opens from a WhatsApp link. */
export function webPage() {
  const vu = __VU;
  const iteration = __ITER;
  const response = http.get(webPath(invitationWebPath()), {
    headers: browserHeaders(vu, iteration),
    tags: {endpoint: 'web_page'}
  });

  const contentType = String(response.headers['Content-Type'] || '');
  check(response, {
    'web page: 200 HTML': (r) => r.status === 200 && contentType.indexOf('text/html') !== -1
  });
  webPageMs.add(response.timings.duration);
  webPageErrors.add(response.status !== 200);
}

/** `k6 run public-reads.js` without scenarios (smoke) still does the API read. */
export default apiRead;

export function teardown(data) {
  console.log(`Public-read window: ${data.startedAt} → ${new Date().toISOString()}`);
}
