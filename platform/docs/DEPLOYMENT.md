# Production Deployment Runbook

This guide contains the exact, copy-pasteable steps to deploy the Invitation Platform from scratch.

## a. Overview

The platform consists of three main pieces:
```text
┌─────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
│ Vercel          │      │ Contabo VPS + Coolify   │      │ Supabase               │
│                 │      │                         │      │                        │
│ Next.js Web App │ ───► │ NestJS API (`apps/api`) │ ───► │ PostgreSQL Database    │
│ (`apps/web`)    │      │ Dockerized              │      │ + Supabase Auth        │
└─────────────────┘      └─────────────────────────┘      └────────────────────────┘
```
- **Web App**: Next.js 15 hosted on Vercel. Connects to the API.
- **API**: NestJS backend, containerized via Docker, hosted on a Contabo VPS using Coolify (a free deployment panel). Optional Cloudflare proxies traffic to it. Optional Sentry for error tracking.
- **Database & Auth**: Supabase handles PostgreSQL, user accounts, and OTPs.

---

## b. Accounts and Costs Checklist

You will need the following accounts for a first launch with **manual** payments:

| Service | Purpose | Estimated Cost | Required for Launch? |
|---|---|---|---|
| **Supabase** | Database, Auth (Google/Email OTP) | Free tier initially (Pro $25/mo recommended later for backups) | **Yes** |
| **Google Cloud** | OAuth client for Google Sign-in | Free | **Yes** |
| **Contabo** | VPS hosting the API and Coolify | ~€4.50/mo (Cloud VPS 10) | **Yes** |
| **Vercel** | Web App hosting | Free tier | **Yes** |
| **Domain Registrar** | Your custom domain | ~$10-15/year | **Yes** |
| **Cloudflare** | DNS management, API proxy | Free | **Yes** (or use Registrar DNS) |
| **GitHub** | Source code hosting | Free | **Yes** |
| **Sentry** | Error tracking | Free tier | Optional |
| **Resend** | Reliable email OTP delivery | Free tier / cheap | Optional (Supabase has a basic built-in SMTP) |

---

## c. Supabase Project Setup

1. **Create Project**: Go to Supabase, create a new project in the **EU region** (to be close to Contabo Germany).
2. **Get Credentials**: Go to **Project Settings > API**. Note down:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key
   - `JWT Secret` (in API > JWT Settings) or JWKS URL.
3. **Apply Database Migrations**:
   Run the following from your local terminal (ensure you have the Supabase CLI installed):
   ```bash
   supabase link --project-ref <YOUR_PROJECT_REF>
   supabase db push
   ```
   *Alternative without CLI:* Use the Supabase SQL Editor and run `platform/supabase/migrations/0001_core.sql` through `0014_admin_points_guard.sql` in strict numeric order.
4. **Auth Settings**:
   - Go to **Authentication > URL Configuration**.
   - Set **Site URL** to your web domain (e.g., `https://yourdomain.com`).
   - Add **Redirect URLs**: Must include `https://yourdomain.com/auth/callback` (and `http://localhost:3000/auth/callback` for local testing).
5. **Email Provider**:
   - Go to **Authentication > Providers > Email**.
   - Enable Email provider, and enable **Confirm email**.
   - Go to **Authentication > Email Templates > Confirm signup**.
   - Ensure the template includes the 6-digit code placeholder: `{{ .Token }}`.
6. **Rate Limits**:
   - Go to **Authentication > Rate Limits**. Adjust email and OTP rate limits to prevent abuse (e.g., 30 emails per hour).
7. **Verify Profile Trigger**:
   - Do a test sign-up. Go to the Table Editor and verify that migration `0013`'s trigger automatically created a row in the `profiles` table matching the new `auth.users` row.

---

## d. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project or select an existing one.
3. Go to **APIs & Services > OAuth consent screen** and configure it (External, fill in app name, etc.).
4. Go to **Credentials > Create Credentials > OAuth client ID**.
5. Select **Web application** as the Application type.
6. Add your Supabase callback URL to **Authorized redirect URIs**: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`.
7. Copy the **Client ID** and **Client Secret**.
8. Go back to **Supabase > Authentication > Providers > Google**, enable it, and paste the ID and Secret.

---

## e. First Admin Setup

`profiles_guard` blocks client-side role changes for security. To make yourself an admin, you must use the Supabase SQL Editor (or `service_role` key).

1. Sign in to the web app once to create your account and profile.
2. Go to the **Supabase SQL Editor** and run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your.email@example.com';
   ```
