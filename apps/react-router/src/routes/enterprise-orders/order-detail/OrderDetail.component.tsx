import { useLoaderData } from 'react-router';

import type { loader } from './order-detail.loader';

import { toOrderFormValues } from '../config';
import { OrderFormModal } from '../OrderFormModal';

/**
 * The read-only order view: renders the Form in `view` mode (label + formatted
 * value, no inputs, no footer) inside a Modal over the list.
 */
export const OrderDetail = () => {
  const { order } = useLoaderData<typeof loader>();

  return (
    <OrderFormModal
      initialValues={toOrderFormValues(order)}
      mode='view'
      title={order.order_number}
    />
  );
};
