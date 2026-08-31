import { expect, it } from 'vite-plus/test';

import { deriveOrderTotals } from './deriveOrderTotals.util';

it('derives every total from the pricing inputs', () => {
  const totals = deriveOrderTotals({
    discountPercentage: 10,
    paidAmount: 50,
    quantity: 2,
    shippingCost: 5,
    unitPrice: 100,
  });

  expect(totals.subtotal).toBe(200);
  expect(totals.discount_amount).toBe(20);
  expect(totals.tax_amount).toBe(14.4);
  expect(totals.total_amount).toBe(199.4);
  expect(totals.balance_due).toBe(149.4);
});

it('is zero across the board for a zero-priced order', () => {
  const totals = deriveOrderTotals({
    discountPercentage: 0,
    paidAmount: 0,
    quantity: 0,
    shippingCost: 0,
    unitPrice: 0,
  });

  expect(totals).toStrictEqual({
    balance_due: 0,
    discount_amount: 0,
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
  });
});

it('rounds every amount to cents', () => {
  const totals = deriveOrderTotals({
    discountPercentage: 0,
    paidAmount: 0,
    quantity: 3,
    shippingCost: 0,
    unitPrice: 9.99,
  });

  expect(totals.subtotal).toBe(29.97);
  expect(totals.tax_amount).toBe(2.4);
  expect(totals.total_amount).toBe(32.37);
});

it('a full discount zeroes the discounted subtotal and tax', () => {
  const totals = deriveOrderTotals({
    discountPercentage: 100,
    paidAmount: 0,
    quantity: 1,
    shippingCost: 12.5,
    unitPrice: 80,
  });

  expect(totals.subtotal).toBe(80);
  expect(totals.discount_amount).toBe(80);
  expect(totals.tax_amount).toBe(0);
  expect(totals.total_amount).toBe(12.5);
  expect(totals.balance_due).toBe(12.5);
});

it('a negative balance is produced when paid exceeds total', () => {
  const totals = deriveOrderTotals({
    discountPercentage: 0,
    paidAmount: 500,
    quantity: 1,
    shippingCost: 0,
    unitPrice: 100,
  });

  expect(totals.total_amount).toBe(108);
  expect(totals.balance_due).toBe(-392);
});
