import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals, isValidPhone } from '../src/utils/order.js';

test('charges shipping below the free-shipping threshold', () => {
  assert.deepEqual(calculateOrderTotals(99), {
    shipping: 15,
    discount: 0,
    total: 114,
  });
});

test('applies free shipping and rounds promo discounts', () => {
  assert.deepEqual(calculateOrderTotals(100.05, 15), {
    shipping: 0,
    discount: 15.01,
    total: 85.04,
  });
});

test('clamps invalid promo percentages', () => {
  assert.equal(calculateOrderTotals(50, 200).total, 15);
  assert.equal(calculateOrderTotals(50, -10).total, 65);
});

test('accepts expected phone formats and rejects malformed values', () => {
  assert.equal(isValidPhone('+972 54-123456'), true);
  assert.equal(isValidPhone('0541234567'), true);
  assert.equal(isValidPhone('call-me'), false);
});
