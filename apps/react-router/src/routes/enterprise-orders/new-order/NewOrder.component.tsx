import { useActionData } from 'react-router';

import type { action } from './newOrder.action';

import { OrderFormModal } from '../OrderFormModal';

/**
 * The create-order route: renders the Form (create mode) inside a Modal over
 * the list. Surfaces any server-side field errors returned by the action.
 */
export const NewOrder = () => {
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <OrderFormModal
      mode='create'
      serverErrors={serverErrors}
      submitLabel='Create Order'
      title='New Order'
    />
  );
};
