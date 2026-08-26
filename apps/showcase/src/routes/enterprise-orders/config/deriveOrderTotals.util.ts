import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

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
