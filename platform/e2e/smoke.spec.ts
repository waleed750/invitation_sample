import {test, expect} from '@playwright/test';
import {Pool} from 'pg';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const DATABASE_URL_ADMIN = process.env.DATABASE_URL_ADMIN || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

async function fetchOtpWithRetry(email: string, maxAttempts = 15, delayMs = 1000): Promise<string> {
  const url = `${API_BASE_URL}/v1/test/otp?email=${encodeURIComponent(email)}`;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.code || data.otp)) {
          return data.code || data.otp;
        }
      }
    } catch {
      // server starting or network hiccup, retry
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Failed to capture OTP for ${email} from ${url} after ${maxAttempts} attempts`);
}

async function promoteUserToAdmin(email: string): Promise<void> {
  const pool = new Pool({connectionString: DATABASE_URL_ADMIN});
  try {
    const res = await pool.query("UPDATE public.profiles SET role = 'admin' WHERE email = $1", [email.toLowerCase().trim()]);
    if (res.rowCount === 0) {
      throw new Error(`No profile found for email ${email} to promote to admin`);
    }
  } finally {
    await pool.end();
  }
}

test.describe('Real Stack End-to-End Smoke Journey', () => {
  test('full invitation lifecycle from sign-in to rsvp', async ({page, context}) => {
    const timestamp = Date.now();
    const userEmail = `smoke-user-${timestamp}@example.com`;
    const partner1 = 'عبد الرحمن';
    const partner2 = 'نورهان';
    const guestName = `ضيف تجريبي ${timestamp}`;

    // -------------------------------------------------------------------------
    // 1. Sign in with email code (read via test-only capture)
    // -------------------------------------------------------------------------
    await page.goto('/ar/sign-in');
    await expect(page.locator('#signin-title')).toBeVisible();

    // Fill email and submit
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(userEmail);
    await page.locator('form.auth-step button[type="submit"]').click();

    // Form switches to OTP input
    const otpInput = page.locator('input[autoComplete="one-time-code"]');
    await expect(otpInput).toBeVisible();

    // Retrieve captured OTP from the test endpoint
    const otpCode = await fetchOtpWithRetry(userEmail);
    expect(otpCode).toMatch(/^\d{6}$/);

    // Fill OTP and verify
    await otpInput.fill(otpCode);
    await page.locator('form.signin-otp button[type="submit"]').click();

    // Wait until logged in (redirected to dashboard or home)
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), {timeout: 20_000});

    // -------------------------------------------------------------------------
    // 2. Open the template gallery
    // -------------------------------------------------------------------------
    await page.goto('/ar/templates');
    await expect(page.locator('#designs')).toBeVisible();

    // Locate a live template card
    const templateCards = page.locator('.hm-designs__card');
    await expect(templateCards.first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 3. Start checkout for a live template (manual payment)
    // -------------------------------------------------------------------------
    // Click "استخدم التصميم" / "Use"
    const useTemplateLink = templateCards.first().locator('a.hm-btn--primary');
    await useTemplateLink.click();
    await page.waitForURL(/\/checkout\//);

    // Step 1: Details
    await page.locator('[data-testid="partner1-input"]').fill(partner1);
    await page.locator('[data-testid="partner2-input"]').fill(partner2);
    await page.locator('[data-testid="event-date-input"]').fill('2026-11-20');
    await page.locator('[data-testid="step1-next-btn"]').click();

    // Step 2: Plan
    await expect(page.locator('[data-testid="step2-next-btn"]')).toBeVisible();
    await page.locator('[data-testid="step2-next-btn"]').click();

    // Step 3: Verify & Pay
    // The user was already signed in, so verified chip is visible and pay button is enabled
    await expect(page.locator('.verified-chip')).toBeVisible();
    const payBtn = page.locator('[data-testid="pay-cta-btn"]');
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    // -------------------------------------------------------------------------
    // 4. See the payment reference on the pay page
    // -------------------------------------------------------------------------
    await page.waitForURL(/\/checkout\/pay\//, {timeout: 20_000});
    const referenceElement = page.locator('[data-testid="manual-reference"]');
    await expect(referenceElement).toBeVisible();
    const paymentRef = (await referenceElement.innerText()).trim();
    expect(paymentRef.length).toBeGreaterThan(0);

    const currentUrl = page.url();
    const orderIdMatch = currentUrl.match(/\/checkout\/pay\/([^/?]+)/);
    expect(orderIdMatch).not.toBeNull();
    const orderId = orderIdMatch![1];

    // -------------------------------------------------------------------------
    // 5. Promote the user to admin via SQL
    // -------------------------------------------------------------------------
    await promoteUserToAdmin(userEmail);

    // -------------------------------------------------------------------------
    // 6. Admin confirms the payment in the admin UI
    // -------------------------------------------------------------------------
    await page.goto('/ar/admin/payments');
    await expect(page.locator('h1')).toContainText('المدفوعات المعلقة');

    // Find the pending payment for this order
    const confirmBtn = page.locator('[data-testid="admin-confirm-btn"]').first();
    await expect(confirmBtn).toBeVisible({timeout: 15_000});
    await confirmBtn.click();

    // Fill transaction reference and submit
    const txnInput = page.locator('[data-testid="admin-txn-ref-input"]');
    await expect(txnInput).toBeVisible();
    await txnInput.fill(`TXN-${timestamp}`);

    const submitConfirmBtn = page.locator('[data-testid="admin-confirm-submit-btn"]');
    await submitConfirmBtn.click();

    // Wait for confirmation
    await expect(page.getByText('تم تأكيد الدفع بنجاح')).toBeVisible({timeout: 15_000});

    // -------------------------------------------------------------------------
    // 7. The invitation shows as paid/entitled in the customer dashboard
    // -------------------------------------------------------------------------
    await page.goto('/ar/app');
    await expect(page.locator('.invitation-card').first()).toBeVisible({timeout: 15_000});

    // Open the invitation management page
    const manageLink = page.locator('a.btn-secondary[href*="/app/invitations/"]').first();
    await manageLink.click();
    await page.waitForURL(/\/app\/invitations\//);

    const invitationUrl = page.url();
    const invIdMatch = invitationUrl.match(/\/app\/invitations\/([^/?]+)/);
    expect(invIdMatch).not.toBeNull();
    const invitationId = invIdMatch![1];

    // -------------------------------------------------------------------------
    // 8. Publish the invitation
    // -------------------------------------------------------------------------
    const publishBtn = page.locator('[data-testid="publish-btn"]');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // After publish, status changes to published and share url is live
    await expect(page.locator('.status-badge--published')).toBeVisible({timeout: 15_000});

    // Read the public preview/share link
    const previewLink = page.locator('a[href*="/i/"]').first();
    const href = await previewLink.getAttribute('href');
    expect(href).not.toBeNull();

    // -------------------------------------------------------------------------
    // 9. Open the public invitation page and submit an RSVP
    // -------------------------------------------------------------------------
    // We can open it in the same browser context or a fresh page
    const guestPage = await context.newPage();
    await guestPage.goto(href!);

    // Locate RSVP section and choose attending: yes
    const rsvpSection = guestPage.locator('.rsvp-section');
    await expect(rsvpSection).toBeVisible();

    const yesRadio = guestPage.locator('input[type="radio"][name="attending"][value="yes"]');
    await yesRadio.check({force: true});

    const nameInput = guestPage.locator('input[name="fullName"]');
    await nameInput.fill(guestName);

    const submitRsvpBtn = guestPage.locator('[data-testid="rsvp-submit-btn"]');
    await submitRsvpBtn.click();

    // Expect thank you card
    await expect(guestPage.locator('.rsvp-thanks')).toBeVisible({timeout: 15_000});
    await guestPage.close();

    // -------------------------------------------------------------------------
    // 10. Owner sees the RSVP in the guest list
    // -------------------------------------------------------------------------
    await page.goto(`/ar/app/invitations/${invitationId}/guests`);
    await expect(page.locator('[data-testid="guest-list-table"]')).toBeVisible({timeout: 15_000});

    // Verify guest row with submitted name is visible
    const guestRow = page.locator('[data-testid="guest-row"]').filter({hasText: guestName});
    await expect(guestRow).toBeVisible();
  });
});
