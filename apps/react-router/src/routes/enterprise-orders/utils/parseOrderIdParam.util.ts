import { data } from 'react-router';

export const parseOrderIdParam = (value: string | undefined) => {
  const orderId = Number(value ?? '');

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw data('Invalid order ID.', { status: 400 });
  }

  return orderId;
};