3. **Verify**: Open `https://api.yourdomain.com/v1/me` (or check the web app payload). You should see `"role": "admin"`.

---

## f. API Deployment on Contabo + Coolify

1. **Server Prep**:
   - Deploy a Contabo VPS with **Ubuntu 24.04**.
   - Add your SSH key.
   - Configure a basic firewall allowing ports 22 (SSH), 80 (HTTP), 443 (HTTPS).
2. **Install Coolify**:
   - SSH into the server as `root` and run the Coolify install script:
     ```bash
     curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
     ```
   - Open `http://<YOUR_SERVER_IP>:8000` and finish the setup.
3. **Create the API App**:
   - Connect your GitHub repository in Coolify.
   - Add a new Application based on a **Dockerfile**.
   - **Build Context**: `/platform` (Must be `platform`, NOT `platform/apps/api`, because it relies on the monorepo root `package-lock.json` and workspaces).
   - **Dockerfile Location**: `/platform/apps/api/Dockerfile`
   - **Port**: `3001`
   - **Health Check Path**: `/v1/health`
   - **Restart Policy**: `Always`
4. **Environment Variables** (`env.schema.ts`):

| Variable | Required? | Example | Notes |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Enables production checks. |
| `PORT` | No | `3001` | Defaults to 3001. Matches the exposed Docker port. |
| `WEB_ORIGINS` | Yes | `https://yourdomain.com` | Comma-separated CORS allowed origins. |
| `SUPABASE_URL` | Yes | `https://xyz.supabase.co` | From Supabase API settings. |
| `SUPABASE_ANON_KEY` | Yes | `eyJhbG...` | From Supabase API settings. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbG...` | From Supabase API settings. Keep this secret! |
| `SUPABASE_TIMEOUT_MS` | No | `5000` | Hard timeout for Supabase calls to avoid hanging. |
| `SUPABASE_JWT_SECRET` | No | `your-jwt-secret` | Optional. If set, verifies JWT locally (faster). |
| `PAYMENTS_PROVIDER` | No | `manual` | **Must be `manual` in prod**. `mock` is strictly refused in prod environments. |
| `MANUAL_PAYMENT_INSTRUCTIONS_JSON` | No | `{"methods":[{"id":"instapay","label":{"ar":"انستاباي","en":"InstaPay"},"details":{"ar":"010...","en":"010..."}}]}` | AR/EN details for customers. |
| `IP_HASH_SECRET` | Yes | `a-very-long-random-string-min-32-chars` | Min 32 chars. Used to safely hash guest IPs for rate limits. |
| `WEB_REVALIDATE_URL` | No | `https://yourdomain.com/api/revalidate` | Next.js webhook to clear caches on publish. |
| `REVALIDATE_SECRET` | Required if WEB_REVALIDATE_URL set | `another-long-random-string-min-32-chars` | Min 32 chars. Must match Vercel's `REVALIDATE_SECRET`. |
| `LIFECYCLE_CRON_ENABLED` | No | `true` | **CRITICAL**: If you scale to 2+ API instances, set to `true` on EXACTLY ONE instance, and `false` on the others to avoid duplicate daily jobs. |
| `THROTTLE_TTL_MS` | No | `60000` | Rate limiting window. |
| `THROTTLE_LIMIT` | No | `100` | Rate limiting max requests per window. |
| `SENTRY_DSN` | No | `https://...` | Error tracking. |
| `SWAGGER_ENABLED` | No | `false` | Disable API docs in prod. |

---

## g. Web Deployment on Vercel

1. Create a new Project in Vercel and link your GitHub repo.
2. **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `platform/apps/web`
   - *Note*: Vercel automatically detects npm workspaces. `next.config.ts` uses `transpilePackages: ['@platform/shared', '@platform/api-client']`, meaning Next.js compiles the shared packages directly without needing a separate build step for them.
