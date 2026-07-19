import { data } from 'react-router';

/**
 * Parse and validate the `:orderId` route param for the view/edit routes.
 * Throws a 400 `data()` response (React Router control flow) for a missing or
 * non-positive-integer id; returns the numeric id otherwise.
 */
export const parseOrderIdParam = (value: string | undefined) => {
  const orderId = Number(value ?? '');

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw data('Invalid order ID.', { status: 400 });
  }

  return orderId;
};
