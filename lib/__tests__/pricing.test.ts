import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteOrder, qtyDiscountPct, nextTierHint, MAX_ORDER_QTY } from '../pricing';
import { SHIPPING_PRICE } from '../mockData';

test('quoteOrder applies volume tiers and adds shipping once', () => {
  const one = quoteOrder(24.99, 1);
  assert.equal(one.discountPct, 0);
  assert.equal(one.total, +(24.99 + SHIPPING_PRICE).toFixed(2));

  const two = quoteOrder(24.99, 2);
  assert.equal(two.discountPct, 5);

  const five = quoteOrder(24.99, 5);
  assert.equal(five.discountPct, 15);
  assert.equal(five.total, +(24.99 * 5 * 0.85 + SHIPPING_PRICE).toFixed(2));
});

test('quoteOrder clamps invalid quantities', () => {
  assert.equal(quoteOrder(24.99, 0).qty, 1);
  assert.equal(quoteOrder(24.99, -3).qty, 1);
  assert.equal(quoteOrder(24.99, 999).qty, MAX_ORDER_QTY);
  assert.equal(quoteOrder(24.99, NaN).qty, 1);
});

test('discount helpers are consistent', () => {
  assert.equal(qtyDiscountPct(1), 0);
  assert.equal(qtyDiscountPct(4), 10);
  assert.deepEqual(nextTierHint(1), { addQty: 1, pct: 5 });
  assert.deepEqual(nextTierHint(4), { addQty: 1, pct: 15 });
  assert.equal(nextTierHint(5), null);
});
