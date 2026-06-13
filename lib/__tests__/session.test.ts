import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from '../session';

const user = { id: 'cust_123', email: 'a@b.com', role: 'USER' };

test('token round-trips and preserves the payload', async () => {
  const token = await createSessionToken(user);
  const payload = await verifySessionToken(token);
  assert.ok(payload);
  assert.equal(payload!.id, 'cust_123');
  assert.equal(payload!.email, 'a@b.com');
  assert.equal(payload!.role, 'USER');
  assert.ok(payload!.exp > Math.floor(Date.now() / 1000));
});

test('tampered payload is rejected', async () => {
  const token = await createSessionToken(user);
  const [body, sig] = [token.slice(0, token.lastIndexOf('.')), token.slice(token.lastIndexOf('.') + 1)];
  const forged = JSON.parse(Buffer.from(body, 'base64url').toString());
  forged.role = 'OWNER';
  const forgedBody = Buffer.from(JSON.stringify(forged)).toString('base64url');
  assert.equal(await verifySessionToken(`${forgedBody}.${sig}`), null);
});

test('tampered signature is rejected', async () => {
  const token = await createSessionToken(user);
  const flipped = token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA');
  assert.equal(await verifySessionToken(flipped), null);
});

test('garbage and empty tokens are rejected without throwing', async () => {
  assert.equal(await verifySessionToken(null), null);
  assert.equal(await verifySessionToken(''), null);
  assert.equal(await verifySessionToken('abc'), null);
  assert.equal(await verifySessionToken('a.b.c.d'), null);
});

test('token signed with a different secret is rejected', async () => {
  const original = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'secret-one';
  const token = await createSessionToken(user);
  process.env.SESSION_SECRET = 'secret-two';
  assert.equal(await verifySessionToken(token), null);
  if (original === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = original;
});
