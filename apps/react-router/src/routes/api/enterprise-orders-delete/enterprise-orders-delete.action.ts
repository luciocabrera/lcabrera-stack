import { type ActionFunctionArgs, data } from 'react-router';

import { enterpriseOrdersApi } from '@/services';

import { parseOrderId } from './parseOrderId.util';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent !== 'delete') {
    return data({ error: 'Unsupported action intent' }, { status: 400 });
  }

  const orderId = parseOrderId(formData.get('id'));

  await enterpriseOrdersApi.deleteEnterpriseOrder({
    orderId,
    requestUrl: request.url,
  });

  return data({ ok: true, orderId });
};
