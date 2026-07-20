import { roundToCents } from '@repo/utils/numbers/round-to-cents.util';

/** Fixed sales-tax rate applied to the discounted subtotal. */
const TAX_RATE = 0.08;

export type DeriveOrderTotalsArgs = {
  readonly discountPercentage: number;
  readonly paidAmount: number;
  readonly quantity: number;
  readonly shippingCost: number;
  readonly unitPrice: number;
};

export type OrderTotals = {
  readonly balance_due: number;
  readonly discount_amount: number;
  readonly subtotal: number;
  readonly tax_amount: number;
  readonly total_amount: number;
};

/**
 * Derive the five computed money columns from the pricing inputs (feature plan
 * §6). Pure: `enterprise_orders` stores these as plain columns with no DB
 * default, so the action computes them here before every insert/update.
 *
 * - `subtotal      = unit_price * quantity`
 * - `discount      = subtotal * discount_percentage / 100`
 * - `tax           = (subtotal - discount) * TAX_RATE`
 * - `total         = (subtotal - discount) + tax + shipping_cost`
 * - `balance_due   = total - paid_amount`
 *
 * Each returned amount is rounded to cents to match `numeric(12,2)`.
 */
export const deriveOrderTotals = ({
  discountPercentage,
  paidAmount,
  quantity,
  shippingCost,
  unitPrice,
}: DeriveOrderTotalsArgs): OrderTotals => {
  const subtotal = unitPrice * quantity;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * TAX_RATE;
  const totalAmount = discountedSubtotal + taxAmount + shippingCost;
  const balanceDue = totalAmount - paidAmount;

  return {
    balance_due: roundToCents(balanceDue),
    discount_amount: roundToCents(discountAmount),
    subtotal: roundToCents(subtotal),
    tax_amount: roundToCents(taxAmount),
    total_amount: roundToCents(totalAmount),
  };
};
