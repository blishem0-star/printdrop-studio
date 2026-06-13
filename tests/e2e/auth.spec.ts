import { test, expect } from '@playwright/test';

// Auth API: registration, login cookie, and per-account lockout.

test('register then login issues a session, wrong password is rejected and locks out', async ({ request }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  const password = 'e2e-strong-pass-123';
  // Unique source IP so the per-IP login limit doesn't mask the per-account lockout
  const headers = { 'x-forwarded-for': `10.2.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` };

  const reg = await request.post('/api/auth/register', { data: { name: 'E2E Bot', email, password }, headers });
  expect(reg.status()).toBe(201);

  const login = await request.post('/api/auth/login', { data: { email, password }, headers });
  expect(login.status()).toBe(200);
  expect((await login.json()).role).toBe('USER');

  // 5 wrong attempts → account locked (429) on the 6th (per-account, not per-IP)
  let last = 0;
  for (let i = 0; i < 6; i++) {
    const r = await request.post('/api/auth/login', { data: { email, password: 'wrong' }, headers });
    last = r.status();
  }
  expect(last).toBe(429);
});

test('me endpoint reports no user without a session', async ({ request }) => {
  const res = await request.get('/api/auth/me');
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).user).toBeNull();
});
