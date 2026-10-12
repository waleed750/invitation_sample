# End-to-End (E2E) Smoke Testing

Automated smoke testing suite for the real self-hosted stack using Playwright (Chromium only).

The smoke test (`smoke.spec.ts`) covers the entire user journey:
1. **Sign in with email OTP code** (reads code via test-only capture route).
2. **Open template gallery** (`/ar/templates`).
3. **Start checkout for a live template** (`/ar/checkout/mashrabiya`) with manual payment.
4. **See payment reference** on the pay page (`/ar/checkout/pay/[orderId]`).
5. **Promote user to admin via SQL** (`UPDATE public.profiles SET role = 'admin' WHERE email = ...`).
6. **Admin confirms the payment** in the admin UI (`/ar/admin/payments`).
7. **Invitation shows as paid/entitled** in the customer dashboard (`/ar/app`).
8. **Publish the invitation** (`/ar/app/invitations/[id]`).
9. **Open public invitation page and submit an RSVP** (`/ar/i/[slug]`).
10. **Owner sees the RSVP** in the guest list (`/ar/app/invitations/[id]/guests`).

---

## Running Locally

### 1. Prerequisites
- Docker (or local PostgreSQL 17 running on port 5432).
- Node.js 22+.
- Playwright Chromium browser installed:
  ```bash
  npx playwright install chromium
  ```

### 2. Start PostgreSQL & Apply Migrations
If running Postgres via Docker:
```bash
docker run --name postgres-e2e -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17
```

Apply migrations and set the `app_api` role password:
```bash
cd platform

# Apply migrations
DATABASE_URL_ADMIN='postgresql://postgres:postgres@127.0.0.1:5432/postgres' \
  bash scripts/db-apply.sh

# Set the password for app_api role
psql "postgresql://postgres:postgres@127.0.0.1:5432/postgres" \
  -c "ALTER ROLE app_api WITH PASSWORD 'test_api_password';"
```

### 3. Build & Start the API and Web Servers

**Terminal 1 — API Server (`dist/main.js`):**
```bash
cd platform
npm run build:api

PORT=3001 \
NODE_ENV=test \
E2E_CAPTURE_EMAILS=1 \
WEB_ORIGINS=http://localhost:3000 \
DATABASE_URL=postgresql://app_api:test_api_password@127.0.0.1:5432/postgres \
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters-better-auth \
BETTER_AUTH_URL=http://localhost:3001 \
IP_HASH_SECRET=replace-with-another-32-random-characters \
PAYMENTS_PROVIDER=manual \
SMTP_HOST=localhost \
SMTP_PORT=1025 \
SMTP_USER=test \
SMTP_PASS=test \
SMTP_FROM=noreply@example.com \
node apps/api/dist/main.js
```

**Terminal 2 — Web Server (`next start`):**
```bash
cd platform
NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
npm run build --workspace @platform/web

NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
NEXT_PUBLIC_API_URL=http://localhost:3001 \
API_BASE_URL=http://localhost:3001 \
COMMERCE_MODE=api \
GUEST_MODE=api \
npm run start --workspace @platform/web
```

### 4. Run Playwright Smoke Test

**Terminal 3 — Run E2E Test:**
```bash
cd platform

DATABASE_URL_ADMIN='postgresql://postgres:postgres@127.0.0.1:5432/postgres' \
API_BASE_URL='http://localhost:3001' \
PLAYWRIGHT_BASE_URL='http://localhost:3000' \
npm run test:e2e
```

To run with Playwright UI inspector:
```bash
cd platform/e2e
npx playwright test --ui
```
