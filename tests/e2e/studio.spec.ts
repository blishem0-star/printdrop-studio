import { test, expect } from '@playwright/test';

// The design studio is the core of the product — verify its critical tools end to end.

async function openStudioWithText(page: import('@playwright/test').Page) {
  await page.goto('/design');
  await page.locator('.studio-rail button', { hasText: 'Text' }).first().click();
  await page.locator('input[placeholder="Type your text..."]').fill('STYLX');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Layers (1)')).toBeVisible();
}

test('add a text layer to the canvas', async ({ page }) => {
  await openStudioWithText(page);
  const textNodes = await page.locator('div[role="img"] svg g[transform] text').count();
  expect(textNodes).toBeGreaterThanOrEqual(1);
});

test('Holo style preset applies a gradient fill', async ({ page }) => {
  await openStudioWithText(page);
  await page.locator('button', { hasText: 'Holo' }).first().click();
  await expect(page.locator('div[role="img"] svg text[fill^="url(#lg-"]').first()).toBeVisible();
});

test('vector shapes render as real SVG geometry', async ({ page }) => {
  await page.goto('/design');
  await page.locator('.studio-rail button', { hasText: 'Shapes' }).first().click();
  await page.locator('button[title="Star"]').first().click();
  await expect(page.locator('div[role="img"] svg g[transform] polygon').first()).toBeVisible();
});

test('undo removes and redo restores a layer', async ({ page }) => {
  await openStudioWithText(page);
  await page.locator('button[title="Undo (Ctrl+Z)"]').click();
  await expect(page.getByText('Layers (1)')).toHaveCount(0);
  await page.locator('button[title="Redo (Ctrl+Y)"]').click();
  await expect(page.getByText('Layers (1)')).toBeVisible();
});

test('My Designs save then load round-trips after reload', async ({ page }) => {
  await openStudioWithText(page);
  await page.locator('.studio-rail button', { hasText: 'Templates' }).first().click();
  await page.locator('button', { hasText: 'Save current' }).click();
  await expect(page.locator('button', { hasText: 'Load' }).first()).toBeVisible();

  await page.reload();
  await page.locator('.studio-rail button', { hasText: 'Templates' }).first().click();
  await page.locator('button', { hasText: 'Load' }).first().click();
  // The Layers list only shows under the Text tool — assert on the canvas itself instead
  await expect(page.locator('div[role="img"] svg g[transform] text').first()).toBeVisible();
});

test('PNG export triggers a download', async ({ page }) => {
  await openStudioWithText(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('button[title="Download PNG preview"]').click(),
  ]);
  expect(download.suggestedFilename()).toBe('stylx-design.png');
});
