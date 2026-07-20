import { data, type LoaderFunctionArgs } from 'react-router';

import { selectOrderById } from '../.server/enterpriseOrders.service';
import { parseOrderIdParam } from '../utils/parseOrderIdParam.util';

/**
 * Loader for the edit route: read the order by id and 404 when it is missing.
 * The awaited row seeds the Form's initial values.
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const orderId = parseOrderIdParam(params.orderId);
  const order = await selectOrderById(orderId);

  if (!order) {
    throw data('Order not found.', { status: 404 });
  }

  return { order };
};
