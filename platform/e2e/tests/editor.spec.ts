import {expect, test, type Page} from '@playwright/test';
import {SEED, signIn} from './../helpers';

const VIEWPORTS = [{name: 'phone', width: 390, height: 844}, {name: 'tablet', width: 768, height: 1024}, {name: 'desktop', width: 1280, height: 900}];

/** Opens the editor of the seeded customer's first draft, with the first-run tips dismissed. */
async function openEditor(page: Page): Promise<void> {
  await signIn(page, SEED.customer, '/ar/app');
  const editLink = page.locator('a[href*="/app/invitations/"][href$="/edit"]').first();
  await expect(editLink, 'a dashboard invitation edit link').toBeVisible();
  await editLink.click();
  await page.waitForURL(/\/app\/invitations\/[^/]+\/edit/);
  await expect(page.getByTestId('save-status')).toBeVisible();

  // Dismiss first-run onboarding tips if shown.
  const onboarding = page.getByTestId('onboarding');
  const skip = page.getByRole('button', {name: 'تخطي'}).or(page.getByTestId('onboarding-skip'));
  const isAlreadyOnboarded = await page.evaluate(() => {
    try {
      return window.localStorage.getItem('editor.onboarded') === '1';
    } catch {
      return false;
    }
  });
  if (!isAlreadyOnboarded) {
    await expect(skip).toBeVisible({timeout: 10_000});
    await skip.click();
  } else if (await skip.isVisible()) {
    await skip.click();
  }
  await expect(onboarding).toBeHidden({timeout: 10_000});
}

async function noHorizontalScroll(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

for (const vp of VIEWPORTS) {
  test(`editor works at ${vp.width}px`, async ({page}) => {
    await page.setViewportSize({width: vp.width, height: vp.height});
    await openEditor(page);
    await noHorizontalScroll(page);

    // The live preview renders the real invitation inside the frame.
    await expect(page.locator('iframe').first()).toHaveCount(1);
    const frame = page.frameLocator('iframe').first();
    await expect(frame.locator('.invitation-content > *').first()).toBeAttached({timeout: 30_000});
    // The preview shows the invitation itself, not the guest's tap-to-open gate.
    await expect(frame.locator('.open-experience')).toHaveCount(0);

    await page.getByTestId('mode-advanced').click();
    // Phones switch between the preview and the section list with tabs; wider screens show both.
    if (vp.width < 700) await page.locator('.ed-tabs button').nth(1).click();
    else await expect(page.locator('.ed-tabs')).toBeHidden();
    await expect(page.getByTestId('add-section')).toBeVisible();
    await noHorizontalScroll(page);

    // Add a section.
    const rows = page.getByTestId('outline-row');
    const idsBefore = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-section-id')));
    const before = idsBefore.length;
    await page.getByTestId('add-section').click();
    await page.locator('[data-testid=add-option]:not([disabled])').first().click();
    await expect(rows).toHaveCount(before + 1);
    const added = (await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-section-id')))).find((id) => !idsBefore.includes(id));
    expect(added).toBeTruthy();

    // Keyboard reorder: Alt+ArrowUp moves the focused row.
    if (before + 1 >= 2) {
      const last = rows.last();
      const type = await last.getAttribute('data-section-id');
      await last.focus();
      await page.keyboard.press('Alt+ArrowUp');
      await expect(rows.nth(await rows.count() - 2)).toHaveAttribute('data-section-id', type ?? '');
    }

    // Undo takes the move back.
    await page.getByTestId('undo').click();

    // Theme preset (on phones the section form is a sheet over the list; close it first).
    const sheetClose = page.locator('.ed-sheet-close');
    if (await sheetClose.isVisible()) await sheetClose.click();
    await page.getByTestId('open-theme').click();
    await expect(page.getByTestId('inspector')).toBeVisible();

    // Device switch changes the preview width.
    if (vp.width >= 1000) {
      await page.getByTestId('device-mobile').click();
      await expect(page.getByTestId('preview-box')).toHaveAttribute('data-width', '390');
      await page.getByTestId('device-desktop').click();
      await expect(page.getByTestId('preview-box')).toHaveAttribute('data-width', '1280');
    }
    await noHorizontalScroll(page);
    await page.screenshot({path: `test-results/editor-${vp.name}.png`});

    // Leave the draft as we found it: remove the section this run added (asks for confirmation first).
    if (await sheetClose.isVisible()) await sheetClose.click();
    const mine = page.locator(`[data-section-id="${added ?? ''}"]`);
    await mine.getByRole('button', {name: 'حذف'}).click();
    await mine.locator('.is-danger').click();
    await expect(rows).toHaveCount(before);
    await expect(page.getByTestId('save-status')).toHaveAttribute('data-status', 'saved', {timeout: 20_000});
  });
}

test('typing an Arabic name autosaves and shows in the preview', async ({page}) => {
  await openEditor(page);
  const first = page.locator('input').first();
  const name = `هدى${Date.now() % 1000}`;
  await first.fill(name);
  await expect(page.getByTestId('save-status')).toHaveAttribute('data-status', 'saved', {timeout: 20_000});
  await page.reload();
  const skip = page.getByRole('button', {name: 'تخطي'}).or(page.getByTestId('onboarding-skip'));
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.getByTestId('onboarding')).toBeHidden({timeout: 10_000});
  await expect(page.locator('input').first()).toHaveValue(name);
});
