import { type ActionFunctionArgs, data } from 'react-router';

import { deleteOrder } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

import { parseOrderId } from './parseOrderId.util';

/**
 * Delete an enterprise order via the generic `deleteRows` executor (direct
 * Postgres), replacing the retired browser-fetch call to the api-server that
 * returned a 404 (feature plan §8, bug 1).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent !== 'delete') {
    return data({ error: 'Unsupported action intent' }, { status: 400 });
  }

  const orderId = parseOrderId(formData.get('id'));

  await deleteOrder(orderId);

  return data({ ok: true, orderId });
};