3. **Environment Variables**:
   - `NEXT_PUBLIC_SITE_URL`: `https://yourdomain.com`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://xyz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbG...`
   - `COMMERCE_MODE`: `api`
   - `GUEST_MODE`: `api`
   - `API_BASE_URL`: `https://api.yourdomain.com` (No trailing slash)
   - `REVALIDATE_SECRET`: Same value as the API's `REVALIDATE_SECRET`.
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`: E.g., `2010...` (For support/contact).
4. Deploy the app.
5. Set up your custom domain in **Settings > Domains**.

---

## h. DNS / Cloudflare

1. Point your domain's nameservers to Cloudflare (optional but recommended for protection).
2. **Web**: Add a CNAME for `@` (or `www`) pointing to Vercel's DNS (`cname.vercel-dns.com`). Disable the Cloudflare orange proxy cloud for Vercel, let Vercel handle SSL.
3. **API**: Add an A record for `api.yourdomain.com` pointing to your Contabo server's IP. Enable the Cloudflare orange proxy cloud to protect the API.
4. CORS is handled by the `WEB_ORIGINS` env var on the API.

---

## i. Smoke Test Checklist

Test the live system in this order:
1. [ ] **API health**: Visit `https://api.yourdomain.com/v1/health` -> Expect `{ "status": "ok", ... }`.
2. [ ] **Web loads**: Visit `https://yourdomain.com` in AR and EN. Expect pages to load without errors.
3. [ ] **Google sign-in**: Click sign in with Google -> Expect successful redirect to the dashboard.
4. [ ] **Email OTP sign-in**: Sign out, enter email, receive 6-digit code, enter it -> Expect successful sign-in.
5. [ ] **Create checkout (Manual)**: Pick a template, go to checkout. Expect instructions for InstaPay/bank to appear and a reference like `INV-XXXXXX`.
6. [ ] **Admin pending payments**: Sign in as the admin, query `GET /v1/admin/payments/pending` (using your admin token). Expect to see the order.
7. [ ] **Confirm payment**: Use the admin tools to confirm the payment.
8. [ ] **Entitlement creation**: Check the customer account dashboard. Expect to see the template unlocked with available edits.
9. [ ] **Publish**: Edit the invitation and hit Publish. Expect success.
10. [ ] **Revalidation webhook**: Visit the public invitation URL `https://yourdomain.com/[slug]`. Re-edit, re-publish, and refresh the public page. Expect the new changes to show immediately (proving `WEB_REVALIDATE_URL` works).
11. [ ] **RSVP**: Open the public page in an incognito window and submit an RSVP.
12. [ ] **Owner sees RSVP**: The owner should see the RSVP in their dashboard.
13. [ ] **Daily job**: Wait until 03:00 Cairo time (or test locally). Expect a log line from the `lifecycle` cron job.

---

## j. Operations

- **Backups**: If you upgrade to Supabase Pro, daily backups and Point-in-Time Recovery are automatic. For the free tier, you must run manual backups using `pg_dump`:
  ```bash
  pg_dump postgresql://postgres:postgres@db.xyz.supabase.co:5432/postgres > backup.sql
  ```
- **Secret Rotation**: If a key leaks, rotate it in the Supabase Dashboard, update Vercel/Coolify env variables, and redeploy.
- **Updating**: Simply `git push` to `main`. Vercel automatically deploys the web app. Coolify can be configured to auto-deploy the API on webhooks, or you can click "Deploy" manually in the Coolify panel.
- **Logs**: API logs are in the Coolify dashboard under the Application's "Logs" tab. Web logs are in Vercel.
- **Adding Fawry/WhatsApp later**: 
  - Fawry: Setup Merchant account, change `PAYMENTS_PROVIDER=fawry` in API.
  - WhatsApp: Once Meta verification is done, hook up Supabase Auth custom SMS sender to call your API webhook for OTPs, and use the `NotificationsModule` for event messages.

---

## k. Known Gaps Before Real Money

Based on the current backend plan, the following are expected limitations if you launch today:
- **Notifications**: `NotificationsPort` currently only logs; no real WhatsApp/Email notifications are sent on actions.
- **Fawry**: Online Fawry payments are not implemented yet. You rely completely on `manual` approval flows.
- **Admin Screens**: Admin dashboards have API routes but lack a complete UI; you may need to use Postman or raw API calls for `mark_paid` until the UI is built.
- **e2e Tests**: Playwright end-to-end tests are configured against mock data, not yet against a fully live staging project.
