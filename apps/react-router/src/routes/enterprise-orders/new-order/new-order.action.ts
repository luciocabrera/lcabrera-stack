import { getErrorMessage } from '@repo/utils/errors/get-error-message.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { SYSTEM_ACTOR } from '@/auth/auth.constants';
import { authContext } from '@/auth/authContext';

import {
  getNextOrderId,
  insertOrder,
} from '../.server/enterpriseOrders.service';
import {
  ENTERPRISE_ORDERS_PATH,
  parseOrderFormData,
  toOrderFieldErrors,
  toOrderInsertValues,
} from '../config';

/**
 * Server action for creating an order: re-validate authoritatively, assign the
 * next `order_id` (`getMaxValue` + 1), derive the money totals and persist via
 * the generic insert executor, then redirect to the new record's view.
 */
export const action = async ({ context, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = parseOrderFormData(formData);

  if (!parsed.success) {
    return { errors: toOrderFieldErrors({ error: parsed.error }) };
  }

  try {
    const actor = context.get(authContext)?.sub ?? SYSTEM_ACTOR;
    const orderId = await getNextOrderId();
    const values = toOrderInsertValues({
      actor,
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
