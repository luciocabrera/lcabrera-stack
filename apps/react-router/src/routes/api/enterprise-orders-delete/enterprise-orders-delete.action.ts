import { type ActionFunctionArgs, data } from 'react-router';

import { enterpriseOrdersApi } from '@/services';

const parseOrderId = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw data({ error: 'Missing order id' }, { status: 400 });
  }

  const orderId = Number(value);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw data({ error: 'Invalid order id' }, { status: 400 });
  }

  return orderId;
};

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
