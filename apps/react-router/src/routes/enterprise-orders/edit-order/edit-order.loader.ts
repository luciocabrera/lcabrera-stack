import type { LoaderFunctionArgs } from 'react-router';

import { data } from 'react-router';

import { selectOrderById } from '../.server/enterpriseOrders.service';
import { parseOrderIdParam } from '../utils/parseOrderIdParam.util';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const orderId = parseOrderIdParam(params.orderId);
  const order = await selectOrderById(orderId);

  if (!order) {
    throw data('Order not found.', { status: 404 });
  }

  return { order };
};
