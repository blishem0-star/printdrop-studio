import { test, expect } from '@playwright/test';

// Regression: a logged-in user's /profile must render without a runtime crash.
// (Previously threw "Cannot read properties of undefined (reading 'orders')"
//  when the profile fetch returned an error body instead of a profile.)

test('authenticated profile page renders without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));

  const email = `prof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  const password = 'profile-pass-123';
  // Unique source IP so per-IP rate limits stay isolated from other tests
  const headers = { 'x-forwarded-for': `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` };

  // register + login through the page's request context so the session cookie is stored
  const reg = await page.request.post('/api/auth/register', { data: { name: 'Profile Bot', email, password }, headers });
  expect(reg.status()).toBe(201);
  const login = await page.request.post('/api/auth/login', { data: { email, password }, headers });
  expect(login.status()).toBe(200);
  const u = await login.json();

  // seed the UI-only localStorage hint like the real login page does
  await page.addInitScript((user) => {
    localStorage.setItem('pd_session', JSON.stringify({ type: 'user', customerId: user.id, name: user.name, email: user.email, role: user.role }));
  }, u);

  await page.goto('/profile');
  await expect(page.getByText('Profile Bot').first()).toBeVisible();
  await expect(page.getByText(/Orders?/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('a stale session hint with no cookie self-heals to login (no crash/loop)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));

  // localStorage says "logged in" but there is no valid session cookie
  await page.addInitScript(() => localStorage.setItem('pd_session', JSON.stringify({ type: 'user', customerId: 'ghost-id', name: 'Ghost', email: 'ghost@test.local', role: 'USER' })));

  await page.goto('/profile');
  // Bounced off the gated page; the stale hint is cleared so it lands on the login screen
  await expect(page).not.toHaveURL(/\/profile/);
  const hint = await page.evaluate(() => localStorage.getItem('pd_session'));
  expect(hint).toBeNull();
  expect(errors).toEqual([]);
});
