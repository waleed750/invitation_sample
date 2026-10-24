import {expect, test} from '@playwright/test';

// T12: a signed-in customer uploads a photo, sees it served, is told off for a fake file, and deletes it.
test.use({storageState: '.auth/customer.json'});

// 1x1 transparent PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

test('upload, view, reject a fake file, delete', async ({page}) => {
  await page.goto('/ar/app/media');
  const tiles = page.getByTestId('media-tile');
  const before = await tiles.count();

  await page.locator('#media-file').setInputFiles({name: 'صورة.png', mimeType: 'image/png', buffer: PNG});
  await expect(tiles).toHaveCount(before + 1);
  const image = tiles.first().locator('img');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);

  // An executable renamed .jpg is refused with a readable Arabic message and adds nothing.
  await page.locator('#media-file').setInputFiles({name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(3000, 1)])});
  await expect(page.locator('.media-error')).toContainText('غير مدعوم');
  await expect(tiles).toHaveCount(before + 1);

  await tiles.first().getByRole('button', {name: /حذف/}).click();
  await tiles.first().getByRole('button', {name: 'نعم، احذفوه'}).click();
  await expect(tiles).toHaveCount(before);
});
