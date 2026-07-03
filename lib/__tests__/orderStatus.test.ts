import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIRMED_ORDER_STATUSES, OPEN_ORDER_STATUSES, isConfirmedOrderStatus, isOpenOrderStatus } from '../orderStatus';

test('open request statuses include draft but confirmed revenue statuses do not', () => {
  assert.ok(OPEN_ORDER_STATUSES.includes('DRAFT'));
  assert.equal(isOpenOrderStatus('DRAFT'), true);
  assert.equal(isConfirmedOrderStatus('DRAFT'), false);
  assert.equal(CONFIRMED_ORDER_STATUSES.includes('DRAFT'), false);
});

test('payment-confirmed and fulfillment statuses count as confirmed value', () => {
  for (const status of ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED']) {
    assert.equal(isConfirmedOrderStatus(status), true, `${status} should be confirmed`);
  }
  assert.equal(isConfirmedOrderStatus('CANCELLED'), false);
});
