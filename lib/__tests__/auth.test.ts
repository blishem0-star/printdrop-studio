import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, isLegacyHash, legacyHash } from '../auth';

test('bcrypt hash verifies the correct password', () => {
  const h = hashPassword('s3cret-password');
  assert.equal(verifyPassword('s3cret-password', h), true);
  assert.equal(verifyPassword('wrong-password', h), false);
});

test('bcrypt hashes are salted (two hashes differ)', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('legacy SHA-256 hashes are detected and still verify', () => {
  const legacy = legacyHash('old-password');
  assert.equal(isLegacyHash(legacy), true);
  assert.equal(isLegacyHash(hashPassword('x')), false);
  assert.equal(verifyPassword('old-password', legacy), true);
  assert.equal(verifyPassword('not-it', legacy), false);
});

test('verifyPassword never throws on malformed stored values', () => {
  assert.equal(verifyPassword('x', ''), false);
  assert.equal(verifyPassword('x', 'not-a-hash'), false);
});
