import { getErrorMessage } from '@repo/data-access/errors/getErrorMessage.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';

import { authContext } from '@/auth/authContext';

import {
  ENTERPRISE_ORDERS_PATH,
  parseOrderFormData,
  toOrderFieldErrors,
  toOrderUpdateValues,
} from '../config';
import { parseOrderIdParam } from '../parseOrderIdParam.util';
import {
  selectOrderById,
  updateOrder,
} from '../server/enterpriseOrders.service';

/**
 * Server action for editing an order: re-check the target exists, re-validate
 * authoritatively, recompute the money totals and persist via the generic
 * update executor, then redirect to the record's view.
 */
export const action = async ({
  context,
  params,
  request,
}: ActionFunctionArgs) => {
  const orderId = parseOrderIdParam(params.orderId);
  const existing = await selectOrderById(orderId);

  if (!existing) {
    throw data('Order not found.', { status: 404 });
  }

  const formData = await request.formData();
  const parsed = parseOrderFormData(formData);

  if (!parsed.success) {
    return { errors: toOrderFieldErrors({ error: parsed.error }) };
  }

  try {
    const { sub: actor } = context.get(authContext);
    const values = toOrderUpdateValues({
      actor,
      input: parsed.data,
      now: new Date(),
    });
    await updateOrder({ orderId, values });

    return redirect(`${ENTERPRISE_ORDERS_PATH}/view/${orderId}`);
  } catch (error) {
    return {
      errors: {
        customer_name: getErrorMessage({
          error,
          fallback: 'Failed to update the order.',
        }),
      },
    };
  }
};
