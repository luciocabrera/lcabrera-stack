import { data } from 'react-router';

export const parseOrderId = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw data({ error: 'Missing order id' }, { status: 400 });
  }

  const orderId = Number(value);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw data({ error: 'Invalid order id' }, { status: 400 });
  }

  return orderId;
};
