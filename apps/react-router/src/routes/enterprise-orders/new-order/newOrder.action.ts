import { getErrorMessage } from '@repo/data-access/errors/getErrorMessage.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import {
  ENTERPRISE_ORDERS_PATH,
  parseOrderFormData,
  SYSTEM_ACTOR,
  toOrderFieldErrors,
  toOrderInsertValues,
} from '../config';
import {
  getNextOrderId,
  insertOrder,
} from '../server/enterpriseOrders.service';

/**
 * Server action for creating an order: re-validate authoritatively, assign the
 * next `order_id` (`getMaxValue` + 1), derive the money totals and persist via
 * the generic insert executor, then redirect to the new record's view.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = parseOrderFormData(formData);

  if (!parsed.success) {
    return { errors: toOrderFieldErrors({ error: parsed.error }) };
  }

  try {
    const orderId = await getNextOrderId();
    const values = toOrderInsertValues({
      actor: SYSTEM_ACTOR,
      input: parsed.data,
      now: new Date(),
      orderId,
    });
    await insertOrder({ values });

    return redirect(`${ENTERPRISE_ORDERS_PATH}/view/${orderId}`);
  } catch (error) {
    return {
      errors: {
        customer_name: getErrorMessage({
          error,
          fallback: 'Failed to create the order.',
        }),
      },
    };
  }
};
