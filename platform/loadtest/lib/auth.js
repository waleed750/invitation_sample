/* global __ENV */
/**
 * Email-code sign-in for the k6 scripts (the only sign-in the product has).
 *
 * Flow, exactly as the web form does it (`apps/web/src/auth/SignInForm.tsx`):
 *   1. POST /v1/auth/email-otp/send-verification-otp  {email, type:'sign-in'}
 *   2. read the 6 digits — only possible when the API runs with
 *      E2E_CAPTURE_EMAILS=1, which exposes GET /v1/__e2e/last-code?email=…
 *      (the endpoint does not exist otherwise; never enabled in production)
 *   3. POST /v1/auth/sign-in/email-otp  {email, otp}
 *
 * The session comes back as an httpOnly cookie and, thanks to the Better Auth
 * bearer plugin, as a token. We keep both: the bearer token is preferred
 * because it survives k6's per-VU cookie jar and per-request X-Forwarded-For.
 *
 * Sign-in happens once per user in `setup()`, never inside the load loop
 * (OTP requests are cheap but pointless to include in the measured traffic).
 */

import http from 'k6/http';
import {env} from './env.js';

/** Case-insensitive response-header lookup (k6 canonicalises header names). */
function header(response, name) {
  const headers = response.headers || {};
  const wanted = String(name).toLowerCase();
  for (const key in headers) {
    if (key.toLowerCase() === wanted) return headers[key];
  }
  return null;
}

/** `a=1; b=2` from every cookie k6 kept for that response. */
function cookieHeader(response) {
  const jar = response.cookies || {};
  const parts = [];
  for (const name in jar) {
    const entries = jar[name] || [];
    for (const entry of entries) parts.push(`${entry.name}=${entry.value}`);
  }
  return parts.length === 0 ? null : parts.join('; ');
}

function expect(response, what) {
  if (response.status !== 200) {
    throw new Error(
      `${what} answered ${response.status}: ${String(response.body).slice(0, 200)}`
    );
  }
}

/**
 * Signs in one address and returns `{email, token, cookie}`.
 * Throws with an actionable message when the stack is not set up for it.
 */
export function signIn(email) {
  const json = {'Content-Type': 'application/json', Accept: 'application/json'};

  const sent = http.post(
    `${env.apiUrl}/v1/auth/email-otp/send-verification-otp`,
    JSON.stringify({email, type: 'sign-in'}),
    {headers: json, tags: {endpoint: 'auth'}}
  );
  expect(sent, `send-verification-otp for ${email}`);

  const codeResponse = http.get(
    `${env.apiUrl}/v1/__e2e/last-code?email=${encodeURIComponent(email)}`,
    {headers: {Accept: 'application/json'}, tags: {endpoint: 'auth'}}
  );
  if (codeResponse.status === 404) {
    throw new Error(
      'cannot read the sign-in code: start the API with E2E_CAPTURE_EMAILS=1 ' +
        '(the /v1/__e2e/last-code endpoint is only mounted then)'
    );
  }
  expect(codeResponse, `last-code for ${email}`);
  const code = codeResponse.json('code');
  if (typeof code !== 'string' || code === '') throw new Error(`last-code for ${email} returned no code`);

  const signedIn = http.post(
    `${env.apiUrl}/v1/auth/sign-in/email-otp`,
    JSON.stringify({email, otp: code}),
    {headers: json, tags: {endpoint: 'auth'}}
  );
  expect(signedIn, `sign-in/email-otp for ${email}`);

  const token = header(signedIn, 'set-auth-token');
  const cookie = cookieHeader(signedIn);
  if ((token === null || token === '') && (cookie === null || cookie === '')) {
    throw new Error(`sign-in for ${email} returned neither a bearer token nor a session cookie`);
  }

  return {
    email,
    token: token === null || token === '' ? null : token,
    cookie
  };
}

/** Headers for an authenticated request: bearer token, else the session cookie. */
export function authHeaders(session, extra) {
  const headers = {'Content-Type': 'application/json', Accept: 'application/json'};
  for (const key in extra || {}) headers[key] = extra[key];
  if (session && session.token) headers.Authorization = `Bearer ${session.token}`;
  else if (session && session.cookie) headers.Cookie = session.cookie;
  return headers;
}

/** `loadtest-1@example.test` … — throw-away customers used by the checkout scenario. */
export function loadTestEmail(index) {
  return `loadtest-${index}@example.test`;
}
