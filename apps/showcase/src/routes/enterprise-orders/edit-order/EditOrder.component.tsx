import { useActionData, useLoaderData } from 'react-router';

import type { action } from './edit-order.action';
import type { loader } from './edit-order.loader';

import { toOrderFormValues } from '../config';
import { OrderFormModal } from '../OrderFormModal';

export const EditOrder = () => {
  const { order } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <OrderFormModal
      initialValues={toOrderFormValues(order)}
      mode='edit'
      serverErrors={serverErrors}
      submitLabel='Save Changes'
      title={`Edit ${order.order_number}`}
    />
  );
};
