import { useLoaderData } from 'react-router';

import type { loader } from './order-detail.loader';

import { toOrderFormValues } from '../config';
import { OrderFormModal } from '../OrderFormModal';

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
