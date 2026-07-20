import { useActionData, useLoaderData } from 'react-router';

import type { action } from './edit-order.action';
import type { loader } from './edit-order.loader';

import { toOrderFormValues } from '../config';
import { OrderFormModal } from '../OrderFormModal';

/**
 * The edit-order route: renders the Form (edit mode) inside a Modal over the
 * list, prefilled from the loaded order. Computed money and audit fields are
 * read-only; server-side field errors are surfaced under their inputs.
 */
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
