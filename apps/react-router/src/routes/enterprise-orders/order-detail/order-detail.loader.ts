import type { LoaderFunctionArgs } from 'react-router';

import { data } from 'react-router';

import { parseOrderIdParam } from '../parseOrderIdParam.util';
import { selectOrderById } from '../server/enterpriseOrders.service';

/**
 * Loader for the read-only order view: read the order by id and 404 when it is
 * missing. Serves both `/enterprise-orders/view/:orderId` and the bare
 * `/enterprise-orders/:orderId` route.
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const orderId = parseOrderIdParam(params.orderId);
  const order = await selectOrderById(orderId);

  if (!order) {
    throw data('Order not found.', { status: 404 });
  }

  return { order };
};
