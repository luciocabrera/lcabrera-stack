import { useActionData } from 'react-router';

import type { action } from './new-order.action';

import { OrderFormModal } from '../OrderFormModal';

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
