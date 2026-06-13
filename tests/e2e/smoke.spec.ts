import { test, expect } from '@playwright/test';

// Core public surfaces render without breakage or console errors.

test('landing renders with fonts and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/');
  await expect(page.getByText('AI-POWERED FASHION TECH')).toBeVisible();
  const bebasLoaded = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('20px "Bebas Neue"'); });
  expect(bebasLoaded).toBe(true);
  expect(errors).toEqual([]);
});

test('catalog loads and search filters', async ({ page }) => {
  // The catalog requires a (guest) session — seed one like the "Browse as guest" flow does
  await page.addInitScript(() => localStorage.setItem('pd_session', JSON.stringify({ type: 'guest', name: 'Guest' })));
  await page.goto('/catalog');
  await page.locator('input[type="search"]').fill('mountain');
  await expect(page.getByText('Mountain Peaks').first()).toBeVisible();
});

test('product page renders with Product JSON-LD', async ({ page }) => {
  await page.goto('/catalog/mountain-geo');
  await expect(page.locator('h1', { hasText: 'Mountain Peaks' })).toBeVisible();
  const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(lds.some(t => t.includes('"@type":"Product"'))).toBe(true);
});

test('unknown artist design is 404', async ({ request }) => {
  const res = await request.get('/catalog/artist-does-not-exist');
  expect(res.status()).toBe(404);
});

test('order tracking shows the guest email gate', async ({ page }) => {
  await page.goto('/orders/unknown-order-id');
  await expect(page.locator('form input[name="email"]')).toBeVisible();
});

test('admin redirects a non-owner away', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/\/admin/);
});

test('health endpoint reports ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).status).toBe('ok');
});
