import type { ClientActionFunctionArgs } from 'react-router';

import { parseOrderFormData, toOrderFieldErrors } from './config';

export const orderClientAction = async ({
  request,
  serverAction,
}: ClientActionFunctionArgs) => {
  const formData = await request.clone().formData();
  const parsed = parseOrderFormData(formData);

  return parsed.success
    ? serverAction()
    : { errors: toOrderFieldErrors({ error: parsed.error }) };
};
