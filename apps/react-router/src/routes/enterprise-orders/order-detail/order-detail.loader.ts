import type { LoaderFunctionArgs } from 'react-router';

import { enterpriseOrdersApi } from '@/services';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const orderId = Number(params.orderId ?? '');

  if (!Number.isSafeInteger(orderId)) {
    // oxlint-disable-next-line @typescript-eslint/only-throw-error -- React Router expects thrown Response objects
    throw new Response('Invalid order ID', { status: 400 });
  }

  const { data: order } = await enterpriseOrdersApi.fetchEnterpriseOrderById({
    orderId,
    requestUrl: request.url,
  });

  return { order };
};
