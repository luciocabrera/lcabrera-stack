import type { ActionFunctionArgs } from 'react-router';

import { data } from 'react-router';

import { deleteOrder } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

import { parseOrderId } from './parseOrderId.util';

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
