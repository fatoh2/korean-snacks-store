import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals, isValidPhone, normalizeWhatsAppPhone } from '../src/utils/order.js';

test('always charges the fixed shipping fee', () => {
  assert.deepEqual(calculateOrderTotals(99), {
    shipping: 15,
    discount: 0,
    total: 114,
  });
});

test('keeps shipping and rounds promo discounts on larger orders', () => {
  assert.deepEqual(calculateOrderTotals(100.05, 15), {
    shipping: 15,
    discount: 15.01,
    total: 100.04,
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

test('normalizes Israeli phone numbers for WhatsApp links', () => {
  assert.equal(normalizeWhatsAppPhone('054-545-5666'), '972545455666');
  assert.equal(normalizeWhatsAppPhone('+972 54-545-5666'), '972545455666');
  assert.equal(normalizeWhatsAppPhone('00972 54 545 5666'), '972545455666');
  assert.equal(normalizeWhatsAppPhone('54 545 5666'), '972545455666');
});
