import { data } from 'react-router';

/**
 * Parse and validate the order id form value for the delete action. Throws a
 * 400 `data()` response (React Router control flow) for missing or invalid
 * ids; returns the numeric id otherwise.
 */
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
