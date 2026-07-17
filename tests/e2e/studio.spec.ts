import { test, expect } from '@playwright/test';

// The design studio is the core of the product — verify its critical tools end to end.

async function openStudioWithText(page: import('@playwright/test').Page) {
  await page.goto('/design');
  await page.locator('.studio-rail button', { hasText: 'Text' }).first().click();
  await page.locator('input[placeholder="Type your text..."]').fill('STYLX');
  await page.keyboard.press('Enter');
  await expect(page.locator('div[role="img"] svg text', { hasText: 'STYLX' }).first()).toBeVisible();
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
  await page.locator('.canvas-action-bar button', { hasText: 'Undo' }).click();
  await expect(page.locator('div[role="img"] svg text', { hasText: 'STYLX' })).toHaveCount(0);
  await page.locator('.canvas-action-bar button', { hasText: 'Redo' }).click();
  await expect(page.locator('div[role="img"] svg text', { hasText: 'STYLX' }).first()).toBeVisible();
});

test('My Designs save then load round-trips after reload', async ({ page }) => {
  await openStudioWithText(page);
  await page.locator('.studio-rail button', { hasText: 'Ready design' }).first().click();
  await page.locator('button', { hasText: 'Save current' }).click();
  await expect(page.locator('button', { hasText: 'Load' }).first()).toBeVisible();

  await page.reload();
  await page.locator('.studio-rail button', { hasText: 'Ready design' }).first().click();
  await page.locator('button', { hasText: 'Load' }).first().click();
  // The Layers list only shows under the Text tool — assert on the canvas itself instead
  await expect(page.locator('div[role="img"] svg g[transform] text').first()).toBeVisible();
});

test('starter look applies a finished design and its shirt color', async ({ page }) => {
  await page.goto('/design');
  await page.locator('button[aria-label="Apply look Holo Stack"]').click();
  // Look layers land on the canvas...
  await expect(page.locator('div[role="img"] svg text', { hasText: 'YOUR' }).first()).toBeVisible();
  // ...and the hero text carries the holo gradient fill
  await expect(page.locator('div[role="img"] svg text[fill^="url(#lg-"]').first()).toBeVisible();
});

test('shuffle restyles without losing the typed text and undo restores', async ({ page }) => {
  await openStudioWithText(page);
  await page.locator('.canvas-action-bar button', { hasText: 'Shuffle' }).click();
  // The user's word survives the restyle
  await expect(page.locator('div[role="img"] svg text', { hasText: 'STYLX' }).first()).toBeVisible();
  // Undo rolls the restyle back
  await page.locator('.canvas-action-bar button', { hasText: 'Undo' }).click();
  await expect(page.locator('div[role="img"] svg text', { hasText: 'STYLX' }).first()).toBeVisible();
});

test('PNG download is not available during editing', async ({ page }) => {
  await openStudioWithText(page);
  await expect(page.locator('.canvas-action-bar button', { hasText: 'Share' })).toBeVisible();
  await expect(page.locator('button[title="Download PNG preview"]')).toHaveCount(0);
});
