import type { ActionFunctionArgs } from 'react-router';

import { getErrorMessage } from '@lcabrera/utils/errors/get-error-message.util';
import { data, redirect } from 'react-router';

import { SYSTEM_ACTOR } from '@/auth/auth.constants';
import { authContext } from '@/auth/authContext';

import {
  selectOrderById,
  updateOrder,
} from '../.server/enterpriseOrders.service';
import {
  ENTERPRISE_ORDERS_PATH,
  parseOrderFormData,
  toOrderFieldErrors,
  toOrderUpdateValues,
} from '../config';
import { parseOrderIdParam } from '../utils/parseOrderIdParam.util';

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
    const actor = context.get(authContext)?.sub ?? SYSTEM_ACTOR;
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
