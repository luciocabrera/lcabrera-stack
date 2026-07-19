import { expect, it } from 'vitest';

import { ORDER_NUMBER_PATTERN } from './enterpriseOrders.schema';
import { formatOrderNumber } from './formatOrderNumber.util';

it('pads a small id to eight digits', () => {
  expect(formatOrderNumber(42)).toBe('ORD-00000042');
});

it('produces a value matching the order-number pattern', () => {
  expect(ORDER_NUMBER_PATTERN.test(formatOrderNumber(1))).toBe(true);
});

it('does not truncate an id already eight digits wide', () => {
  expect(formatOrderNumber(12_345_678)).toBe('ORD-12345678');
});
