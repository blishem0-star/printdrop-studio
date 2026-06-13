import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../rateLimit';

test('allows up to the limit, then blocks', () => {
  const key = `t-${Date.now()}-a`;
  for (let i = 0; i < 5; i++) assert.equal(rateLimit(key, 5, 60_000), true, `request ${i + 1} should pass`);
  assert.equal(rateLimit(key, 5, 60_000), false, 'request 6 should be blocked');
});

test('keys are independent', () => {
  const a = `t-${Date.now()}-b`;
  const b = `t-${Date.now()}-c`;
  assert.equal(rateLimit(a, 1, 60_000), true);
  assert.equal(rateLimit(a, 1, 60_000), false);
  assert.equal(rateLimit(b, 1, 60_000), true);
});

test('window expiry frees the budget', async () => {
  const key = `t-${Date.now()}-d`;
  assert.equal(rateLimit(key, 1, 50), true);
  assert.equal(rateLimit(key, 1, 50), false);
  await new Promise(r => setTimeout(r, 60));
  assert.equal(rateLimit(key, 1, 50), true);
});
